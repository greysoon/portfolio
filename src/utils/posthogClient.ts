/// <reference types="vite/client" />

/**
 * PostHog Cloud Bridge, Secure Owner Auth & Visitor Analytics Client (`data-analytics`)
 *
 * Strictly typed module for `greyson.nl`, `automation.greyson.nl`, `about.greyson.nl`,
 * `cv.greyson.nl`, and `/dashboard`:
 * - Zero cookies (`document.cookie` is never accessed)
 * - Cryptographic owner passphrase verification (SHA-256 + constant-time compare + 5/60s rate limit)
 * - Session-scoped Personal API key storage (`sessionStorage` only, never `localStorage`)
 * - In-memory visitor session log (`window.__GREYSON_POSTHOG_SESSION__`) + PostHog `/capture/`
 * - Live HogQL analytics queries + local telemetry fallback for immediate `/dashboard` rendering
 */

import posthog from 'posthog-js';
import {
  getTelemetrySnapshot,
  isDoNotTrackEnabled,
  sanitizeMetadata,
  sanitizeTelemetryString,
  TelemetryMetadata,
  TelemetryPrimitive,
  TelemetryStore,
  WebVitalMetricName,
} from './telemetry';

export type PostHogRegion = 'eu' | 'us';

export interface PostHogEndpoints {
  readonly region: PostHogRegion;
  readonly ingestUrl: string;
  readonly apiUrl: string;
}

export interface PostHogConfig {
  readonly region: PostHogRegion;
  readonly projectApiKey: string;
  readonly personalApiKey: string;
  readonly projectId: string;
}

export interface OwnerPassphraseResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly lockedUntil?: number;
}

export interface OwnerAuthStatus {
  readonly authenticated: boolean;
  readonly email: string | null;
  readonly failedAttempts: number;
  readonly lockedUntil: number | null;
}

export interface PostHogVisitorContext {
  readonly host: string;
  readonly pathname: string;
  readonly activeSubdomain: string;
  readonly referrer: string;
  readonly referringDomain: string;
  readonly utmSource: string;
  readonly language: string;
  readonly timezone: string;
  readonly viewport: string;
  readonly deviceType: 'Desktop' | 'Tablet' | 'Mobile' | 'Unknown';
  readonly regionHint: string;
  readonly browser: string;
  readonly os: string;
}

export interface PostHogCapturedEvent {
  readonly id: string;
  readonly event: string;
  readonly timestamp: string;
  readonly host: string;
  readonly pathname: string;
  readonly properties: Readonly<Record<string, TelemetryPrimitive>>;
}

export interface PostHogSessionStore {
  readonly version: string;
  readonly distinctId: string;
  readonly startedAt: string;
  readonly lastEventAt: string;
  readonly captureCount: number;
  readonly doNotTrack: boolean;
  readonly context: PostHogVisitorContext;
  readonly events: PostHogCapturedEvent[];
}

export interface SubdomainBreakdownItem {
  readonly subdomain: string;
  readonly visitors: number;
  readonly pageviews: number;
  readonly events: number;
}

export interface AnalyticsSummary {
  readonly totalUniqueVisitors: number;
  readonly totalPageviews: number;
  readonly inquiryClicks: number;
  readonly activeSubdomain: string;
  readonly subdomains: SubdomainBreakdownItem[];
}

export interface PostHogVisitorProfile {
  readonly distinctId: string;
  readonly city: string;
  readonly region: string;
  readonly country: string;
  readonly locationLabel: string;
  readonly timezone: string;
  readonly referringDomain: string;
  readonly deviceType: string;
  readonly browser: string;
  readonly os: string;
  readonly subdomain: string;
  readonly lastSeen: string;
  readonly eventCount: number;
}

export interface PostHogEventRecord {
  readonly id: string;
  readonly event: string;
  readonly timestamp: string;
  readonly host: string;
  readonly pathname: string;
  readonly properties: Readonly<Record<string, TelemetryPrimitive>>;
}

export interface PostHogKeyVerificationResult {
  readonly ok: boolean;
  readonly region: PostHogRegion;
  readonly projectId: string;
  readonly error?: string;
}

export interface PostHogAnalyticsResult {
  readonly ok: boolean;
  readonly source: 'posthog';
  readonly fetchedAt: string;
  readonly region: PostHogRegion;
  readonly projectId: string;
  readonly summary: AnalyticsSummary;
  readonly visitors: PostHogVisitorProfile[];
  readonly recentEvents: PostHogEventRecord[];
  readonly error?: string;
}

export interface LocalVisitorAnalytics {
  readonly source: 'local';
  readonly generatedAt: string;
  readonly doNotTrack: boolean;
  readonly context: PostHogVisitorContext;
  readonly session: PostHogSessionStore | null;
  readonly telemetry: Readonly<TelemetryStore> | null;
  readonly vitals: Partial<Record<WebVitalMetricName, number>>;
  readonly summary: AnalyticsSummary;
  readonly visitors: PostHogVisitorProfile[];
  readonly recentEvents: PostHogEventRecord[];
}

export const DEFAULT_POSTHOG_PROJECT_TOKEN = '';
export const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

interface ViteImportMetaEnv {
  readonly VITE_POSTHOG_PROJECT_TOKEN?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_REGION?: string;
}

interface RateLimitState {
  failedAttempts: number;
  lockedUntil: number | null;
}

interface HogQLApiResponse {
  readonly columns?: string[];
  readonly results?: unknown[][];
  readonly detail?: string;
  readonly error?: string;
}

declare global {
  interface Window {
    __GREYSON_POSTHOG_SESSION__?: PostHogSessionStore;
  }
}

export const OWNER_EMAIL = 'grey.beimers@gmail.com';
const PASSPHRASE_SALT = 'greyson-salt-2026:';
const OWNER_PASSPHRASE_SHA256 =
  '5220d45edc1c0e5594bba38cd485a7f3182a55f363d19e66ed90c073f59e76a1';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION_MS = 60_000;
const MAX_SESSION_EVENTS = 100;
const QUERY_TIMEOUT_MS = 15_000;

const CONFIG_STORAGE_KEY = 'greyson_posthog_config_v1';
const PERSONAL_KEY_SESSION_KEY = 'greyson_posthog_personal_key_v1';
const RATE_LIMIT_SESSION_KEY = 'greyson_dashboard_rate_limit_v1';
const OWNER_AUTH_SESSION_KEY = 'greyson_dashboard_owner_auth_v1';
const DISTINCT_ID_SESSION_KEY = 'greyson_posthog_distinct_id_v1';

const PROJECT_ID_REGEX = /^[a-zA-Z0-9_-]{1,32}$/;
const KNOWN_SUBDOMAINS = [
  'greyson.nl',
  'automation.greyson.nl',
  'automate.greyson.nl',
  'about.greyson.nl',
  'cv.greyson.nl',
] as const;

