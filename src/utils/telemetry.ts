/**
 * Privacy-First Telemetry & Core Web Vitals Utility (`data-analytics`)
 *
 * Zero-dependency, strictly typed browser telemetry module designed for `greyson.nl`.
 * - Zero cookies (`document.cookie` is never accessed)
 * - Zero persistent storage (`localStorage` / `sessionStorage` are never accessed)
 * - Automatic PII scrubbing (emails & sensitive tokens are redacted before entering memory)
 * - Bounded in-memory ring buffer exposed at `window.__GREYSON_TELEMETRY__`
 */

export type TelemetryPrimitive = string | number | boolean;
export type TelemetryMetadata = Record<string, TelemetryPrimitive>;
export type TelemetryEventType = 'vital' | 'interaction' | 'lifecycle';
export type WebVitalMetricName = 'FCP' | 'LCP' | 'TTFB' | 'DOM_INTERACTIVE';
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';

export interface TelemetryEvent {
  readonly id: string;
  readonly type: TelemetryEventType;
  readonly name: string;
  readonly timestamp: number;
  readonly value?: number;
  readonly rating?: WebVitalRating;
  readonly metadata?: Readonly<TelemetryMetadata>;
}

export interface TelemetryStore {
  readonly version: string;
  readonly initializedAt: number;
  readonly privacyMode: 'strict-zero-cookie-zero-pii';
  readonly doNotTrack: boolean;
  readonly maxBufferSize: number;
  readonly vitals: Partial<Record<WebVitalMetricName, number>>;
  readonly events: TelemetryEvent[];
}

declare global {
  interface Window {
    __GREYSON_TELEMETRY__?: TelemetryStore;
  }
}

const MAX_BUFFER_SIZE = 100;
const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 128;

// Matches standard email patterns to prevent accidental PII retention
const EMAIL_PII_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SENSITIVE_KEY_REGEX = /(email|phone|token|secret|password|ip|cookie|session)/i;

let isInitialized = false;
let eventCounter = 0;

function getNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return Math.round(performance.now() * 100) / 100;
  }
  return Date.now();
}

function nextEventId(): string {
  eventCounter += 1;
  return `evt_${eventCounter}_${Math.round(getNow())}`;
}

/**
 * Scrubs strings of potential PII (such as email addresses or mailto: targets)
 * and enforces a strict character cap.
 */
export function sanitizeTelemetryString(raw: string, maxLength = MAX_VALUE_LENGTH): string {
  const withoutMailto = raw.replace(/^mailto:/i, '[REDACTED_MAILTO]:');
  const scrubbed = withoutMailto.replace(EMAIL_PII_REGEX, '[REDACTED_PII]');
  return scrubbed.slice(0, maxLength);
}

/**
 * Sanitizes interaction metadata so no PII or unbounded payloads enter the ring buffer.
 */
export function sanitizeMetadata(
  metadata?: TelemetryMetadata
): Readonly<TelemetryMetadata> | undefined {
  if (!metadata) {
    return undefined;
  }

  const clean: TelemetryMetadata = {};
  const entries = Object.entries(metadata).slice(0, 16);

  for (const [rawKey, rawValue] of entries) {
    const key = sanitizeTelemetryString(String(rawKey).trim(), MAX_KEY_LENGTH);
    if (!key) continue;

    if (SENSITIVE_KEY_REGEX.test(key)) {
      clean[key] = '[REDACTED_PII]';
      continue;
    }

    if (typeof rawValue === 'string') {
      clean[key] = sanitizeTelemetryString(rawValue, MAX_VALUE_LENGTH);
    } else if (typeof rawValue === 'number') {
      clean[key] = Number.isFinite(rawValue) ? Math.round(rawValue * 1000) / 1000 : 0;
    } else if (typeof rawValue === 'boolean') {
      clean[key] = rawValue;
    }
  }

  return Object.freeze(clean);
}

export function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  const dnt = navigator.doNotTrack;
  return dnt === '1' || dnt === 'yes';
}

function getOrCreateStore(): TelemetryStore | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.__GREYSON_TELEMETRY__) {
    window.__GREYSON_TELEMETRY__ = {
      version: '1.0.0',
      initializedAt: Date.now(),
      privacyMode: 'strict-zero-cookie-zero-pii',
      doNotTrack: isDoNotTrackEnabled(),
      maxBufferSize: MAX_BUFFER_SIZE,
      vitals: {},
      events: [],
    };
  }

  return window.__GREYSON_TELEMETRY__;
}

function pushEvent(event: TelemetryEvent): void {
  const store = getOrCreateStore();
  if (!store) return;

  if (store.events.length >= store.maxBufferSize) {
    store.events.shift();
  }
  store.events.push(event);
}

