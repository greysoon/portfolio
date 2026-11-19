export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
}

export interface ContactMailerEnv {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_TO_EMAIL?: string;
  MAILER_ALLOWED_ORIGINS?: string;
  ALLOW_LOCALHOST?: string;
  RATE_LIMIT_PER_DAY?: string;
  GLOBAL_LIMIT_PER_DAY?: string;
  RATE_LIMIT_SALT?: string;
  RATE_LIMIT_KV?: KVNamespaceLike;
}

export interface ContactPayload {
  name: string;
  company: string;
  contact: string;
  interest: string;
  message: string;
  website?: string;
}

export interface ContactMailerDeps {
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

const DEFAULT_ALLOWED_ORIGINS = [
  'https://greyson.nl',
  'https://www.greyson.nl',
  'https://automate.greyson.nl',
  'https://automation.greyson.nl',
];

const MAX_BODY_BYTES = 16_384;
const DEFAULT_PER_USER_PER_DAY = 3;
const DEFAULT_GLOBAL_PER_DAY = 80;
const KV_TTL_SECONDS = 90_000; // 25 hours so daily keys expire cleanly after UTC midnight

const FIELD_LIMITS = {
  name: 100,
  company: 120,
  contact: 120,
  interest: 160,
  message: 1500,
} as const;

const fallbackMemoryStore = new Map<string, { value: string; expiresAt: number }>();

const memoryKvFallback: KVNamespaceLike = {
  async get(key: string): Promise<string | null> {
    const entry = fallbackMemoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      fallbackMemoryStore.delete(key);
      return null;
    }
    return entry.value;
  },
  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void> {
    const ttlMs = (options?.expirationTtl ?? KV_TTL_SECONDS) * 1000;
    fallbackMemoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  },
};

function sanitizeSingleLine(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x1F\x7F]/g, ' ').trim().slice(0, maxLength);
}

function sanitizeMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function isValidOrigin(origin: string | null, env: ContactMailerEnv): boolean {
  if (!origin) return false;
  const configured = (env.MAILER_ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const allowlist = configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
  if (allowlist.includes(origin)) {
    return true;
  }

  if (env.ALLOW_LOCALHOST === 'true') {
    try {
      const parsed = new URL(origin);
      return (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
      );
    } catch {
      return false;
    }
  }

  return false;
}

function buildCorsHeaders(
  origin: string | null,
  allowed: boolean
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };
  if (allowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getUtcDateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function getSecondsUntilUtcMidnight(now: Date): number {
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0
  );
  return Math.max(60, Math.ceil((nextMidnight - now.getTime()) / 1000));
}

function extractClientIp(request: Request): string {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp.trim();
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function extractValidReplyTo(contact: string): string | undefined {
  const candidate = contact.trim();
  if (
    candidate.length <= 120 &&
    /^[^\s@<>()[\]\\,;:"']+@[^\s@<>()[\]\\,;:"']+\.[^\s@<>()[\]\\,;:"']+$/.test(
      candidate
    )
  ) {
    return candidate;
  }
  return undefined;
}

async function readKvCount(kv: KVNamespaceLike, key: string): Promise<number> {
  const raw = await kv.get(key);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function createContactMailerHandler(deps: ContactMailerDeps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const nowFn = deps.now ?? (() => new Date());

  return async function handleRequest(
    request: Request,
    env: ContactMailerEnv
  ): Promise<Response> {
    const origin = request.headers.get('Origin');
    const originAllowed = isValidOrigin(origin, env);
    const corsHeaders = buildCorsHeaders(origin, originAllowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: originAllowed ? 204 : 403,
        headers: corsHeaders,
      });
    }

    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'method_not_allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    if (!originAllowed) {
      return new Response(
        JSON.stringify({ ok: false, error: 'forbidden_origin' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const contentLengthHeader = request.headers.get('Content-Length');
    if (contentLengthHeader) {
      const len = Number.parseInt(contentLengthHeader, 10);
      if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
        return new Response(
          JSON.stringify({ ok: false, error: 'payload_too_large' }),
          { status: 413, headers: corsHeaders }
        );
      }
    }

    let rawText = '';
    try {
      rawText = await request.text();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'invalid_body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (new TextEncoder().encode(rawText).byteLength > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ ok: false, error: 'payload_too_large' }),
        { status: 413, headers: corsHeaders }
      );
    }

    let parsedBody: Record<string, unknown>;
    try {
      const json = JSON.parse(rawText || '{}');
      if (!json || typeof json !== 'object' || Array.isArray(json)) {
        throw new Error('Invalid JSON object');
      }
      parsedBody = json as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'invalid_json' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const honeypot = sanitizeSingleLine(parsedBody.website, 120);
    if (honeypot.length > 0) {
      // Silently drop automated spam submissions without touching Resend or KV
      return new Response(
        JSON.stringify({ ok: true, delivered: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    const name = sanitizeSingleLine(parsedBody.name, FIELD_LIMITS.name);
    const company = sanitizeSingleLine(parsedBody.company, FIELD_LIMITS.company);
    const contact = sanitizeSingleLine(parsedBody.contact, FIELD_LIMITS.contact);
    const interest =
      sanitizeSingleLine(parsedBody.interest, FIELD_LIMITS.interest) ||
      'Website aanvraag';
    const message = sanitizeMultiline(parsedBody.message, FIELD_LIMITS.message);

    if (!name || !contact || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: 'validation_error' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const kv = env.RATE_LIMIT_KV ?? memoryKvFallback;
    const now = nowFn();
    const dateKey = getUtcDateKey(now);
    const perUserLimit = parsePositiveInt(
      env.RATE_LIMIT_PER_DAY,
      DEFAULT_PER_USER_PER_DAY
    );
    const globalLimit = parsePositiveInt(
      env.GLOBAL_LIMIT_PER_DAY,
      DEFAULT_GLOBAL_PER_DAY
    );

    const clientIp = extractClientIp(request);
    const ipHash = await sha256Hex(
      `${env.RATE_LIMIT_SALT || 'greyson-contact-2026'}:${dateKey}:${clientIp}`
    );
    const userKey = `user:${dateKey}:${ipHash}`;
    const globalKey = `global:${dateKey}`;

    const [userCount, globalCount] = await Promise.all([
      readKvCount(kv, userKey),
      readKvCount(kv, globalKey),
    ]);

    if (userCount >= perUserLimit) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'rate_limit_exceeded',
          limitPerDay: perUserLimit,
          remainingToday: 0,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(getSecondsUntilUtcMidnight(now)),
          },
        }
      );
    }

    if (globalCount >= globalLimit) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'daily_quota_reached',
          limitPerDay: perUserLimit,
          remainingToday: 0,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(getSecondsUntilUtcMidnight(now)),
          },
        }
      );
    }

    if (!env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: 'mailer_not_configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const fromEmail =
      env.RESEND_FROM_EMAIL?.trim() || 'Greyson Website <noreply@greyson.nl>';
    const toEmail = env.RESEND_TO_EMAIL?.trim() || 'info@greyson.nl';
    const subjectSuffix = company || name;
    const subject = `[Website Aanvraag] ${interest} — ${subjectSuffix}`.slice(
      0,
      200
    );

    const textBody = [
      `Nieuwe aanvraag via greyson.nl / automate.greyson.nl`,
      '',
      `Naam: ${name}`,
      `Bedrijf: ${company || '-'}`,
      `Contactgegevens: ${contact}`,
      `Onderwerp: ${interest}`,
      '',
      `Toelichting:`,
      message,
    ].join('\n');

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18191c; max-width: 600px; line-height: 1.5;">
        <h2 style="margin: 0 0 16px; color: #b83730;">Nieuwe aanvraag via greyson.nl</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr><td style="padding: 6px 8px; font-weight: 600; width: 140px; border-bottom: 1px solid #ece7e1;">Naam</td><td style="padding: 6px 8px; border-bottom: 1px solid #ece7e1;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 6px 8px; font-weight: 600; border-bottom: 1px solid #ece7e1;">Bedrijf</td><td style="padding: 6px 8px; border-bottom: 1px solid #ece7e1;">${escapeHtml(company || '-')}</td></tr>
          <tr><td style="padding: 6px 8px; font-weight: 600; border-bottom: 1px solid #ece7e1;">Contactgegevens</td><td style="padding: 6px 8px; border-bottom: 1px solid #ece7e1;">${escapeHtml(contact)}</td></tr>
          <tr><td style="padding: 6px 8px; font-weight: 600; border-bottom: 1px solid #ece7e1;">Onderwerp</td><td style="padding: 6px 8px; border-bottom: 1px solid #ece7e1;">${escapeHtml(interest)}</td></tr>
        </table>
        <div style="background: #f7f5f2; padding: 14px 16px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(message)}</div>
      </div>
    `.trim();

    const replyTo = extractValidReplyTo(contact);
    const resendPayload: Record<string, unknown> = {
      from: fromEmail,
      to: [toEmail],
      subject,
      text: textBody,
      html: htmlBody,
    };
    if (replyTo) {
      resendPayload.reply_to = replyTo;
    }

    let resendResponse: Response;
    try {
      resendResponse = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
      });
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'delivery_failed' }),
        { status: 502, headers: corsHeaders }
      );
    }

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'delivery_failed' }),
        { status: 502, headers: corsHeaders }
      );
    }

    const nextUserCount = userCount + 1;
    const nextGlobalCount = globalCount + 1;
    await Promise.all([
      kv.put(userKey, String(nextUserCount), { expirationTtl: KV_TTL_SECONDS }),
      kv.put(globalKey, String(nextGlobalCount), {
        expirationTtl: KV_TTL_SECONDS,
      }),
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        delivered: true,
        limitPerDay: perUserLimit,
        remainingToday: Math.max(0, perUserLimit - nextUserCount),
      }),
      { status: 200, headers: corsHeaders }
    );
  };
}

export default {
  fetch: createContactMailerHandler(),
};