const REGION_ENDPOINTS: Record<PostHogRegion, PostHogEndpoints> = {
  eu: {
    region: 'eu',
    ingestUrl: 'https://eu.i.posthog.com',
    apiUrl: 'https://eu.posthog.com',
  },
  us: {
    region: 'us',
    ingestUrl: 'https://us.i.posthog.com',
    apiUrl: 'https://us.posthog.com',
  },
};

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

let memoryRateLimit: RateLimitState = { failedAttempts: 0, lockedUntil: null };
let memoryOwnerAuthenticated = false;
let memoryConfig: Partial<PostHogConfig> = {};
let memoryDistinctId: string | null = null;
let sessionEventCounter = 0;
let pageleaveListenerAttached = false;
let posthogSdkInitialized = false;

function readStorage(storageType: 'local' | 'session', key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const store = storageType === 'local' ? window.localStorage : window.sessionStorage;
    return store.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storageType: 'local' | 'session', key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    const store = storageType === 'local' ? window.localStorage : window.sessionStorage;
    store.setItem(key, value);
  } catch {
    // Ignore storage quota or private-mode access errors
  }
}

function removeStorage(storageType: 'local' | 'session', key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const store = storageType === 'local' ? window.localStorage : window.sessionStorage;
    store.removeItem(key);
  } catch {
    // Ignore storage access errors
  }
}

function getViteEnv(): ViteImportMetaEnv {
  try {
    const rawToken: unknown = import.meta.env?.VITE_POSTHOG_PROJECT_TOKEN;
    const rawHost: unknown = import.meta.env?.VITE_POSTHOG_HOST;
    const rawKey: unknown = import.meta.env?.VITE_POSTHOG_KEY;
    const rawRegion: unknown = import.meta.env?.VITE_POSTHOG_REGION;
    return {
      VITE_POSTHOG_PROJECT_TOKEN:
        typeof rawToken === 'string' ? rawToken : undefined,
      VITE_POSTHOG_HOST: typeof rawHost === 'string' ? rawHost : undefined,
      VITE_POSTHOG_KEY: typeof rawKey === 'string' ? rawKey : undefined,
      VITE_POSTHOG_REGION: typeof rawRegion === 'string' ? rawRegion : undefined,
    };
  } catch {
    return {};
  }
}

export function isLocalDashboardHost(host: string): boolean {
  const h = (host || '').toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '[::1]' ||
    h.endsWith('.localhost')
  );
}

export function normalizePostHogRegion(value: unknown): PostHogRegion {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'us' || normalized.includes('us.')) {
      return 'us';
    }
  }
  return 'eu';
}

function resolveConfiguredHost(rawHost: string | undefined): string | null {
  if (!rawHost) return null;
  const trimmed = rawHost.trim().replace(/\/+$/, '');
  if (/^https:\/\/[a-z0-9.-]+\.posthog\.com$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function getPostHogEndpoints(region: PostHogRegion = 'eu'): PostHogEndpoints {
  const normalizedRegion = normalizePostHogRegion(region);
  const base = REGION_ENDPOINTS[normalizedRegion];
  const env = getViteEnv();
  const configuredHost = resolveConfiguredHost(
    env.VITE_POSTHOG_HOST || DEFAULT_POSTHOG_HOST
  );

  if (configuredHost) {
    const hostRegion = normalizePostHogRegion(configuredHost);
    if (hostRegion === normalizedRegion) {
      return {
        ...base,
        ingestUrl: configuredHost,
      };
    }
  }

  return base;
}

function sanitizeConfigToken(value: unknown, maxLength = 256): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x1F\x7F\s]/g, '').slice(0, maxLength);
}

function sanitizeProjectId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const cleaned = value.trim().slice(0, 32);
  return PROJECT_ID_REGEX.test(cleaned) ? cleaned : '';
}

function encodeUtf8Bytes(input: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(input);
  }
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    let code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        const cp = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        bytes.push(
          0xf0 | (cp >> 18),
          0x80 | ((cp >> 12) & 0x3f),
          0x80 | ((cp >> 6) & 0x3f),
          0x80 | (cp & 0x3f)
        );
        i += 1;
      } else {
        bytes.push(0xef, 0xbf, 0xbd);
      }
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return new Uint8Array(bytes);
}

function rotr(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function sha256HexPureTs(bytes: Uint8Array): string {
  const byteLen = bytes.length;
  const paddedLen = Math.ceil((byteLen + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[byteLen] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLen = byteLen * 8;
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  view.setUint32(paddedLen - 8, highBits, false);
  view.setUint32(paddedLen - 4, lowBits, false);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h[0];
    let b = h[1];
    let c = h[2];
    let d = h[3];
    let e = h[4];
    let f = h[5];
    let g = h[6];
    let hh = h[7];

    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }

  let hex = '';
  for (let i = 0; i < 8; i += 1) {
    hex += h[i].toString(16).padStart(8, '0');
  }
  return hex;
}

async function computeSha256Hex(input: string): Promise<string> {
  const bytes = encodeUtf8Bytes(input);
  const subtle =
    typeof globalThis !== 'undefined' && globalThis.crypto?.subtle
      ? globalThis.crypto.subtle
      : undefined;

  if (subtle && typeof subtle.digest === 'function') {
    try {
      const normalized = new Uint8Array(bytes.byteLength);
      normalized.set(bytes);
      const digestBuffer = await subtle.digest('SHA-256', normalized.buffer);
      const digestBytes = new Uint8Array(digestBuffer);
      let hex = '';
      for (let i = 0; i < digestBytes.length; i += 1) {
        hex += digestBytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    } catch {
      // Fall through to pure-TS SHA-256 in restricted/insecure contexts
    }
  }

  return sha256HexPureTs(bytes);
}

function constantTimeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i += 1) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    diff |= charA ^ charB;
  }
  return diff === 0;
}

function loadRateLimitState(now: number): RateLimitState {
  let storedAttempts = 0;
  let storedLockedUntil: number | null = null;

  const raw = readStorage('session', RATE_LIMIT_SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { failedAttempts?: unknown; lockedUntil?: unknown };
      if (typeof parsed.failedAttempts === 'number' && Number.isFinite(parsed.failedAttempts)) {
        storedAttempts = Math.max(
          0,
          Math.min(MAX_FAILED_LOGIN_ATTEMPTS, Math.floor(parsed.failedAttempts))
        );
      }
      if (typeof parsed.lockedUntil === 'number' && Number.isFinite(parsed.lockedUntil)) {
        const boundedLock = Math.min(parsed.lockedUntil, now + LOGIN_LOCKOUT_DURATION_MS);
        storedLockedUntil = boundedLock > now ? boundedLock : null;
      }
    } catch {
      // Ignore malformed rate-limit JSON
    }
  }

  const memLock =
    memoryRateLimit.lockedUntil !== null && memoryRateLimit.lockedUntil > now
      ? memoryRateLimit.lockedUntil
      : null;

  const effectiveLock =
    memLock !== null && storedLockedUntil !== null
      ? Math.max(memLock, storedLockedUntil)
      : memLock ?? storedLockedUntil;

  const effectiveAttempts =
    effectiveLock !== null
      ? MAX_FAILED_LOGIN_ATTEMPTS
      : Math.max(memoryRateLimit.failedAttempts, storedAttempts);

  return {
    failedAttempts: effectiveAttempts,
    lockedUntil: effectiveLock,
  };
}

