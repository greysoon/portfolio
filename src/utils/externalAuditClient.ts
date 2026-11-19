/**
 * Live External Findability, SEO, DNS & PageSpeed Audit Client
 *
 * Calls the localhost-only Vite middleware (`/__dashboard_api/*`) so all metrics
 * reflect actual live responses from production URLs (`greyson.nl`), DNS, RDAP,
 * Wayback Machine, and Google PageSpeed Insights / CrUX without synthetic fallbacks.
 */

import { sanitizeTelemetryString } from './telemetry';

export interface TlsCertificateInfo {
  readonly valid: boolean;
  readonly error: string | null;
  readonly issuer: string | null;
  readonly validTo: string | null;
  readonly daysRemaining: number | null;
  readonly subjectAltName: string | null;
}

export interface LivePageMetadata {
  readonly title: string;
  readonly metaDescription: string;
  readonly metaRobots: string;
  readonly canonicalUrl: string;
  readonly hasOpenGraph: boolean;
  readonly hasTwitterCard: boolean;
  readonly hreflangs: readonly string[];
  readonly jsonLdTypes: readonly string[];
}

export interface LivePageAuditItem {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly reachable: boolean;
  readonly statusCode: number | null;
  readonly ok: boolean;
  readonly finalUrl: string;
  readonly redirected: boolean;
  readonly ttfbMs: number | null;
  readonly totalMs: number;
  readonly xRobotsTag: string;
  readonly contentType: string;
  readonly cacheControl: string;
  readonly xFrameOptions: string;
  readonly xContentTypeOptions: string;
  readonly error: string | null;
  readonly meta: LivePageMetadata;
  readonly tls: TlsCertificateInfo;
  readonly indexable: boolean;
  readonly issue: string | null;
}

export interface LiveDiscoveryFileItem {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly ok: boolean;
  readonly statusCode: number | null;
  readonly bytes: number;
  readonly latencyMs: number;
  readonly error: string | null;
}

export interface RobotsBotAccessItem {
  readonly bot: string;
  readonly allowed: boolean;
  readonly ruleSource: 'explicit' | 'wildcard';
}

export interface RobotsTxtAnalysis {
  readonly sitemaps: readonly string[];
  readonly botAccess: readonly RobotsBotAccessItem[];
  readonly disallowsDashboard: boolean;
}

export interface SitemapUrlCheckItem {
  readonly loc: string;
  readonly lastmod: string;
  readonly statusCode: number | null;
  readonly ok: boolean;
  readonly tlsValid: boolean;
  readonly error: string | null;
}

export interface SiteAuditResult {
  readonly ok: boolean;
  readonly checkedAt?: string;
  readonly pages: readonly LivePageAuditItem[];
  readonly files: readonly LiveDiscoveryFileItem[];
  readonly robots: RobotsTxtAnalysis | null;
  readonly sitemapUrls: readonly SitemapUrlCheckItem[];
  readonly error?: string;
}

export interface DnsHostRecord {
  readonly host: string;
  readonly a: readonly string[];
  readonly aaaa: readonly string[];
  readonly cname: readonly string[];
  readonly txt: readonly string[];
  readonly dnsStatus: number | null;
}

export interface RdapDomainInfo {
  readonly ok: boolean;
  readonly domain?: string;
  readonly status?: readonly string[];
  readonly registeredAt?: string | null;
  readonly lastChangedAt?: string | null;
  readonly nameservers?: readonly string[];
  readonly dnssecSigned?: boolean;
  readonly error?: string;
}

export interface WaybackSnapshotInfo {
  readonly ok: boolean;
  readonly available: boolean;
  readonly status?: string;
  readonly timestamp?: string;
  readonly archiveUrl?: string;
  readonly error?: string;
}

export interface DiscoveryAuditResult {
  readonly ok: boolean;
  readonly checkedAt?: string;
  readonly dnsHosts: readonly DnsHostRecord[];
  readonly rdap: RdapDomainInfo | null;
  readonly wayback: WaybackSnapshotInfo | null;
  readonly error?: string;
}

export type PageSpeedStrategy = 'mobile' | 'desktop';
export type PageSpeedTargetUrl =
  | 'https://greyson.nl/'
  | 'https://greyson.nl/over-mij'
  | 'https://www.greyson.nl/';

export interface CruxMetrics {
  readonly overallCategory: string;
  readonly fcpMs: number | null;
  readonly lcpMs: number | null;
  readonly inpMs: number | null;
  readonly cls: number | null;
  readonly ttfbMs: number | null;
}

export interface PageSpeedSeoAuditItem {
  readonly id: string;
  readonly title: string;
  readonly score: number | null;
  readonly displayValue: string;
  readonly scoreDisplayMode: string;
}

