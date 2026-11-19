import assert from 'node:assert/strict';
import test from 'node:test';
import { createContactMailerHandler } from '../workers/contact-mailer/src/index.ts';

function createMemoryKv() {
  const store = new Map();
  return {
    store,
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

function createEnv(overrides = {}) {
  return {
    RESEND_API_KEY: 're_test_123',
    RESEND_FROM_EMAIL: 'Greyson Website <noreply@greyson.nl>',
    RESEND_TO_EMAIL: 'info@greyson.nl',
    MAILER_ALLOWED_ORIGINS: 'https://greyson.nl,https://automate.greyson.nl',
    RATE_LIMIT_PER_DAY: '3',
    GLOBAL_LIMIT_PER_DAY: '80',
    RATE_LIMIT_SALT: 'test-salt',
    RATE_LIMIT_KV: createMemoryKv(),
    ...overrides,
  };
}

function createPostRequest(body, { origin = 'https://automate.greyson.nl', ip = '203.0.113.10' } = {}) {
  return new Request('https://mailer.greyson.nl/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      'CF-Connecting-IP': ip,
    },
    body: JSON.stringify(body),
  });
}

test('allows 3 emails per user per day and blocks the 4th with 429', async () => {
  const resendCalls = [];
  let currentNow = new Date('2026-11-19T12:00:00Z');
  const handler = createContactMailerHandler({
    now: () => currentNow,
    fetchImpl: async (url, init) => {
      resendCalls.push({ url, body: JSON.parse(String(init.body)) });
      return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 });
    },
  });
  const env = createEnv();

  const validPayload = {
    name: 'Jan de Vries',
    company: 'Bouwbedrijf <Fryslân>',
    contact: 'jan@bouwbedrijf.nl',
    interest: 'Offerte automatiseren',
    message: 'Hoi <script>alert(1)</script> testbericht.',
  };

  for (let i = 1; i <= 3; i += 1) {
    const res = await handler(createPostRequest(validPayload), env);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.equal(json.limitPerDay, 3);
    assert.equal(json.remainingToday, 3 - i);
  }

  assert.equal(resendCalls.length, 3);
  assert.equal(resendCalls[0].url, 'https://api.resend.com/emails');
  assert.deepEqual(resendCalls[0].body.to, ['info@greyson.nl']);
  assert.equal(resendCalls[0].body.reply_to, 'jan@bouwbedrijf.nl');
  assert.ok(!resendCalls[0].body.html.includes('<script>'));
  assert.ok(resendCalls[0].body.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));

  // 4th attempt on the same day from the same IP is blocked with 429
  const blockedRes = await handler(createPostRequest(validPayload), env);
  assert.equal(blockedRes.status, 429);
  const blockedJson = await blockedRes.json();
  assert.equal(blockedJson.ok, false);
  assert.equal(blockedJson.error, 'rate_limit_exceeded');
  assert.equal(blockedJson.remainingToday, 0);
  assert.equal(resendCalls.length, 3);

  // A different visitor IP on the same day still succeeds
  const otherUserRes = await handler(
    createPostRequest(validPayload, { ip: '198.51.100.42' }),
    env
  );
  assert.equal(otherUserRes.status, 200);
  assert.equal(resendCalls.length, 4);

  // The next day resets the quota for the first IP
  currentNow = new Date('2026-11-20T08:00:00Z');
  const nextDayRes = await handler(createPostRequest(validPayload), env);
  assert.equal(nextDayRes.status, 200);
  const nextDayJson = await nextDayRes.json();
  assert.equal(nextDayJson.remainingToday, 2);
});

test('silently drops honeypot submissions without calling Resend or consuming quota', async () => {
  let called = 0;
  const handler = createContactMailerHandler({
    fetchImpl: async () => {
      called += 1;
      return new Response('{}', { status: 200 });
    },
  });
  const env = createEnv();

  const res = await handler(
    createPostRequest({
      name: 'Bot',
      contact: 'bot@spam.example',
      message: 'Buy crypto',
      website: 'https://spam.example',
    }),
    env
  );
  assert.equal(res.status, 200);
  assert.equal(called, 0);
  assert.equal(env.RATE_LIMIT_KV.store.size, 0);
});

test('enforces allowed origins and global daily safety cap', async () => {
  let called = 0;
  const handler = createContactMailerHandler({
    fetchImpl: async () => {
      called += 1;
      return new Response('{}', { status: 200 });
    },
  });
  const env = createEnv({ GLOBAL_LIMIT_PER_DAY: '2' });

  const badOriginRes = await handler(
    createPostRequest(
      { name: 'Test', contact: 'a@b.nl', message: 'Hi' },
      { origin: 'https://evil.example' }
    ),
    env
  );
  assert.equal(badOriginRes.status, 403);

  // Two different users consume the global cap of 2
  const r1 = await handler(
    createPostRequest({ name: 'A', contact: 'a@b.nl', message: '1' }, { ip: '1.1.1.1' }),
    env
  );
  const r2 = await handler(
    createPostRequest({ name: 'B', contact: 'b@b.nl', message: '2' }, { ip: '2.2.2.2' }),
    env
  );
  const r3 = await handler(
    createPostRequest({ name: 'C', contact: 'c@b.nl', message: '3' }, { ip: '3.3.3.3' }),
    env
  );
  assert.equal(r1.status, 200);
  assert.equal(r2.status, 200);
  assert.equal(r3.status, 429);
  const j3 = await r3.json();
  assert.equal(j3.error, 'daily_quota_reached');
  assert.equal(called, 2);
});