function saveRateLimitState(state: RateLimitState): void {
  memoryRateLimit = { ...state };
  if (state.failedAttempts === 0 && state.lockedUntil === null) {
    removeStorage('session', RATE_LIMIT_SESSION_KEY);
    return;
  }
  writeStorage('session', RATE_LIMIT_SESSION_KEY, JSON.stringify(state));
}

/**
 * Returns the current owner login session & rate-limit lockout state.
 */
export function getOwnerAuthStatus(): OwnerAuthStatus {
  const now = Date.now();
  const limit = loadRateLimitState(now);
  const storedAuth = readStorage('session', OWNER_AUTH_SESSION_KEY) === '1';
  const authenticated = memoryOwnerAuthenticated || storedAuth;
  return {
    authenticated,
    email: authenticated ? OWNER_EMAIL : null,
    failedAttempts: limit.failedAttempts,
    lockedUntil: limit.lockedUntil,
  };
}

/**
 * Signs out the owner dashboard session and optionally clears the session-scoped Personal API key.
 */
export function clearOwnerAuthSession(clearPersonalKey = true): void {
  memoryOwnerAuthenticated = false;
  removeStorage('session', OWNER_AUTH_SESSION_KEY);
  if (clearPersonalKey) {
    memoryConfig = { ...memoryConfig, personalApiKey: '' };
    removeStorage('session', PERSONAL_KEY_SESSION_KEY);
  }
}

/**
 * Verifies owner email (`grey.beimers@gmail.com`) and salted SHA-256 passphrase digest
 * in constant time with 5-attempt / 60-second lockout rate limiting.
 */
export async function verifyOwnerPassphrase(
  email: string,
  passphrase: string
): Promise<OwnerPassphraseResult> {
  const now = Date.now();
  const currentLimit = loadRateLimitState(now);

  if (currentLimit.lockedUntil !== null && now < currentLimit.lockedUntil) {
    const remainingSec = Math.max(1, Math.ceil((currentLimit.lockedUntil - now) / 1000));
    return {
      ok: false,
      error: `Too many failed login attempts. Try again in ${remainingSec}s.`,
      lockedUntil: currentLimit.lockedUntil,
    };
  }

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const trimmedPassphrase = typeof passphrase === 'string' ? passphrase.trim() : '';

  const withinBounds =
    normalizedEmail.length > 0 &&
    normalizedEmail.length <= 254 &&
    trimmedPassphrase.length > 0 &&
    trimmedPassphrase.length <= 256;

  // Always run SHA-256 digest computation before checking email to reduce timing side-channels
  const candidateDigest = await computeSha256Hex(
    `${PASSPHRASE_SALT}${withinBounds ? trimmedPassphrase : ''}`
  );
  const emailMatches = constantTimeEqual(normalizedEmail, OWNER_EMAIL);
  const hashMatches = constantTimeEqual(candidateDigest, OWNER_PASSPHRASE_SHA256);

  if (withinBounds && emailMatches && hashMatches) {
    saveRateLimitState({ failedAttempts: 0, lockedUntil: null });
    memoryOwnerAuthenticated = true;
    writeStorage('session', OWNER_AUTH_SESSION_KEY, '1');
    return { ok: true };
  }

  const nextAttempts = Math.min(MAX_FAILED_LOGIN_ATTEMPTS, currentLimit.failedAttempts + 1);
  if (nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    const lockedUntil = Date.now() + LOGIN_LOCKOUT_DURATION_MS;
    saveRateLimitState({ failedAttempts: MAX_FAILED_LOGIN_ATTEMPTS, lockedUntil });
    return {
      ok: false,
      error: 'Too many failed login attempts. Account locked for 60 seconds.',
      lockedUntil,
    };
  }

  saveRateLimitState({ failedAttempts: nextAttempts, lockedUntil: null });
  const remaining = MAX_FAILED_LOGIN_ATTEMPTS - nextAttempts;
  return {
    ok: false,
    error: `Invalid owner email or passphrase (${remaining} attempt${remaining === 1 ? '' : 's'} remaining).`,
  };
}

/**
 * Reads PostHog configuration from non-secret local storage, session-scoped secret storage,
 * and optional `VITE_POSTHOG_*` environment defaults.
 */
export function getPostHogConfig(): PostHogConfig {
  const env = getViteEnv();
  let storedRegion: PostHogRegion | undefined;
  let storedProjectKey = '';
  let storedProjectId = '';

  const rawPublic = readStorage('local', CONFIG_STORAGE_KEY);
  if (rawPublic) {
    try {
      const parsed = JSON.parse(rawPublic) as {
        region?: unknown;
        projectApiKey?: unknown;
        projectId?: unknown;
      };
      if (parsed.region === 'eu' || parsed.region === 'us') {
        storedRegion = parsed.region;
      }
      storedProjectKey = sanitizeConfigToken(parsed.projectApiKey);
      storedProjectId = sanitizeProjectId(parsed.projectId);
    } catch {
      // Ignore corrupted config JSON
    }
  }

  const envRegion = env.VITE_POSTHOG_REGION
    ? normalizePostHogRegion(env.VITE_POSTHOG_REGION)
    : env.VITE_POSTHOG_HOST
      ? normalizePostHogRegion(env.VITE_POSTHOG_HOST)
      : normalizePostHogRegion(DEFAULT_POSTHOG_HOST);
  const envProjectKey = sanitizeConfigToken(
    env.VITE_POSTHOG_PROJECT_TOKEN ||
      env.VITE_POSTHOG_KEY ||
      DEFAULT_POSTHOG_PROJECT_TOKEN
  );
  const sessionPersonalKey = sanitizeConfigToken(readStorage('session', PERSONAL_KEY_SESSION_KEY));

  return {
    region: memoryConfig.region ?? storedRegion ?? envRegion,
    projectApiKey: memoryConfig.projectApiKey ?? (storedProjectKey || envProjectKey),
    personalApiKey: memoryConfig.personalApiKey ?? sessionPersonalKey,
    projectId: memoryConfig.projectId ?? storedProjectId,
  };
}