function rateVital(metric: WebVitalMetricName, valueMs: number): WebVitalRating {
  switch (metric) {
    case 'FCP':
      if (valueMs <= 1800) return 'good';
      if (valueMs <= 3000) return 'needs-improvement';
      return 'poor';
    case 'LCP':
      if (valueMs <= 2500) return 'good';
      if (valueMs <= 4000) return 'needs-improvement';
      return 'poor';
    case 'TTFB':
      if (valueMs <= 800) return 'good';
      if (valueMs <= 1800) return 'needs-improvement';
      return 'poor';
    case 'DOM_INTERACTIVE':
      if (valueMs <= 1500) return 'good';
      if (valueMs <= 3000) return 'needs-improvement';
      return 'poor';
  }
}

function recordVital(
  metric: WebVitalMetricName,
  rawValueMs: number,
  metadata?: TelemetryMetadata
): void {
  const store = getOrCreateStore();
  if (!store || !Number.isFinite(rawValueMs) || rawValueMs < 0) return;

  const rounded = Math.round(rawValueMs * 100) / 100;
  store.vitals[metric] = rounded;

  pushEvent({
    id: nextEventId(),
    type: 'vital',
    name: metric,
    timestamp: getNow(),
    value: rounded,
    rating: rateVital(metric, rounded),
    metadata: sanitizeMetadata(metadata),
  });
}

function observePaintTimings(): void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return;
  }

  const supportedTypes = Array.isArray(PerformanceObserver.supportedEntryTypes)
    ? PerformanceObserver.supportedEntryTypes
    : [];

  // 1. First Contentful Paint (FCP)
  if (supportedTypes.length === 0 || supportedTypes.includes('paint')) {
    try {
      const paintObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            recordVital('FCP', entry.startTime, { entryType: 'paint' });
            paintObserver.disconnect();
          }
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // Paint observer unsupported in this browser context; fail silently
    }
  }

  // 2. Largest Contentful Paint (LCP)
  if (supportedTypes.length === 0 || supportedTypes.includes('largest-contentful-paint')) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          recordVital('LCP', lastEntry.startTime, {
            entryType: 'largest-contentful-paint',
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP observer unsupported in this browser context; fail silently
    }
  }
}

function captureNavigationTimings(): void {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return;
  }

  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const nav = navEntries[0];
    if (!nav) return;

    if (nav.responseStart > 0) {
      recordVital('TTFB', nav.responseStart, { entryType: 'navigation' });
    }
    if (nav.domInteractive > 0) {
      recordVital('DOM_INTERACTIVE', nav.domInteractive, { entryType: 'navigation' });
    }
  } catch {
    // Ignore navigation timing errors in restricted environments
  }
}

/**
 * Initializes the privacy-first telemetry store (`window.__GREYSON_TELEMETRY__`)
 * and attaches non-blocking `PerformanceObserver` listeners for FCP and LCP.
 * Safe and idempotent to call in `main.tsx` or `App.tsx`.
 */
export function initTelemetry(): TelemetryStore | null {
  const store = getOrCreateStore();
  if (!store) return null;

  if (isInitialized) {
    return store;
  }
  isInitialized = true;

  pushEvent({
    id: nextEventId(),
    type: 'lifecycle',
    name: 'telemetry_initialized',
    timestamp: getNow(),
    metadata: sanitizeMetadata({
      reducedMotion:
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
          : false,
    }),
  });

  captureNavigationTimings();
  observePaintTimings();

  return store;
}

/**
 * Records a user interaction into the bounded in-memory ring buffer
 * (`window.__GREYSON_TELEMETRY__.events`) without cookies, network beacons, or PII.
 *
 * @param action Short identifier such as `'contact_click'`, `'globe_drag'`, or `'intro_complete'`
 * @param metadata Optional key/value primitive attributes (automatically sanitized against PII)
 */
export function trackInteraction(
  action: string,
  metadata?: Record<string, string | number | boolean>
): void {
  const store = getOrCreateStore();
  if (!store) return;

  const cleanAction = sanitizeTelemetryString(String(action).trim(), MAX_KEY_LENGTH);
  if (!cleanAction) return;

  pushEvent({
    id: nextEventId(),
    type: 'interaction',
    name: cleanAction,
    timestamp: getNow(),
    metadata: sanitizeMetadata(metadata),
  });
}

/**
 * Returns the current in-memory telemetry store snapshot for diagnostics or QA assertions.
 */
export function getTelemetrySnapshot(): Readonly<TelemetryStore> | null {
  return getOrCreateStore();
}