export interface PageSpeedResult {
  readonly ok: boolean;
  readonly status?: number;
  readonly checkedAt?: string;
  readonly url: string;
  readonly strategy: PageSpeedStrategy;
  readonly usedApiKey: boolean;
  readonly scores?: {
    readonly performance: number | null;
    readonly seo: number | null;
    readonly accessibility: number | null;
    readonly bestPractices: number | null;
  };
  readonly labMetrics?: {
    readonly fcpMs: number | null;
    readonly lcpMs: number | null;
    readonly cls: number | null;
    readonly tbtMs: number | null;
    readonly speedIndexMs: number | null;
  };
  readonly fieldData?: {
    readonly page: CruxMetrics | null;
    readonly origin: CruxMetrics | null;
  };
  readonly seoAudits?: readonly PageSpeedSeoAuditItem[];
  readonly error?: string;
}

const PSI_SESSION_KEY = 'greyson_google_psi_key_v1';
let memoryPageSpeedKey = '';

export function getStoredPageSpeedApiKey(): string {
  if (memoryPageSpeedKey) return memoryPageSpeedKey;
  if (typeof window === 'undefined') return '';
  try {
    const val = window.sessionStorage.getItem(PSI_SESSION_KEY) ?? '';
    return val.replace(/[\x00-\x1F\x7F\s]/g, '').slice(0, 256);
  } catch {
    return '';
  }
}

export function saveStoredPageSpeedApiKey(rawKey: string): string {
  const clean = (typeof rawKey === 'string' ? rawKey : '')
    .replace(/[\x00-\x1F\x7F\s]/g, '')
    .slice(0, 256);
  memoryPageSpeedKey = clean;
  if (typeof window !== 'undefined') {
    try {
      if (clean) {
        window.sessionStorage.setItem(PSI_SESSION_KEY, clean);
      } else {
        window.sessionStorage.removeItem(PSI_SESSION_KEY);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }
  return clean;
}

async function readJsonSafe<T>(res: Response): Promise<{ parsed: T | null; parseError: string | null }> {
  const raw = await res.text();
  if (!raw) {
    return { parsed: null, parseError: `Lege serverrespons (HTTP ${res.status}).` };
  }
  try {
    return { parsed: JSON.parse(raw) as T, parseError: null };
  } catch {
    return {
      parsed: null,
      parseError: `Onverwachte serverrespons (HTTP ${res.status}, geen geldige JSON).`,
    };
  }
}

export async function fetchLiveSiteAudit(): Promise<SiteAuditResult> {
  try {
    const res = await fetch('/__dashboard_api/site-audit', {
      method: 'GET',
      cache: 'no-store',
    });
    const { parsed: data, parseError } = await readJsonSafe<SiteAuditResult>(res);
    if (!res.ok || !data || !data.ok) {
      return {
        ok: false,
        pages: [],
        files: [],
        robots: null,
        sitemapUrls: [],
        error: sanitizeTelemetryString(
          data?.error || parseError || `Live site-audit mislukt (HTTP ${res.status}).`,
          180
        ),
      };
    }
    return data;
  } catch (err) {
    return {
      ok: false,
      pages: [],
      files: [],
      robots: null,
      sitemapUrls: [],
      error: sanitizeTelemetryString(
        err instanceof Error ? err.message : 'Kan live site-audit niet bereiken.',
        180
      ),
    };
  }
}

export async function fetchLiveDiscoveryAudit(): Promise<DiscoveryAuditResult> {
  try {
    const res = await fetch('/__dashboard_api/discovery-audit', {
      method: 'GET',
      cache: 'no-store',
    });
    const { parsed: data, parseError } = await readJsonSafe<DiscoveryAuditResult>(res);
    if (!res.ok || !data || !data.ok) {
      return {
        ok: false,
        dnsHosts: [],
        rdap: null,
        wayback: null,
        error: sanitizeTelemetryString(
          data?.error || parseError || `DNS/RDAP check mislukt (HTTP ${res.status}).`,
          180
        ),
      };
    }
    return data;
  } catch (err) {
    return {
      ok: false,
      dnsHosts: [],
      rdap: null,
      wayback: null,
      error: sanitizeTelemetryString(
        err instanceof Error ? err.message : 'Kan DNS/RDAP check niet bereiken.',
        180
      ),
    };
  }
}

export async function fetchLivePageSpeed(
  url: PageSpeedTargetUrl,
  strategy: PageSpeedStrategy,
  apiKey?: string
): Promise<PageSpeedResult> {
  try {
    const res = await fetch('/__dashboard_api/pagespeed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        url,
        strategy,
        apiKey: apiKey !== undefined ? apiKey : getStoredPageSpeedApiKey(),
      }),
    });
    const { parsed: data, parseError } = await readJsonSafe<PageSpeedResult>(res);
    if (!res.ok || !data || !data.ok) {
      return {
        ok: false,
        status: data?.status ?? res.status,
        url,
        strategy,
        usedApiKey: Boolean(data?.usedApiKey),
        error: sanitizeTelemetryString(
          data?.error || parseError || `PageSpeed API fout (HTTP ${res.status}).`,
          220
        ),
      };
    }
    return data;
  } catch (err) {
    return {
      ok: false,
      url,
      strategy,
      usedApiKey: Boolean(apiKey || getStoredPageSpeedApiKey()),
      error: sanitizeTelemetryString(
        err instanceof Error ? err.message : 'Kan PageSpeed check niet uitvoeren.',
        200
      ),
    };
  }
}