/**
 * Saves PostHog configuration cleanly: non-secret settings (`region`, `projectApiKey`, `projectId`)
 * persist in `localStorage`, while `personalApiKey` (`phx_...`) stays strictly session-scoped (`sessionStorage`).
 */
export function savePostHogConfig(partial: Partial<PostHogConfig>): PostHogConfig {
  const current = getPostHogConfig();

  const nextRegion =
    partial.region !== undefined ? normalizePostHogRegion(partial.region) : current.region;
  const nextProjectApiKey =
    partial.projectApiKey !== undefined
      ? sanitizeConfigToken(partial.projectApiKey)
      : current.projectApiKey;
  const nextPersonalApiKey =
    partial.personalApiKey !== undefined
      ? sanitizeConfigToken(partial.personalApiKey)
      : current.personalApiKey;
  const nextProjectId =
    partial.projectId !== undefined ? sanitizeProjectId(partial.projectId) : current.projectId;

  const updated: PostHogConfig = {
    region: nextRegion,
    projectApiKey: nextProjectApiKey,
    personalApiKey: nextPersonalApiKey,
    projectId: nextProjectId,
  };

  memoryConfig = { ...updated };

  writeStorage(
    'local',
    CONFIG_STORAGE_KEY,
    JSON.stringify({
      region: updated.region,
      projectApiKey: updated.projectApiKey,
      projectId: updated.projectId,
    })
  );

  if (updated.personalApiKey) {
    writeStorage('session', PERSONAL_KEY_SESSION_KEY, updated.personalApiKey);
  } else {
    removeStorage('session', PERSONAL_KEY_SESSION_KEY);
  }

  return updated;
}

function generateRandomHex(bytesLength = 12): string {
  const bytes = new Uint8Array(bytesLength);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytesLength; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function getOrCreateDistinctId(): string {
  if (memoryDistinctId) return memoryDistinctId;
  const stored = readStorage('session', DISTINCT_ID_SESSION_KEY);
  if (stored && /^anon_[a-f0-9]{16,48}$/.test(stored)) {
    memoryDistinctId = stored;
    return stored;
  }
  const created = `anon_${generateRandomHex(12)}`;
  memoryDistinctId = created;
  writeStorage('session', DISTINCT_ID_SESSION_KEY, created);
  return created;
}

function resolveActiveSubdomain(host: string, pathname: string, search: string): string {
  const lowerHost = host.toLowerCase();
  if (lowerHost.startsWith('automation.')) return 'automation.greyson.nl';
  if (lowerHost.startsWith('automate.')) return 'automate.greyson.nl';
  if (lowerHost.startsWith('about.')) return 'about.greyson.nl';
  if (lowerHost.startsWith('cv.')) return 'cv.greyson.nl';
  if (lowerHost.startsWith('dashboard.')) return 'dashboard.greyson.nl';

  try {
    const params = new URLSearchParams(search);
    const siteParam = params.get('site')?.toLowerCase() ?? '';
    const lowerPath = pathname.toLowerCase();

    if (siteParam === 'about' || lowerPath.startsWith('/about')) return 'about.greyson.nl';
    if (siteParam === 'cv' || lowerPath.startsWith('/cv')) return 'cv.greyson.nl';
    if (siteParam === 'dashboard' || lowerPath.startsWith('/dashboard')) {
      return 'dashboard.greyson.nl';
    }
    if (siteParam === 'automate' || lowerPath.startsWith('/automate')) {
      return 'automate.greyson.nl';
    }
    if (siteParam === 'automation') return 'automation.greyson.nl';
  } catch {
    // Ignore malformed query string
  }

  if (lowerHost === 'greyson.nl' || lowerHost === 'www.greyson.nl') {
    return 'greyson.nl';
  }
  if (lowerHost === 'localhost' || lowerHost === '127.0.0.1' || !lowerHost) {
    return 'greyson.nl';
  }
  return sanitizeTelemetryString(lowerHost, 64);
}

function detectBrowser(ua: string): string {
  if (!ua) return 'Unknown';
  if (ua.includes('Edg/') || ua.includes('EdgA/') || ua.includes('EdgiOS/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Firefox/') || ua.includes('FxiOS/')) return 'Firefox';
  if (ua.includes('Chrome/') || ua.includes('CriOS/')) return 'Chrome';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Browser';
}

function detectOS(ua: string): string {
  if (!ua) return 'Unknown';
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}

function detectDeviceType(ua: string, viewportWidth: number): PostHogVisitorContext['deviceType'] {
  if (ua.includes('iPad') || ua.includes('Tablet') || (ua.includes('Android') && !ua.includes('Mobile'))) {
    return 'Tablet';
  }
  if (
    ua.includes('Mobi') ||
    ua.includes('iPhone') ||
    ua.includes('iPod') ||
    (ua.includes('Android') && ua.includes('Mobile'))
  ) {
    return 'Mobile';
  }
  if (viewportWidth > 0 && viewportWidth < 768) {
    return 'Mobile';
  }
  if (viewportWidth >= 768 && viewportWidth < 1024 && ua.includes('Touch')) {
    return 'Tablet';
  }
  return 'Desktop';
}

function deriveRegionHint(timezone: string, language: string): string {
  if (timezone === 'Europe/Amsterdam') return 'Netherlands (NL)';
  if (timezone.includes('/')) {
    const [continent, city] = timezone.split('/');
    const cleanCity = city ? city.replace(/_/g, ' ') : '';
    const langParts = language.split('-');
    const countryCode = langParts.length > 1 ? langParts[1].toUpperCase() : '';
    if (cleanCity && countryCode) return `${cleanCity}, ${continent} (${countryCode})`;
    if (cleanCity) return `${cleanCity}, ${continent}`;
    return continent;
  }
  return language ? `Locale ${language}` : 'Unknown';
}

function extractReferringDomain(rawReferrer: string): string {
  if (!rawReferrer) return 'direct';
  try {
    const parsed = new URL(rawReferrer);
    return sanitizeTelemetryString(parsed.hostname || 'direct', 120);
  } catch {
    return 'direct';
  }
}

function sanitizeReferrerUrl(rawReferrer: string): string {
  if (!rawReferrer) return '';
  try {
    const parsed = new URL(rawReferrer);
    return sanitizeTelemetryString(`${parsed.origin}${parsed.pathname}`, 160);
  } catch {
    return sanitizeTelemetryString(rawReferrer, 120);
  }
}

function collectVisitorContext(): PostHogVisitorContext {
  if (typeof window === 'undefined') {
    return {
      host: 'greyson.nl',
      pathname: '/',
      activeSubdomain: 'greyson.nl',
      referrer: '',
      referringDomain: 'direct',
      utmSource: '',
      language: 'en',
      timezone: 'UTC',
      viewport: '0x0',
      deviceType: 'Unknown',
      regionHint: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
    };
  }

  const host = sanitizeTelemetryString(window.location.hostname || 'greyson.nl', 80);
  const pathname = sanitizeTelemetryString(window.location.pathname || '/', 120);
  const search = window.location.search || '';
  const activeSubdomain = resolveActiveSubdomain(host, pathname, search);

  const rawReferrer = typeof document !== 'undefined' ? document.referrer || '' : '';
  const referrer = sanitizeReferrerUrl(rawReferrer);
  const referringDomain = extractReferringDomain(rawReferrer);

  let utmSource = '';
  try {
    utmSource = sanitizeTelemetryString(
      new URLSearchParams(search).get('utm_source')?.trim() ?? '',
      64
    );
  } catch {
    utmSource = '';
  }

  const language = sanitizeTelemetryString(
    (typeof navigator !== 'undefined' && navigator.language) || 'en',
    32
  );

  let timezone = 'UTC';
  try {
    timezone = sanitizeTelemetryString(
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      64
    );
  } catch {
    timezone = 'UTC';
  }

  const width = Number.isFinite(window.innerWidth) ? Math.max(0, Math.round(window.innerWidth)) : 0;
  const height = Number.isFinite(window.innerHeight) ? Math.max(0, Math.round(window.innerHeight)) : 0;
  const viewport = `${width}x${height}`;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const browser = detectBrowser(ua);
  const os = detectOS(ua);
  const deviceType = detectDeviceType(ua, width);
  const regionHint = deriveRegionHint(timezone, language);

  return {
    host,
    pathname,
    activeSubdomain,
    referrer,
    referringDomain,
    utmSource,
    language,
    timezone,
    viewport,
    deviceType,
    regionHint,
    browser,
    os,
  };
}

function getOrCreateSessionStore(): PostHogSessionStore | null {
  if (typeof window === 'undefined') return null;

  const currentContext = collectVisitorContext();
  if (!window.__GREYSON_POSTHOG_SESSION__) {
    const nowIso = new Date().toISOString();
    window.__GREYSON_POSTHOG_SESSION__ = {
      version: '1.0.0',
      distinctId: getOrCreateDistinctId(),
      startedAt: nowIso,
      lastEventAt: nowIso,
      captureCount: 0,
      doNotTrack: isDoNotTrackEnabled(),
      context: currentContext,
      events: [],
    };
  } else {
    window.__GREYSON_POSTHOG_SESSION__ = {
      ...window.__GREYSON_POSTHOG_SESSION__,
      context: currentContext,
    };
  }

  return window.__GREYSON_POSTHOG_SESSION__;
}

function ensurePostHogSdkInitialized(session: PostHogSessionStore): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.pathname.startsWith('/dashboard')) return false;

  const config = getPostHogConfig();
  if (!config.projectApiKey || !config.projectApiKey.startsWith('phc_')) {
    return false;
  }

  if (posthogSdkInitialized) {
    return true;
  }

  const endpoints = getPostHogEndpoints(config.region);
  try {
    posthog.init(config.projectApiKey, {
      api_host: endpoints.ingestUrl,
      ui_host: endpoints.apiUrl,
      person_profiles: 'always',
      persistence: 'sessionStorage',
      bootstrap: {
        distinctID: session.distinctId,
      },
      autocapture: true,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
      },
      loaded: (ph) => {
        ph.register({ distinct_id: session.distinctId });
        ph.startSessionRecording();
      },
    });
    posthogSdkInitialized = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Initializes the in-memory PostHog visitor session bridge (`window.__GREYSON_POSTHOG_SESSION__`)
 * and boots the PostHog JS SDK with Session Replay enabled.
 * Safe and idempotent to call on application mount.
 */
export function initPostHogBridge(): PostHogSessionStore | null {
  const session = getOrCreateSessionStore();
  if (session) {
    ensurePostHogSdkInitialized(session);
  }
  if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    !pageleaveListenerAttached
  ) {
    pageleaveListenerAttached = true;
    const sendLeave = () => {
      capturePostHogEvent('$pageleave');
    };
    window.addEventListener('pagehide', sendLeave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendLeave();
      }
    });
  }
  return session;
}

/**
 * Records an enriched visitor event in `window.__GREYSON_POSTHOG_SESSION__` and forwards it
 * via the `posthog-js` SDK (with Session Replay correlation) or `fetch()` fallback when a
 * Project API Key (`phc_...`) is configured.
 */
export function capturePostHogEvent(
  eventName: string,
  properties?: TelemetryMetadata
): void {
  const session = getOrCreateSessionStore();
  if (!session) return;

  const cleanEvent = sanitizeTelemetryString(String(eventName).trim(), 80);
  if (!cleanEvent) return;

  const ctx = session.context;
  const cleanCustomProps = sanitizeMetadata(properties) ?? {};
  const timestamp = new Date().toISOString();

  sessionEventCounter += 1;
  const eventRecord: PostHogCapturedEvent = {
    id: `ph_${sessionEventCounter}_${Date.now()}`,
    event: cleanEvent,
    timestamp,
    host: ctx.activeSubdomain || ctx.host,
    pathname: ctx.pathname,
    properties: Object.freeze({
      host: ctx.host,
      subdomain: ctx.activeSubdomain,
      pathname: ctx.pathname,
      referrer: ctx.referrer,
      referringDomain: ctx.referringDomain,
      utmSource: ctx.utmSource,
      language: ctx.language,
      timezone: ctx.timezone,
      viewport: ctx.viewport,
      deviceType: ctx.deviceType,
      regionHint: ctx.regionHint,
      browser: ctx.browser,
      os: ctx.os,
      ...cleanCustomProps,
    }),
  };

  const nextEvents =
    session.events.length >= MAX_SESSION_EVENTS
      ? [...session.events.slice(1), eventRecord]
      : [...session.events, eventRecord];

  window.__GREYSON_POSTHOG_SESSION__ = {
    ...session,
    lastEventAt: timestamp,
    captureCount: session.captureCount + 1,
    events: nextEvents,
  };

  const config = getPostHogConfig();
  if (!config.projectApiKey || !config.projectApiKey.startsWith('phc_')) {
    return;
  }

  const endpoints = getPostHogEndpoints(config.region);
  const currentUrl =
    typeof window !== 'undefined'
      ? sanitizeTelemetryString(`${window.location.origin}${window.location.pathname}`, 200)
      : `https://${ctx.activeSubdomain}${ctx.pathname}`;

  const eventProperties: Record<string, unknown> = {
    $current_url: currentUrl,
    $host: ctx.activeSubdomain || ctx.host,
    $pathname: ctx.pathname,
    $referrer: ctx.referrer || undefined,
    $referring_domain: ctx.referringDomain,
    utm_source: ctx.utmSource || undefined,
    $browser: ctx.browser,
    $os: ctx.os,
    $device_type: ctx.deviceType,
    $timezone: ctx.timezone,
    language: ctx.language,
    viewport: ctx.viewport,
    region_hint: ctx.regionHint,
    $set: {
      $browser: ctx.browser,
      $os: ctx.os,
      $device_type: ctx.deviceType,
      $timezone: ctx.timezone,
      language: ctx.language,
      region_hint: ctx.regionHint,
      last_subdomain: ctx.activeSubdomain || ctx.host,
    },
    ...cleanCustomProps,
  };

  const sdkActive = ensurePostHogSdkInitialized(session);
  if (sdkActive) {
    try {
      posthog.capture(cleanEvent, eventProperties);
      return;
    } catch {
      // Fall back to direct HTTP capture if SDK capture fails
    }
  }

  if (typeof fetch !== 'function') {
    return;
  }

  const payload = {
    api_key: config.projectApiKey,
    event: cleanEvent,
    distinct_id: session.distinctId,
    timestamp,
    properties: eventProperties,
  };

  try {
    void fetch(`${endpoints.ingestUrl}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Ignore network/adblocker errors silently so visitor experience is never disrupted
    });
  } catch {
    // Ignore synchronous fetch construction errors
  }
}

async function executeHogQLQuery(
  endpoints: PostHogEndpoints,
  projectId: string,
  personalApiKey: string,
  query: string,
  signal?: AbortSignal
): Promise<HogQLApiResponse> {
  const response = await fetch(
    `${endpoints.apiUrl}/api/projects/${encodeURIComponent(projectId)}/query/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${personalApiKey}`,
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query,
        },
      }),
      signal,
    }
  );

  let parsed: HogQLApiResponse = {};
  try {
    parsed = (await response.json()) as HogQLApiResponse;
  } catch {
    // Response may be empty or non-JSON on gateway errors
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Unauthorized: check your PostHog Personal API Key (phx_...) and project query permissions.');
    }
    if (response.status === 404) {
      throw new Error('PostHog project not found. Check your Project ID and Region (EU/US).');
    }
    if (response.status === 429) {
      throw new Error('PostHog API rate limit reached. Please wait a moment and try again.');
    }
    const detail = parsed.detail || parsed.error;
    throw new Error(
      detail
        ? sanitizeTelemetryString(detail, 180)
        : `PostHog API request failed (HTTP ${response.status}).`
    );
  }

  return parsed;
}

/**
 * Verifies a PostHog Personal API Key (`phx_...`) and Project ID directly against
 * PostHog's live Query API (`POST https://${region}.posthog.com/api/projects/${projectId}/query/`).
 */
export async function verifyPostHogPersonalKey(
  personalApiKey: string,
  projectId: string,
  region: PostHogRegion = 'eu'
): Promise<PostHogKeyVerificationResult> {
  const safeRegion = normalizePostHogRegion(region);
  const cleanKey = sanitizeConfigToken(personalApiKey);
  const cleanProjectId = sanitizeProjectId(projectId);

  if (!cleanKey || !cleanKey.startsWith('phx_')) {
    return {
      ok: false,
      region: safeRegion,
      projectId: cleanProjectId,
      error: 'Enter a valid PostHog Personal API Key starting with phx_.',
    };
  }

  if (!cleanProjectId) {
    return {
      ok: false,
      region: safeRegion,
      projectId: '',
      error: 'Enter a valid numeric or alphanumeric PostHog Project ID.',
    };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)
    : undefined;

  try {
    await executeHogQLQuery(
      getPostHogEndpoints(safeRegion),
      cleanProjectId,
      cleanKey,
      'SELECT 1 AS ok',
      controller?.signal
    );

    return {
      ok: true,
      region: safeRegion,
      projectId: cleanProjectId,
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'PostHog verification timed out. Check your connection and region.'
        : err instanceof Error
          ? err.message
          : 'Unable to verify PostHog Personal API Key.';
    return {
      ok: false,
      region: safeRegion,
      projectId: cleanProjectId,
      error: sanitizeTelemetryString(message, 200),
    };
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

function getColumnValue(
  row: unknown[],
  columns: string[] | undefined,
  columnName: string,
  fallbackIndex: number
): unknown {
  if (columns && columns.length > 0) {
    const idx = columns.indexOf(columnName);
    if (idx !== -1 && idx < row.length) {
      return row[idx];
    }
  }
  return fallbackIndex < row.length ? row[fallbackIndex] : undefined;
}

function toSafeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toSafeString(value: unknown, fallback = '', maxLength = 120): string {
  if (typeof value !== 'string') {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return fallback;
  }
  const clean = sanitizeTelemetryString(value.trim(), maxLength);
  return clean || fallback;
}

function mergeSubdomainBreakdown(
  observed: SubdomainBreakdownItem[],
  activeSubdomain: string
): SubdomainBreakdownItem[] {
  const bySubdomain = new Map<string, SubdomainBreakdownItem>();

  for (const domain of KNOWN_SUBDOMAINS) {
    bySubdomain.set(domain, { subdomain: domain, visitors: 0, pageviews: 0, events: 0 });
  }

  for (const item of observed) {
    const key = item.subdomain || 'unknown';
    const existing = bySubdomain.get(key);
    if (existing) {
      bySubdomain.set(key, {
        subdomain: key,
        visitors: existing.visitors + item.visitors,
        pageviews: existing.pageviews + item.pageviews,
        events: existing.events + item.events,
      });
    } else {
      bySubdomain.set(key, item);
    }
  }

  if (activeSubdomain && !bySubdomain.has(activeSubdomain)) {
    bySubdomain.set(activeSubdomain, {
      subdomain: activeSubdomain,
      visitors: 0,
      pageviews: 0,
      events: 0,
    });
  }

  return Array.from(bySubdomain.values());
}

/**
 * Fetches live KPIs, subdomain breakdown, visitor profiles, and recent event stream
 * from PostHog Cloud using HogQL (`POST /api/projects/:id/query/`).
 */
export async function fetchPostHogAnalytics(
  configOverride?: Partial<PostHogConfig>
): Promise<PostHogAnalyticsResult> {
  const baseConfig = getPostHogConfig();
  const region = normalizePostHogRegion(configOverride?.region ?? baseConfig.region);
  const personalApiKey = sanitizeConfigToken(
    configOverride?.personalApiKey ?? baseConfig.personalApiKey
  );
  const projectId = sanitizeProjectId(configOverride?.projectId ?? baseConfig.projectId);
  const activeSubdomain = collectVisitorContext().activeSubdomain;

  const emptySummary: AnalyticsSummary = {
    totalUniqueVisitors: 0,
    totalPageviews: 0,
    inquiryClicks: 0,
    activeSubdomain,
    subdomains: mergeSubdomainBreakdown([], activeSubdomain),
  };

  if (!personalApiKey || !personalApiKey.startsWith('phx_')) {
    return {
      ok: false,
      source: 'posthog',
      fetchedAt: new Date().toISOString(),
      region,
      projectId,
      summary: emptySummary,
      visitors: [],
      recentEvents: [],
      error: 'PostHog Personal API Key (phx_...) is required to query live analytics.',
    };
  }

  if (!projectId) {
    return {
      ok: false,
      source: 'posthog',
      fetchedAt: new Date().toISOString(),
      region,
      projectId: '',
      summary: emptySummary,
      visitors: [],
      recentEvents: [],
      error: 'PostHog Project ID is required to query live analytics.',
    };
  }

  const endpoints = getPostHogEndpoints(region);
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)
    : undefined;

  const kpiQuery = `
    SELECT
      uniqExact(distinct_id) AS unique_visitors,
      countIf(event = '$pageview') AS total_pageviews,
      countIf(
        event IN (
          'automate_inquiry_submit',
          'automate_direct_email_click',
          'contact_click',
          'automate_cta_click',
          'automate_link_click'
        )
      ) AS inquiry_clicks
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
  `.trim();

  const subdomainQuery = `
    SELECT
      coalesce(nullIf(properties.$host, ''), 'unknown') AS host,
      uniqExact(distinct_id) AS unique_visitors,
      countIf(event = '$pageview') AS pageviews,
      count() AS total_events
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
    GROUP BY host
    ORDER BY total_events DESC
    LIMIT 20
  `.trim();

  const visitorsQuery = `
    SELECT
      distinct_id,
      argMax(properties.$geoip_city_name, timestamp) AS city,
      argMax(properties.$geoip_subdivision_1_name, timestamp) AS region,
      argMax(properties.$geoip_country_name, timestamp) AS country,
      argMax(properties.$timezone, timestamp) AS timezone,
      argMax(properties.$referring_domain, timestamp) AS referring_domain,
      argMax(properties.$device_type, timestamp) AS device_type,
      argMax(properties.$browser, timestamp) AS browser,
      argMax(properties.$os, timestamp) AS os,
      argMax(properties.$host, timestamp) AS host,
      max(timestamp) AS last_seen,
      count() AS event_count
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
    GROUP BY distinct_id
    ORDER BY last_seen DESC
    LIMIT 50
  `.trim();

  const eventsQuery = `
    SELECT
      event,
      timestamp,
      properties.$host AS host,
      properties.$pathname AS pathname,
      properties.$referring_domain AS referring_domain,
      properties.$device_type AS device_type,
      properties.$browser AS browser,
      properties.$os AS os,
      properties.view AS view,
      properties.interest AS interest,
      properties.lang AS lang,
      properties.target AS target
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
    ORDER BY timestamp DESC
    LIMIT 50
  `.trim();

  try {
    const [kpiRes, subdomainRes, visitorsRes, eventsRes] = await Promise.all([
      executeHogQLQuery(endpoints, projectId, personalApiKey, kpiQuery, controller?.signal),
      executeHogQLQuery(endpoints, projectId, personalApiKey, subdomainQuery, controller?.signal),
      executeHogQLQuery(endpoints, projectId, personalApiKey, visitorsQuery, controller?.signal),
      executeHogQLQuery(endpoints, projectId, personalApiKey, eventsQuery, controller?.signal),
    ]);

    const kpiRow = kpiRes.results?.[0] ?? [];
    const totalUniqueVisitors = toSafeNumber(
      getColumnValue(kpiRow, kpiRes.columns, 'unique_visitors', 0)
    );
    const totalPageviews = toSafeNumber(
      getColumnValue(kpiRow, kpiRes.columns, 'total_pageviews', 1)
    );
    const inquiryClicks = toSafeNumber(
      getColumnValue(kpiRow, kpiRes.columns, 'inquiry_clicks', 2)
    );

    const observedSubdomains: SubdomainBreakdownItem[] = (subdomainRes.results ?? []).map((row) => ({
      subdomain: toSafeString(getColumnValue(row, subdomainRes.columns, 'host', 0), 'unknown', 80),
      visitors: toSafeNumber(getColumnValue(row, subdomainRes.columns, 'unique_visitors', 1)),
      pageviews: toSafeNumber(getColumnValue(row, subdomainRes.columns, 'pageviews', 2)),
      events: toSafeNumber(getColumnValue(row, subdomainRes.columns, 'total_events', 3)),
    }));

    const visitors: PostHogVisitorProfile[] = (visitorsRes.results ?? []).map((row) => {
      const city = toSafeString(getColumnValue(row, visitorsRes.columns, 'city', 1), '', 64);
      const subRegion = toSafeString(getColumnValue(row, visitorsRes.columns, 'region', 2), '', 64);
      const country = toSafeString(getColumnValue(row, visitorsRes.columns, 'country', 3), '', 64);
      const locationParts = [city, subRegion, country].filter(Boolean);
      const timezone = toSafeString(
        getColumnValue(row, visitorsRes.columns, 'timezone', 4),
        'UTC',
        64
      );

      return {
        distinctId: toSafeString(
          getColumnValue(row, visitorsRes.columns, 'distinct_id', 0),
          'anonymous',
          80
        ),
        city,
        region: subRegion,
        country,
        locationLabel: locationParts.length > 0 ? locationParts.join(', ') : timezone,
        timezone,
        referringDomain: toSafeString(
          getColumnValue(row, visitorsRes.columns, 'referring_domain', 5),
          'direct',
          100
        ),
        deviceType: toSafeString(
          getColumnValue(row, visitorsRes.columns, 'device_type', 6),
          'Unknown',
          32
        ),
        browser: toSafeString(
          getColumnValue(row, visitorsRes.columns, 'browser', 7),
          'Unknown',
          40
        ),
        os: toSafeString(getColumnValue(row, visitorsRes.columns, 'os', 8), 'Unknown', 40),
        subdomain: toSafeString(
          getColumnValue(row, visitorsRes.columns, 'host', 9),
          'greyson.nl',
          80
        ),
        lastSeen: toSafeString(getColumnValue(row, visitorsRes.columns, 'last_seen', 10), '', 40),
        eventCount: toSafeNumber(getColumnValue(row, visitorsRes.columns, 'event_count', 11)),
      };
    });

    const recentEvents: PostHogEventRecord[] = (eventsRes.results ?? []).map((row, idx) => {
      const timestamp = toSafeString(
        getColumnValue(row, eventsRes.columns, 'timestamp', 1),
        '',
        40
      );
      const eventName = toSafeString(
        getColumnValue(row, eventsRes.columns, 'event', 0),
        'unknown',
        80
      );
      const host = toSafeString(
        getColumnValue(row, eventsRes.columns, 'host', 2),
        'greyson.nl',
        80
      );
      const pathname = toSafeString(getColumnValue(row, eventsRes.columns, 'pathname', 3), '/', 120);

      const rawProps: TelemetryMetadata = {};
      const referringDomain = toSafeString(
        getColumnValue(row, eventsRes.columns, 'referring_domain', 4),
        '',
        100
      );
      const deviceType = toSafeString(
        getColumnValue(row, eventsRes.columns, 'device_type', 5),
        '',
        32
      );
      const browser = toSafeString(getColumnValue(row, eventsRes.columns, 'browser', 6), '', 40);
      const os = toSafeString(getColumnValue(row, eventsRes.columns, 'os', 7), '', 40);
      const view = toSafeString(getColumnValue(row, eventsRes.columns, 'view', 8), '', 32);
      const interest = toSafeString(getColumnValue(row, eventsRes.columns, 'interest', 9), '', 120);
      const lang = toSafeString(getColumnValue(row, eventsRes.columns, 'lang', 10), '', 16);
      const target = toSafeString(getColumnValue(row, eventsRes.columns, 'target', 11), '', 64);

      if (referringDomain) rawProps.referringDomain = referringDomain;
      if (deviceType) rawProps.deviceType = deviceType;
      if (browser) rawProps.browser = browser;
      if (os) rawProps.os = os;
      if (view) rawProps.view = view;
      if (interest) rawProps.interest = interest;
      if (lang) rawProps.lang = lang;
      if (target) rawProps.target = target;

      return {
        id: `ph_live_${idx}_${timestamp || 'evt'}`,
        event: eventName,
        timestamp,
        host,
        pathname,
        properties: sanitizeMetadata(rawProps) ?? Object.freeze({}),
      };
    });

    return {
      ok: true,
      source: 'posthog',
      fetchedAt: new Date().toISOString(),
      region,
      projectId,
      summary: {
        totalUniqueVisitors,
        totalPageviews,
        inquiryClicks,
        activeSubdomain,
        subdomains: mergeSubdomainBreakdown(observedSubdomains, activeSubdomain),
      },
      visitors,
      recentEvents,
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'PostHog query timed out. Please retry.'
        : err instanceof Error
          ? err.message
          : 'Failed to fetch PostHog analytics.';

    return {
      ok: false,
      source: 'posthog',
      fetchedAt: new Date().toISOString(),
      region,
      projectId,
      summary: emptySummary,
      visitors: [],
      recentEvents: [],
      error: sanitizeTelemetryString(message, 200),
    };
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

function isInquiryEventName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower === 'automate_inquiry_submit' ||
    lower === 'automate_direct_email_click' ||
    lower === 'contact_click' ||
    lower === 'automate_cta_click' ||
    lower === 'automate_link_click' ||
    lower.includes('inquiry') ||
    lower.includes('contact')
  );
}

/**
 * Combines `getTelemetrySnapshot()` (`./telemetry`) with live in-memory visitor session
 * context (`window.__GREYSON_POSTHOG_SESSION__`) so `/dashboard` immediately renders
 * live visitor/session metrics, Web Vitals, and recorded interactions before PostHog Cloud is queried.
 */
export function getLocalVisitorAnalytics(): LocalVisitorAnalytics {
  const telemetry = getTelemetrySnapshot();
  const session = getOrCreateSessionStore();
  const context = session?.context ?? collectVisitorContext();

  const sessionEvents: PostHogEventRecord[] = (session?.events ?? []).map((evt) => ({
    id: evt.id,
    event: evt.event,
    timestamp: evt.timestamp,
    host: evt.host,
    pathname: evt.pathname,
    properties: evt.properties,
  }));

  const telemetryBaseMs = telemetry?.initializedAt ?? Date.now();
  const telemetryEvents: PostHogEventRecord[] = (telemetry?.events ?? []).map((evt) => ({
    id: evt.id,
    event: evt.name,
    timestamp: new Date(telemetryBaseMs + evt.timestamp).toISOString(),
    host: context.activeSubdomain,
    pathname: context.pathname,
    properties: Object.freeze({
      type: evt.type,
      ...(evt.value !== undefined ? { value: evt.value } : {}),
      ...(evt.rating ? { rating: evt.rating } : {}),
      ...(evt.metadata ?? {}),
    }),
  }));

  const recentEvents = [...sessionEvents, ...telemetryEvents].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );

  const subdomainStats = new Map<string, { pageviews: number; events: number }>();
  let totalPageviews = 0;
  let inquiryClicks = 0;

  for (const evt of sessionEvents) {
    const bucket = subdomainStats.get(evt.host) ?? { pageviews: 0, events: 0 };
    bucket.events += 1;
    if (evt.event === '$pageview') {
      bucket.pageviews += 1;
      totalPageviews += 1;
    }
    if (isInquiryEventName(evt.event)) {
      inquiryClicks += 1;
    }
    subdomainStats.set(evt.host, bucket);
  }

  for (const evt of telemetryEvents) {
    if (isInquiryEventName(evt.event)) {
      inquiryClicks += 1;
    }
  }

  if (totalPageviews === 0 && (session !== null || telemetry !== null)) {
    totalPageviews = 1;
    const activeBucket = subdomainStats.get(context.activeSubdomain) ?? {
      pageviews: 0,
      events: 0,
    };
    activeBucket.pageviews = 1;
    activeBucket.events = Math.max(1, activeBucket.events + telemetryEvents.length);
    subdomainStats.set(context.activeSubdomain, activeBucket);
  }

  const observedSubdomains: SubdomainBreakdownItem[] = Array.from(subdomainStats.entries()).map(
    ([subdomain, counts]) => ({
      subdomain,
      visitors: 1,
      pageviews: counts.pageviews,
      events: counts.events,
    })
  );

  const localVisitor: PostHogVisitorProfile = {
    distinctId: session?.distinctId ?? getOrCreateDistinctId(),
    city: '',
    region: '',
    country: '',
    locationLabel: context.regionHint,
    timezone: context.timezone,
    referringDomain: context.referringDomain,
    deviceType: context.deviceType,
    browser: context.browser,
    os: context.os,
    subdomain: context.activeSubdomain,
    lastSeen: session?.lastEventAt ?? new Date().toISOString(),
    eventCount: sessionEvents.length + telemetryEvents.length,
  };

  return {
    source: 'local',
    generatedAt: new Date().toISOString(),
    doNotTrack: telemetry?.doNotTrack ?? session?.doNotTrack ?? isDoNotTrackEnabled(),
    context,
    session,
    telemetry,
    vitals: { ...(telemetry?.vitals ?? {}) },
    summary: {
      totalUniqueVisitors: 1,
      totalPageviews,
      inquiryClicks,
      activeSubdomain: context.activeSubdomain,
      subdomains: mergeSubdomainBreakdown(observedSubdomains, context.activeSubdomain),
    },
    visitors: [localVisitor],
    recentEvents: recentEvents.slice(0, MAX_SESSION_EVENTS),
  };
}
