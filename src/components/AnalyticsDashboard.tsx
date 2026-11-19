import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { automateConfig, AutomateLocale } from '../config/automateConfig';
import { trackInteraction } from '../utils/telemetry';
import {
  AcquisitionChannelKey,
  clearOwnerAuthSession,
  DashboardEnvStatus,
  fetchDashboardEnvStatus,
  fetchPostHogAnalytics,
  getOwnerAuthStatus,
  getPostHogConfig,
  isLocalDashboardHost,
  normalizePostHogRegion,
  OWNER_EMAIL,
  PostHogAnalyticsResult,
  PostHogRegion,
  savePostHogConfig,
  verifyOwnerPassphrase,
  verifyPostHogPersonalKey,
} from '../utils/posthogClient';
import {
  DiscoveryAuditResult,
  fetchLiveDiscoveryAudit,
  fetchLivePageSpeed,
  fetchLiveSiteAudit,
  getStoredPageSpeedApiKey,
  PageSpeedResult,
  PageSpeedStrategy,
  PageSpeedTargetUrl,
  saveStoredPageSpeedApiKey,
  SiteAuditResult,
} from '../utils/externalAuditClient';
import { BrandLogo } from './BrandLogo';
import '../styles/automate.css';

interface AnalyticsDashboardProps {
  onNavigate?: (
    view: 'automate' | 'about' | 'portfolio' | 'dashboard',
    portfolioMode?: 'about' | 'cv'
  ) => void;
}

type DashboardTabId = 'bezoek' | 'vindbaarheid' | 'pagespeed' | 'stream';
type TimeWindowDays = 7 | 30 | 90;

const INPUT_BOUNDS = {
  email: 254,
  passphrase: 256,
  apiKey: 256,
  projectId: 32,
} as const;

const DASHBOARD_TABS: readonly {
  id: DashboardTabId;
  nl: string;
  en: string;
}[] = [
  { id: 'bezoek', nl: 'Overzicht & Bezoek', en: 'Traffic & Performance' },
  { id: 'vindbaarheid', nl: 'Vindbaarheid & SEO-Audit', en: 'Findability & Crawl Audit' },
  { id: 'pagespeed', nl: 'PageSpeed & CrUX', en: 'PageSpeed & CrUX' },
  { id: 'stream', nl: 'Bezoekers & Live Events', en: 'Visitors & Live Stream' },
];

const COPY = {
  nl: {
    brandLabel: 'GREYSON ANALYTICS',
    homeLink: '← Home (greyson.nl)',
    aboutLink: 'Over mij',
    refreshAll: 'Vernieuw actuele data',
    refreshing: 'Gegevens ophalen...',
    signOut: 'Uitloggen',
    settingsToggle: 'Koppelingen & API-sleutels',
    periodLabel: 'Periode',
    daysUnit: 'dagen',
    excludeLocalLabel: 'Filter localhost & /dashboard uit (alleen echte bezoekers)',
    livePosthogBadge: (region: string, days: number) =>
      `PostHog Live (${region.toUpperCase()} · ${days}d)`,
    posthogPendingBadge: 'PostHog nog niet gekoppeld',
    scopeProdBadge: 'Alleen productiebezoek',
    scopeAllBadge: 'Inclusief lokaal testverkeer',
    siteAuditBadge: (okCount: number, total: number) =>
      `Live site-check: ${okCount}/${total} indexeerbaar`,
    connectHeading: 'Koppel PostHog Cloud voor actuele bezoekersdata',
    connectBody:
      'Dit dashboard toont uitsluitend echte metingen — geen lokale sessie-fallback of testdata. Vul je Project ID en sessiegebonden Personal API Key (phx_...) in, of voeg POSTHOG_PROJECT_ID en POSTHOG_PERSONAL_API_KEY lokaal toe aan .env.',
    openSettingsBtn: 'Open PostHog-koppeling',
    envActiveNote:
      'Server-side .env PostHog-sleutel actief op localhost (sleutel verlaat Node niet).',
    fetchPostHogBtn: 'PostHog verversen',
    saveConfigBtn: 'Instellingen opslaan',
    disconnectBtn: 'Sessie-sleutels wissen',
    kpiVisitors: 'Unieke bezoekers',
    kpiPageviews: 'Paginaweergaves',
    kpiSessions: 'Sessies & Gem. duur',
    kpiBounce: 'Bouncepercentage',
    kpiConversions: 'Leads & Contactacties',
    kpiSearchAi: 'Gevonden via Zoek / AI',
    trendHeading: 'Dagelijks bezoek & paginaweergaves (PostHog)',
    trendSub: 'Alleen echte gemeten dagen binnen de gekozen periode.',
    topPagesHeading: 'Meest bezochte pagina’s',
    subdomainsHeading: 'Subdomeinen',
    interactionsHeading: 'Interacties & taalvoorkeur',
    webVitalsHeading: 'Echte Web Vitals uit PostHog ($web_vitals)',
    webVitalsEmpty:
      'Nog geen $web_vitals-metingen ontvangen in PostHog voor deze periode. De live website stuurt nu automatisch LCP, FCP, INP en CLS mee bij echte bezoeken.',
    geoDevicesHeading: 'Locaties & apparaten',
    channelsHeading: 'Hoe mensen de website vinden (PostHog kanalen)',
    referrersHeading: 'Verwijzende domeinen & UTM-bronnen',
    landingHeading: 'Landingspagina’s (eerste pagina bij binnenkomst)',
    siteAuditHeading: 'Live Indexeerbaarheid & Bereikbaarheid (greyson.nl)',
    siteAuditSub:
      'Rechtstreekse HTTP-, TLS-certificaat- en HTML-metacheck vanaf localhost naar de live productie-URL’s.',
    crawlersHeading: 'Zoekmachines & AI-crawlers (robots.txt, sitemap.xml & llms.txt)',
    dnsRdapHeading: 'DNS-records, SIDN RDAP & Wayback Machine',
    pageSpeedHeading: 'Google PageSpeed Insights & Chrome UX Report (CrUX)',
    pageSpeedRun: 'Live PageSpeed meting uitvoeren',
    pageSpeedRunning: 'Lighthouse analyse draait (~15s)...',
    visitorsHeading: 'Bezoekersprofielen (PostHog)',
    eventsHeading: 'Recente events (PostHog Live Stream)',
    noData: 'Geen metingen in deze periode.',
    channels: {
      organic_search: 'Organisch zoeken (Google / Bing / DDG)',
      ai_search: 'AI-zoekmachines (ChatGPT / Perplexity / Claude)',
      social: 'Social media (LinkedIn / X)',
      referral: 'Verwijzingen & overige links',
      direct: 'Direct / ingetypt / onbekend',
    } as Record<AcquisitionChannelKey, string>,
  },
  en: {
    brandLabel: 'GREYSON ANALYTICS',
    homeLink: '← Home (greyson.nl)',
    aboutLink: 'About me',
    refreshAll: 'Refresh live data',
    refreshing: 'Fetching live data...',
    signOut: 'Sign Out',
    settingsToggle: 'Connections & API Keys',
    periodLabel: 'Range',
    daysUnit: 'days',
    excludeLocalLabel: 'Exclude localhost & /dashboard (production visitors only)',
    livePosthogBadge: (region: string, days: number) =>
      `PostHog Live (${region.toUpperCase()} · ${days}d)`,
    posthogPendingBadge: 'PostHog not connected',
    scopeProdBadge: 'Production traffic only',
    scopeAllBadge: 'Including localhost traffic',
    siteAuditBadge: (okCount: number, total: number) =>
      `Live site audit: ${okCount}/${total} indexable`,
    connectHeading: 'Connect PostHog Cloud for live visitor analytics',
    connectBody:
      'This dashboard uses strictly live data — zero local session fallback or mock metrics. Enter your Project ID and session-scoped Personal API Key (phx_...), or add POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY to .env locally.',
    openSettingsBtn: 'Configure PostHog',
    envActiveNote:
      'Server-side .env PostHog credentials active on localhost (secret stays in Node).',
    fetchPostHogBtn: 'Refresh PostHog',
    saveConfigBtn: 'Save Config',
    disconnectBtn: 'Clear session keys',
    kpiVisitors: 'Unique Visitors',
    kpiPageviews: 'Pageviews',
    kpiSessions: 'Sessions & Avg Duration',
    kpiBounce: 'Bounce Rate',
    kpiConversions: 'Leads & Contact Clicks',
    kpiSearchAi: 'Found via Search / AI',
    trendHeading: 'Daily Visitors & Pageviews (PostHog)',
    trendSub: 'Actual measured daily counts for the selected time window.',
    topPagesHeading: 'Top Pages',
    subdomainsHeading: 'Subdomain Traffic Breakdown',
    interactionsHeading: 'Interactions & Languages',
    webVitalsHeading: 'Real-User Web Vitals from PostHog ($web_vitals)',
    webVitalsEmpty:
      'No $web_vitals events recorded in PostHog for this period yet. Live visits now emit LCP, FCP, INP, and CLS automatically.',
    geoDevicesHeading: 'Locations & Devices',
    channelsHeading: 'How Visitors Find the Website (PostHog Channels)',
    referrersHeading: 'Referring Domains & UTM Sources',
    landingHeading: 'Landing Pages (Entry URLs)',
    siteAuditHeading: 'Live Indexability & Reachability (greyson.nl)',
    siteAuditSub:
      'Direct HTTP status, TLS certificate, and HTML SEO metadata probe against live production URLs.',
    crawlersHeading: 'Search & AI Crawlers (robots.txt, sitemap.xml & llms.txt)',
    dnsRdapHeading: 'DNS Records, SIDN RDAP & Wayback Machine',
    pageSpeedHeading: 'Google PageSpeed Insights & Chrome UX Report (CrUX)',
    pageSpeedRun: 'Run Live PageSpeed Audit',
    pageSpeedRunning: 'Running Lighthouse (~15s)...',
    visitorsHeading: 'Who Is Visiting',
    eventsHeading: 'What They Do (Live Stream)',
    noData: 'No recorded measurements in this window.',
    channels: {
      organic_search: 'Organic Search (Google / Bing / DDG)',
      ai_search: 'AI Search (ChatGPT / Perplexity / Claude)',
      social: 'Social Media (LinkedIn / X)',
      referral: 'Referral Links',
      direct: 'Direct / Typed / Unknown',
    } as Record<AcquisitionChannelKey, string>,
  },
} as const;

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatVitalMs(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${Math.round(value)} ms`;
}

function formatCls(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toFixed(3);
}

function rateVitalStatus(
  metric: 'LCP' | 'FCP' | 'INP' | 'CLS' | 'TTFB',
  value: number | null | undefined
): 'good' | 'warn' | 'poor' | 'none' {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'none';
  switch (metric) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'warn' : 'poor';
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'warn' : 'poor';
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'warn' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'warn' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'warn' : 'poor';
  }
}

function formatEventTime(isoString: string): string {
  if (!isoString) return '—';
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return isoString;
  return parsed.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(isoOrDay: string): string {
  if (!isoOrDay) return '—';
  const parsed = new Date(isoOrDay);
  if (Number.isNaN(parsed.getTime())) return isoOrDay;
  return parsed.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWaybackTimestamp(ts: string | undefined): string {
  if (!ts || ts.length < 8) return '—';
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
}

function formatEventProperties(
  props: Readonly<Record<string, string | number | boolean>>
): string {
  const priorityKeys = [
    'view',
    'scenarioId',
    'interest',
    'target',
    'lang',
    'referringDomain',
    'deviceType',
  ];
  const entries: string[] = [];
  const seen = new Set<string>();

  for (const key of priorityKeys) {
    if (key in props && props[key] !== '' && props[key] !== undefined) {
      entries.push(`${key}=${String(props[key])}`);
      seen.add(key);
    }
    if (entries.length >= 4) break;
  }

  if (entries.length < 4) {
    for (const [key, val] of Object.entries(props)) {
      if (seen.has(key) || val === '') continue;
      entries.push(`${key}=${String(val)}`);
      if (entries.length >= 4) break;
    }
  }

  return entries.length > 0 ? entries.join(' · ') : '—';
}

function scoreToneClass(score: number | null | undefined): string {
  if (typeof score !== 'number') return '';
  if (score >= 90) return 'is-good';
  if (score >= 50) return 'is-warn';
  return 'is-poor';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onNavigate,
}) => {
  const initialConfig = getPostHogConfig();
  const initialAuth = getOwnerAuthStatus();

  const isLocalOnly =
    typeof window !== 'undefined' &&
    isLocalDashboardHost(window.location.hostname);

  const [lang, setLang] = useState<AutomateLocale>('nl');
  const t = COPY[lang];

  const [unlocked, setUnlocked] = useState<boolean>(
    isLocalOnly || initialAuth.authenticated
  );
  const [authMethod, setAuthMethod] = useState<'passphrase' | 'posthog_key'>(
    'passphrase'
  );

  // Owner passphrase login state
  const [ownerEmail, setOwnerEmail] = useState<string>(OWNER_EMAIL);
  const [passphrase, setPassphrase] = useState<string>('');
  const [lockedUntil, setLockedUntil] = useState<number | null>(
    initialAuth.lockedUntil
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [authError, setAuthError] = useState<string>('');
  const [authBusy, setAuthBusy] = useState<boolean>(false);

  // PostHog Cloud & Google PageSpeed credentials state (no local fallback!)
  const [region, setRegion] = useState<PostHogRegion>(initialConfig.region);
  const [projectApiKey, setProjectApiKey] = useState<string>(
    initialConfig.projectApiKey
  );
  const [personalApiKey, setPersonalApiKey] = useState<string>(
    initialConfig.personalApiKey
  );
  const [projectId, setProjectId] = useState<string>(initialConfig.projectId);
  const [pageSpeedApiKey, setPageSpeedApiKey] = useState<string>(() =>
    getStoredPageSpeedApiKey()
  );
  const [showPersonalKey, setShowPersonalKey] = useState<boolean>(false);
  const [showPsiKey, setShowPsiKey] = useState<boolean>(false);

  const [envStatus, setEnvStatus] = useState<DashboardEnvStatus>({
    posthogEnvConfigured: false,
    posthogProjectId: '',
    posthogRegion: 'eu',
    hasPageSpeedKey: false,
  });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Query filter & tab state
  const [activeTab, setActiveTab] = useState<DashboardTabId>('bezoek');
  const [daysWindow, setDaysWindow] = useState<TimeWindowDays>(30);
  const [excludeLocal, setExcludeLocal] = useState<boolean>(true);

  // Live PostHog state
  const [liveAnalytics, setLiveAnalytics] =
    useState<PostHogAnalyticsResult | null>(null);
  const [posthogBusy, setPosthogBusy] = useState<boolean>(false);
  const [posthogStatusMsg, setPosthogStatusMsg] = useState<string>('');
  const [posthogError, setPosthogError] = useState<string>('');

  // Live external tools state
  const [siteAudit, setSiteAudit] = useState<SiteAuditResult | null>(null);
  const [siteAuditBusy, setSiteAuditBusy] = useState<boolean>(false);

  const [discoveryAudit, setDiscoveryAudit] =
    useState<DiscoveryAuditResult | null>(null);
  const [discoveryBusy, setDiscoveryBusy] = useState<boolean>(false);

  const [psiTargetUrl, setPsiTargetUrl] = useState<PageSpeedTargetUrl>(
    'https://greyson.nl/'
  );
  const [psiStrategy, setPsiStrategy] = useState<PageSpeedStrategy>('mobile');
  const [pageSpeedResult, setPageSpeedResult] =
    useState<PageSpeedResult | null>(null);
  const [pageSpeedBusy, setPageSpeedBusy] = useState<boolean>(false);

  const tabRefs = useRef<Record<DashboardTabId, HTMLButtonElement | null>>({
    bezoek: null,
    vindbaarheid: null,
    pagespeed: null,
    stream: null,
  });
  const initialExternalBooted = useRef(false);
  const initialPsiBooted = useRef(false);
  const uid = useId().replace(/:/g, '');

  const isGreysonProd =
    typeof window !== 'undefined' &&
    (window.location.hostname.toLowerCase() === 'greyson.nl' ||
      window.location.hostname.toLowerCase().endsWith('.greyson.nl'));

  const isLockedOut = lockedUntil !== null && nowMs < lockedUntil;
  const lockoutRemainingSec = isLockedOut
    ? Math.max(1, Math.ceil((lockedUntil - nowMs) / 1000))
    : 0;

  useEffect(() => {
    if (lockedUntil === null) return;
    if (Date.now() >= lockedUntil) {
      setLockedUntil(null);
      return;
    }

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (current >= lockedUntil) {
        setLockedUntil(null);
        setAuthError('');
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const runPostHogFetch = useCallback(
    async (opts?: {
      region?: PostHogRegion;
      projectApiKey?: string;
      personalApiKey?: string;
      projectId?: string;
      days?: TimeWindowDays;
      excludeLocal?: boolean;
      useServerEnv?: boolean;
    }) => {
      const useServer = Boolean(opts?.useServerEnv ?? envStatus.posthogEnvConfigured);
      const targetRegion = opts?.region ?? (useServer && !projectId ? envStatus.posthogRegion : region);
      const targetProjectId =
        opts?.projectId ?? (projectId || envStatus.posthogProjectId);
      const targetPersonalKey = opts?.personalApiKey ?? personalApiKey;
      const targetDays = opts?.days ?? daysWindow;
      const targetExcludeLocal = opts?.excludeLocal ?? excludeLocal;

      const hasSessionCreds =
        Boolean(targetPersonalKey && targetPersonalKey.startsWith('phx_')) &&
        Boolean(targetProjectId);
      const canUseServer = useServer && Boolean(targetProjectId);

      if (!hasSessionCreds && !canUseServer) {
        setLiveAnalytics(null);
        setSettingsOpen(true);
        return;
      }

      const nextCfg = savePostHogConfig({
        region: targetRegion,
        projectApiKey: opts?.projectApiKey ?? projectApiKey,
        personalApiKey: targetPersonalKey,
        projectId: targetProjectId,
      });

      setPosthogBusy(true);
      setPosthogError('');
      setPosthogStatusMsg('');

      const result = await fetchPostHogAnalytics({
        ...nextCfg,
        days: targetDays,
        excludeLocal: targetExcludeLocal,
        useServerEnv: canUseServer && !hasSessionCreds,
      });

      setPosthogBusy(false);

      if (result.ok) {
        setLiveAnalytics(result);
        setPosthogStatusMsg(
          lang === 'nl'
            ? `Actuele PostHog Cloud data geladen (${result.region.toUpperCase()} project ${result.projectId}, laatste ${result.days} dagen).`
            : `Synced live PostHog Cloud data (${result.region.toUpperCase()} project ${result.projectId}, last ${result.days}d).`
        );
      } else {
        setPosthogError(
          result.error || 'Unable to fetch live PostHog analytics.'
        );
      }
    },
    [
      envStatus.posthogEnvConfigured,
      envStatus.posthogProjectId,
      envStatus.posthogRegion,
      region,
      projectId,
      personalApiKey,
      projectApiKey,
      daysWindow,
      excludeLocal,
      lang,
    ]
  );

  const runExternalProbes = useCallback(async () => {
    setSiteAuditBusy(true);
    setDiscoveryBusy(true);
    const [siteRes, discRes] = await Promise.all([
      fetchLiveSiteAudit(),
      fetchLiveDiscoveryAudit(),
    ]);
    setSiteAudit(siteRes);
    setDiscoveryAudit(discRes);
    setSiteAuditBusy(false);
    setDiscoveryBusy(false);
  }, []);

  const runPageSpeedProbe = useCallback(
    async (
      targetUrl: PageSpeedTargetUrl = psiTargetUrl,
      strategy: PageSpeedStrategy = psiStrategy,
      explicitKey?: string
    ) => {
      setPageSpeedBusy(true);
      const res = await fetchLivePageSpeed(
        targetUrl,
        strategy,
        explicitKey !== undefined ? explicitKey : pageSpeedApiKey
      );
      setPageSpeedResult(res);
      setPageSpeedBusy(false);
    },
    [psiTargetUrl, psiStrategy, pageSpeedApiKey]
  );

  // Boot live probes + PostHog auto-fetch on dashboard unlock
  useEffect(() => {
    if (!unlocked) return;

    let cancelled = false;

    const boot = async () => {
      const status = await fetchDashboardEnvStatus();
      if (cancelled) return;
      setEnvStatus(status);

      const resolvedProjectId = projectId || status.posthogProjectId;
      const resolvedRegion = projectId ? region : status.posthogRegion || region;
      if (!projectId && status.posthogProjectId) {
        setProjectId(status.posthogProjectId);
        setRegion(status.posthogRegion);
      }

      const hasSessionKey = Boolean(personalApiKey && personalApiKey.startsWith('phx_'));
      if (hasSessionKey && resolvedProjectId) {
        void runPostHogFetch({
          region: resolvedRegion,
          projectId: resolvedProjectId,
          personalApiKey,
          useServerEnv: false,
        });
      } else if (status.posthogEnvConfigured && resolvedProjectId) {
        void runPostHogFetch({
          region: status.posthogRegion,
          projectId: resolvedProjectId,
          useServerEnv: true,
        });
      } else {
        setSettingsOpen(true);
      }

      if (!initialExternalBooted.current) {
        initialExternalBooted.current = true;
        void runExternalProbes();
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
    // Run once when unlocked transitions to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  // Auto-run PageSpeed once when opening the PageSpeed tab
  useEffect(() => {
    if (!unlocked || activeTab !== 'pagespeed' || initialPsiBooted.current) return;
    initialPsiBooted.current = true;
    void runPageSpeedProbe(psiTargetUrl, psiStrategy);
  }, [unlocked, activeTab, psiTargetUrl, psiStrategy, runPageSpeedProbe]);

  const handleRefreshAll = async () => {
    await Promise.all([
      runPostHogFetch(),
      runExternalProbes(),
      activeTab === 'pagespeed' ? runPageSpeedProbe() : Promise.resolve(),
    ]);
  };

  const handleTimeWindowChange = (nextDays: TimeWindowDays) => {
    setDaysWindow(nextDays);
    void runPostHogFetch({ days: nextDays });
  };

  const handleExcludeLocalToggle = (checked: boolean) => {
    setExcludeLocal(checked);
    void runPostHogFetch({ excludeLocal: checked });
  };

  const handlePassphraseSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (authBusy || isLockedOut) return;

    setAuthBusy(true);
    setAuthError('');
    const result = await verifyOwnerPassphrase(ownerEmail, passphrase);
    setAuthBusy(false);

    if (result.ok) {
      setPassphrase('');
      setLockedUntil(null);
      setAuthMethod('passphrase');
      setUnlocked(true);
      trackInteraction('dashboard_auth', { method: 'passphrase', ok: true });
    } else {
      setNowMs(Date.now());
      if (result.lockedUntil) {
        setLockedUntil(result.lockedUntil);
      }
      setAuthError(result.error || 'Authentication failed.');
      trackInteraction('dashboard_auth', { method: 'passphrase', ok: false });
    }
  };

  const handleDirectKeyLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (authBusy) return;

    setAuthBusy(true);
    setAuthError('');
    const result = await verifyPostHogPersonalKey(
      personalApiKey,
      projectId,
      region
    );
    setAuthBusy(false);

    if (result.ok) {
      savePostHogConfig({
        region: result.region,
        personalApiKey,
        projectId: result.projectId,
        projectApiKey,
      });
      setAuthMethod('posthog_key');
      setUnlocked(true);
      trackInteraction('dashboard_auth', { method: 'posthog_key', ok: true });
      await runPostHogFetch({
        region: result.region,
        personalApiKey,
        projectId: result.projectId,
        projectApiKey,
        useServerEnv: false,
      });
    } else {
      setAuthError(
        result.error || 'Unable to verify PostHog Personal API Key.'
      );
      trackInteraction('dashboard_auth', { method: 'posthog_key', ok: false });
    }
  };

  const handleSaveAndFetchConfig = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const saved = savePostHogConfig({
      region,
      projectApiKey,
      personalApiKey,
      projectId,
    });
    const savedPsi = saveStoredPageSpeedApiKey(pageSpeedApiKey);
    setRegion(saved.region);
    setProjectApiKey(saved.projectApiKey);
    setPersonalApiKey(saved.personalApiKey);
    setProjectId(saved.projectId);
    setPageSpeedApiKey(savedPsi);
    await runPostHogFetch({
      region: saved.region,
      projectApiKey: saved.projectApiKey,
      personalApiKey: saved.personalApiKey,
      projectId: saved.projectId,
    });
  };

  const handleClearSessionKeys = () => {
    clearOwnerAuthSession(false);
    savePostHogConfig({
      region,
      projectApiKey,
      personalApiKey: '',
      projectId,
    });
    saveStoredPageSpeedApiKey('');
    setPersonalApiKey('');
    setPageSpeedApiKey('');
    if (!envStatus.posthogEnvConfigured) {
      setLiveAnalytics(null);
    }
    setPosthogStatusMsg(
      lang === 'nl'
        ? 'Sessiegebonden API-sleutels gewist uit sessionStorage.'
        : 'Session API keys cleared from sessionStorage.'
    );
  };

  const handleSignOut = () => {
    clearOwnerAuthSession(true);
    saveStoredPageSpeedApiKey('');
    setUnlocked(false);
    setPassphrase('');
    setPersonalApiKey('');
    setPageSpeedApiKey('');
    setLiveAnalytics(null);
    setPosthogStatusMsg('');
    setPosthogError('');
    setAuthError('');
    trackInteraction('dashboard_sign_out');
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    view: 'automate' | 'about'
  ) => {
    if (
      onNavigate &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      e.button === 0
    ) {
      e.preventDefault();
      onNavigate(view);
    }
  };

  const selectTab = (nextId: DashboardTabId) => {
    setActiveTab(nextId);
    const el = tabRefs.current[nextId];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIdx = -1;
    if (e.key === 'ArrowRight') {
      nextIdx = (index + 1) % DASHBOARD_TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (index - 1 + DASHBOARD_TABS.length) % DASHBOARD_TABS.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = DASHBOARD_TABS.length - 1;
    }
    if (nextIdx !== -1) {
      e.preventDefault();
      const targetTab = DASHBOARD_TABS[nextIdx];
      selectTab(targetTab.id);
      tabRefs.current[targetTab.id]?.focus();
    }
  };

  const mainSiteHref = '/';
  const aboutHref = isGreysonProd ? automateConfig.aboutPath : '?site=about';

  if (!unlocked) {
    return (
      <div className="dashboard-root">
        <div className="dashboard-container">
          <nav className="automate-nav" aria-label="Dashboard navigation">
            <span className="automate-brand">
              <BrandLogo label={t.brandLabel} />
            </span>

            <div className="automate-nav-links">
              <a
                href={mainSiteHref}
                className="automate-back-link"
                onClick={(e) => handleNavClick(e, 'automate')}
              >
                {t.homeLink}
              </a>
              <a
                href={aboutHref}
                className="automate-back-link"
                onClick={(e) => handleNavClick(e, 'about')}
              >
                {t.aboutLink}
              </a>
            </div>
          </nav>

          <main id="main" tabIndex={-1}>
            <section
              className="dashboard-login-card"
              aria-labelledby="dashboard-login-heading"
            >
              <span className="dashboard-badge">
                Protected Owner Analytics &amp; PostHog Console
              </span>
              <h1 id="dashboard-login-heading">Sign in to Analytics Dashboard</h1>
              <p>
                Authenticate with the owner account ({OWNER_EMAIL}) or connect
                directly using your session-scoped PostHog Personal API Key (
                <code>phx_...</code>).
              </p>

              <form
                className="automate-form"
                onSubmit={handlePassphraseSubmit}
                noValidate
              >
                <div className="automate-field">
                  <label htmlFor="dash-owner-email">Owner Email</label>
                  <input
                    id="dash-owner-email"
                    name="email"
                    type="email"
                    className="automate-input"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={INPUT_BOUNDS.email}
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder={OWNER_EMAIL}
                  />
                </div>

                <div className="automate-field">
                  <label htmlFor="dash-owner-passphrase">Owner Passphrase</label>
                  <input
                    id="dash-owner-passphrase"
                    name="passphrase"
                    type="password"
                    className="automate-input"
                    autoComplete="current-password"
                    maxLength={INPUT_BOUNDS.passphrase}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter owner passphrase"
                  />
                </div>

                <div className="automate-form-actions">
                  <button
                    type="submit"
                    className="automate-btn-primary"
                    disabled={authBusy || isLockedOut}
                  >
                    {isLockedOut
                      ? `Locked (${lockoutRemainingSec}s)`
                      : 'Sign In as Owner'}
                  </button>
                </div>
              </form>

              <div className="dashboard-auth-divider">OR</div>

              <form
                className="automate-form"
                onSubmit={handleDirectKeyLogin}
                noValidate
              >
                <div className="automate-form-row">
                  <div className="automate-field">
                    <label htmlFor="dash-login-region">PostHog Region</label>
                    <select
                      id="dash-login-region"
                      name="region"
                      className="automate-select"
                      value={region}
                      onChange={(e) =>
                        setRegion(normalizePostHogRegion(e.target.value))
                      }
                    >
                      <option value="eu">EU Cloud (eu.posthog.com)</option>
                      <option value="us">US Cloud (us.posthog.com)</option>
                    </select>
                  </div>

                  <div className="automate-field">
                    <label htmlFor="dash-login-project-id">Project ID</label>
                    <input
                      id="dash-login-project-id"
                      name="projectId"
                      type="text"
                      className="automate-input"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={INPUT_BOUNDS.projectId}
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="e.g. 12345"
                    />
                  </div>
                </div>

                <div className="automate-field">
                  <label htmlFor="dash-login-personal-key">
                    PostHog Personal API Key (phx_...)
                  </label>
                  <input
                    id="dash-login-personal-key"
                    name="personalApiKey"
                    type="password"
                    className="automate-input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={INPUT_BOUNDS.apiKey}
                    value={personalApiKey}
                    onChange={(e) => setPersonalApiKey(e.target.value)}
                    placeholder="phx_..."
                  />
                </div>

                <div className="automate-form-actions">
                  <button
                    type="submit"
                    className="automate-btn-secondary"
                    disabled={authBusy}
                  >
                    {authBusy
                      ? 'Verifying Key...'
                      : 'Verify & Connect with PostHog Key'}
                  </button>
                </div>
              </form>

              {authError && (
                <div className="automate-form-error" role="alert">
                  {isLockedOut
                    ? `Too many failed login attempts. Try again in ${lockoutRemainingSec}s.`
                    : authError}
                </div>
              )}

              <p className="automate-form-note">
                Zero cookies used. Personal API keys stay strictly in{' '}
                <code>sessionStorage</code> for this browser tab session.
              </p>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const phLive = liveAnalytics?.ok ? liveAnalytics : null;
  const siteIndexableCount = siteAudit?.ok
    ? siteAudit.pages.filter((p) => p.indexable).length
    : 0;
  const siteTotalCount = siteAudit?.ok ? siteAudit.pages.length : 0;
  const siteBlockers = siteAudit?.ok
    ? siteAudit.pages.filter((p) => !p.indexable)
    : [];

  const posthogBaseProjectUrl = phLive
    ? `https://${phLive.region}.posthog.com/project/${encodeURIComponent(phLive.projectId)}`
    : '';

  const maxDailyValue = phLive
    ? Math.max(
        1,
        ...phLive.dailyTrend.map((d) => Math.max(d.pageviews, d.visitors))
      )
    : 1;

  return (
    <div className="dashboard-root">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <span className="automate-brand">
              <BrandLogo label={t.brandLabel} />
            </span>
            <h1 className="dashboard-page-title">
              {lang === 'nl'
                ? 'Live Bezoek- & Vindbaarheidsdashboard'
                : 'Live Traffic & Findability Dashboard'}
            </h1>
            <div className="dashboard-badge-row">
              <span
                className={`dashboard-badge ${
                  phLive ? 'dashboard-badge-live' : 'dashboard-badge-warn'
                }`}
              >
                {phLive
                  ? t.livePosthogBadge(phLive.region, phLive.days)
                  : t.posthogPendingBadge}
              </span>
              <span className="dashboard-badge">
                {excludeLocal ? t.scopeProdBadge : t.scopeAllBadge}
              </span>
              {siteAudit?.ok && (
                <span
                  className={`dashboard-badge ${
                    siteIndexableCount === siteTotalCount
                      ? 'dashboard-badge-live'
                      : 'dashboard-badge-warn'
                  }`}
                >
                  {t.siteAuditBadge(siteIndexableCount, siteTotalCount)}
                </span>
              )}
              {!isLocalOnly && (
                <span className="dashboard-badge">
                  Auth:{' '}
                  {authMethod === 'posthog_key' ? 'PostHog Key' : OWNER_EMAIL}
                </span>
              )}
            </div>
          </div>

          <div className="dashboard-header-actions">
            <a
              href={mainSiteHref}
              className="automate-back-link"
              onClick={(e) => handleNavClick(e, 'automate')}
            >
              {t.homeLink}
            </a>
            <a
              href={aboutHref}
              className="automate-back-link"
              onClick={(e) => handleNavClick(e, 'about')}
            >
              {t.aboutLink}
            </a>

            <div
              className="automate-lang-switch"
              role="group"
              aria-label="Dashboard language"
            >
              <button
                type="button"
                className={`automate-lang-btn ${lang === 'nl' ? 'is-active' : ''}`}
                aria-pressed={lang === 'nl'}
                onClick={() => setLang('nl')}
              >
                NL
              </button>
              <button
                type="button"
                className={`automate-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
                aria-pressed={lang === 'en'}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              className="automate-btn-primary"
              disabled={posthogBusy || siteAuditBusy || discoveryBusy}
              onClick={() => void handleRefreshAll()}
            >
              {posthogBusy || siteAuditBusy || discoveryBusy
                ? t.refreshing
                : t.refreshAll}
            </button>

            {!isLocalOnly && (
              <button
                type="button"
                className="automate-btn-secondary"
                onClick={handleSignOut}
              >
                {t.signOut}
              </button>
            )}
          </div>
        </header>

        <main id="main" tabIndex={-1}>
          {/* Live Controls & Connections Toolbar */}
          <section
            className="dashboard-toolbar"
            aria-label={t.periodLabel}
          >
            <div className="dashboard-toolbar-controls">
              <div className="dashboard-period-group" role="group" aria-label={t.periodLabel}>
                <span className="dashboard-control-label">{t.periodLabel}:</span>
                {([7, 30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`dashboard-pill-btn ${
                      daysWindow === d ? 'is-active' : ''
                    }`}
                    aria-pressed={daysWindow === d}
                    onClick={() => handleTimeWindowChange(d)}
                  >
                    {d} {t.daysUnit}
                  </button>
                ))}
              </div>

              <label className="dashboard-checkbox-label" htmlFor={`excl-local-${uid}`}>
                <input
                  id={`excl-local-${uid}`}
                  type="checkbox"
                  checked={excludeLocal}
                  onChange={(e) => handleExcludeLocalToggle(e.target.checked)}
                />
                <span>{t.excludeLocalLabel}</span>
              </label>

              <button
                type="button"
                className="automate-btn-secondary"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((prev) => !prev)}
              >
                {t.settingsToggle}
              </button>
            </div>

            {posthogStatusMsg && (
              <div className="automate-form-status" role="status" aria-live="polite">
                <span>{posthogStatusMsg}</span>
              </div>
            )}
            {posthogError && (
              <div className="automate-form-error" role="alert">
                {posthogError}
              </div>
            )}

            {settingsOpen && (
              <form
                className="dashboard-posthog-config"
                onSubmit={handleSaveAndFetchConfig}
                noValidate
              >
                <div className="dashboard-config-head">
                  <h2>{t.settingsToggle}</h2>
                  {envStatus.posthogEnvConfigured && (
                    <span className="dashboard-badge dashboard-badge-live">
                      {t.envActiveNote}
                    </span>
                  )}
                </div>
                <p id={`ph-cfg-help-${uid}`} className="automate-form-note" style={{ marginTop: 0 }}>
                  {t.connectBody}
                </p>

                <div className="dashboard-config-grid">
                  <div className="automate-field">
                    <label htmlFor={`ph-region-${uid}`}>PostHog Region</label>
                    <select
                      id={`ph-region-${uid}`}
                      name="region"
                      className="automate-select"
                      value={region}
                      onChange={(e) =>
                        setRegion(normalizePostHogRegion(e.target.value))
                      }
                    >
                      <option value="eu">EU (eu.posthog.com)</option>
                      <option value="us">US (us.posthog.com)</option>
                    </select>
                  </div>

                  <div className="automate-field">
                    <label htmlFor={`ph-project-id-${uid}`}>PostHog Project ID</label>
                    <input
                      id={`ph-project-id-${uid}`}
                      name="projectId"
                      type="text"
                      className="automate-input"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-describedby={`ph-cfg-help-${uid}`}
                      maxLength={INPUT_BOUNDS.projectId}
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="e.g. 67890"
                    />
                  </div>

                  <div className="automate-field">
                    <label htmlFor={`ph-personal-key-${uid}`}>
                      Personal API Key (phx_...)
                    </label>
                    <div className="dashboard-input-with-toggle">
                      <input
                        id={`ph-personal-key-${uid}`}
                        name="personalApiKey"
                        type={showPersonalKey ? 'text' : 'password'}
                        className="automate-input"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={INPUT_BOUNDS.apiKey}
                        value={personalApiKey}
                        onChange={(e) => setPersonalApiKey(e.target.value)}
                        placeholder={
                          envStatus.posthogEnvConfigured
                            ? '(.env actief — optioneel overschrijven)'
                            : 'phx_...'
                        }
                      />
                      <button
                        type="button"
                        className="dashboard-reveal-btn"
                        aria-pressed={showPersonalKey}
                        aria-label={
                          showPersonalKey
                            ? 'Hide Personal API Key'
                            : 'Show Personal API Key'
                        }
                        onClick={() => setShowPersonalKey((prev) => !prev)}
                      >
                        {showPersonalKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="automate-field">
                    <label htmlFor={`ph-project-key-${uid}`}>
                      Project Token (phc_...)
                    </label>
                    <input
                      id={`ph-project-key-${uid}`}
                      name="projectApiKey"
                      type="text"
                      className="automate-input"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={INPUT_BOUNDS.apiKey}
                      value={projectApiKey}
                      onChange={(e) => setProjectApiKey(e.target.value)}
                      placeholder="phc_..."
                    />
                  </div>

                  <div className="automate-field">
                    <label htmlFor={`psi-api-key-${uid}`}>
                      Google PageSpeed Key (optioneel)
                    </label>
                    <div className="dashboard-input-with-toggle">
                      <input
                        id={`psi-api-key-${uid}`}
                        name="pageSpeedApiKey"
                        type={showPsiKey ? 'text' : 'password'}
                        className="automate-input"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={INPUT_BOUNDS.apiKey}
                        value={pageSpeedApiKey}
                        onChange={(e) => setPageSpeedApiKey(e.target.value)}
                        placeholder={
                          envStatus.hasPageSpeedKey
                            ? '(.env actief)'
                            : 'AIza... (alleen bij HTTP 429)'
                        }
                      />
                      <button
                        type="button"
                        className="dashboard-reveal-btn"
                        aria-pressed={showPsiKey}
                        aria-label={
                          showPsiKey
                            ? 'Hide PageSpeed API Key'
                            : 'Show PageSpeed API Key'
                        }
                        onClick={() => setShowPsiKey((prev) => !prev)}
                      >
                        {showPsiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="automate-form-actions">
                  <button
                    type="submit"
                    className="automate-btn-primary"
                    disabled={posthogBusy}
                  >
                    {posthogBusy ? t.refreshing : t.fetchPostHogBtn}
                  </button>
                  <button
                    type="button"
                    className="automate-btn-secondary"
                    onClick={handleClearSessionKeys}
                  >
                    {t.disconnectBtn}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Single-Row Accessible Tabs */}
          <div
            role="tablist"
            aria-label="Dashboard secties"
            className="dashboard-tablist"
          >
            {DASHBOARD_TABS.map((tab, idx) => (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${tab.id}-${uid}`}
                aria-selected={activeTab === tab.id}
                tabIndex={activeTab === tab.id ? 0 : -1}
                className="dashboard-tab"
                onClick={() => selectTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
              >
                {lang === 'nl' ? tab.nl : tab.en}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERZICHT & BEZOEK (POSTHOG LIVE) */}
          <div
            role="tabpanel"
            id={`panel-bezoek-${uid}`}
            aria-labelledby={`tab-bezoek-${uid}`}
            hidden={activeTab !== 'bezoek'}
          >
            <div className="dashboard-tabpanel-inner">
              {!phLive ? (
                <section className="dashboard-panel dashboard-connect-prompt">
                  <h2>{t.connectHeading}</h2>
                  <p>{t.connectBody}</p>
                  <div className="automate-form-actions">
                    <button
                      type="button"
                      className="automate-btn-primary"
                      onClick={() => setSettingsOpen(true)}
                    >
                      {t.openSettingsBtn}
                    </button>
                    <button
                      type="button"
                      className="automate-btn-secondary"
                      onClick={() => selectTab('vindbaarheid')}
                    >
                      {lang === 'nl'
                        ? 'Bekijk nu live Vindbaarheid & SEO-Audit →'
                        : 'View Live Findability & SEO Audit →'}
                    </button>
                  </div>
                </section>
              ) : (
                <>
                  {/* 6 Real-Data KPI Cards */}
                  <section
                    className="dashboard-kpi-grid"
                    aria-label="PostHog live KPI summary"
                  >
                    <article className="dashboard-kpi-card">
                      <span className="dashboard-kpi-label">{t.kpiVisitors}</span>
                      <span className="dashboard-kpi-value">
                        {phLive.summary.totalUniqueVisitors}
                      </span>
                      <span className="dashboard-kpi-sub">
                        {phLive.days} {t.daysUnit} · PostHog Cloud
                      </span>
                    </article>

                    <article className="dashboard-kpi-card">
                      <span className="dashboard-kpi-label">{t.kpiPageviews}</span>
                      <span className="dashboard-kpi-value">
                        {phLive.summary.totalPageviews}
                      </span>
                      <span className="dashboard-kpi-sub">
                        {phLive.summary.pagesPerVisitor} /{' '}
                        {lang === 'nl' ? 'bezoeker' : 'visitor'}
                      </span>
                    </article>

                    <article className="dashboard-kpi-card">
                      <span className="dashboard-kpi-label">{t.kpiSessions}</span>
                      <span className="dashboard-kpi-value">
                        {phLive.summary.totalSessions}
                      </span>
                      <span className="dashboard-kpi-sub">
                        {lang === 'nl' ? 'Gem.' : 'Avg'}{' '}
                        {formatDuration(phLive.summary.avgSessionDurationSec)}
                      </span>
                    </article>

                    <article className="dashboard-kpi-card">
                      <span className="dashboard-kpi-label">{t.kpiBounce}</span>
                      <span className="dashboard-kpi-value">
                        {phLive.summary.bounceRatePct}%
                      </span>
                      <span className="dashboard-kpi-sub">
                        {lang === 'nl'
                          ? 'Enkele pagina / ≤2 events'
                          : 'Single page / ≤2 events'}
                      </span>
                    </article>

                    <article className="dashboard-kpi-card">
                      <span className="dashboard-kpi-label">{t.kpiConversions}</span>
                      <span className="dashboard-kpi-value">
                        {phLive.summary.inquiryClicks}
                      </span>
                      <span className="dashboard-kpi-sub">
                        {phLive.summary.formSubmits}{' '}
                        {lang === 'nl' ? 'formulier(en)' : 'submit(s)'} ·{' '}
                        {phLive.summary.conversionRatePct}%
                      </span>
                    </article>

                    <article className="dashboard-kpi-card">
                      <span className="dashboard-kpi-label">{t.kpiSearchAi}</span>
                      <span className="dashboard-kpi-value">
                        {phLive.summary.searchAndAiVisitors}
                      </span>
                      <span className="dashboard-kpi-sub">
                        {phLive.summary.searchAndAiSharePct}%{' '}
                        {lang === 'nl' ? 'van bekende bronnen' : 'of attributed'}
                      </span>
                    </article>
                  </section>

                  {/* Daily Trend SVG Chart + Accessible Data Table */}
                  <section
                    className="dashboard-panel"
                    aria-labelledby={`trend-heading-${uid}`}
                  >
                    <div className="dashboard-panel-head">
                      <div>
                        <h2 id={`trend-heading-${uid}`}>{t.trendHeading}</h2>
                        <p className="dashboard-panel-sub">{t.trendSub}</p>
                      </div>
                      <span className="dashboard-legend">
                        <span className="dashboard-legend-item">
                          <span className="dashboard-dot is-pv" aria-hidden="true" />
                          {lang === 'nl' ? 'Paginaweergaves' : 'Pageviews'}
                        </span>
                        <span className="dashboard-legend-item">
                          <span className="dashboard-dot is-vis" aria-hidden="true" />
                          {lang === 'nl' ? 'Bezoekers' : 'Visitors'}
                        </span>
                      </span>
                    </div>

                    {phLive.dailyTrend.length === 0 ? (
                      <p className="dashboard-empty">{t.noData}</p>
                    ) : (
                      <>
                        <div className="dashboard-chart-wrap">
                          <svg
                            className="dashboard-bar-svg"
                            viewBox={`0 0 ${Math.max(420, phLive.dailyTrend.length * 28)} 150`}
                            role="img"
                            aria-label={`${t.trendHeading}: ${phLive.dailyTrend
                              .map((d) => `${d.day}: ${d.visitors} visitors, ${d.pageviews} pageviews`)
                              .join('; ')}`}
                          >
                            {phLive.dailyTrend.map((point, i) => {
                              const slotW = Math.max(
                                18,
                                Math.floor(
                                  Math.max(420, phLive.dailyTrend.length * 28) /
                                    phLive.dailyTrend.length
                                )
                              );
                              const x = i * slotW + 4;
                              const pvH = Math.max(
                                point.pageviews > 0 ? 4 : 0,
                                Math.round((point.pageviews / maxDailyValue) * 108)
                              );
                              const visH = Math.max(
                                point.visitors > 0 ? 4 : 0,
                                Math.round((point.visitors / maxDailyValue) * 108)
                              );
                              const barW = Math.max(5, Math.floor((slotW - 10) / 2));
                              return (
                                <g key={point.day}>
                                  <rect
                                    x={x}
                                    y={120 - pvH}
                                    width={barW}
                                    height={pvH}
                                    rx="2"
                                    fill="rgba(217, 79, 72, 0.35)"
                                  >
                                    <title>{`${point.day}: ${point.pageviews} pageviews`}</title>
                                  </rect>
                                  <rect
                                    x={x + barW + 2}
                                    y={120 - visH}
                                    width={barW}
                                    height={visH}
                                    rx="2"
                                    fill="#d94f48"
                                  >
                                    <title>{`${point.day}: ${point.visitors} visitors`}</title>
                                  </rect>
                                  {(i === 0 ||
                                    i === phLive.dailyTrend.length - 1 ||
                                    i % Math.max(1, Math.ceil(phLive.dailyTrend.length / 6)) === 0) && (
                                    <text
                                      x={x + barW}
                                      y="140"
                                      textAnchor="middle"
                                      fontSize="9.5"
                                      fill="#5c606b"
                                    >
                                      {point.day.slice(5)}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        </div>

                        <details className="dashboard-details">
                          <summary>
                            {lang === 'nl'
                              ? `Bekijk dagelijkse tabel (${phLive.dailyTrend.length} dagen)`
                              : `View daily data table (${phLive.dailyTrend.length} days)`}
                          </summary>
                          <div
                            tabIndex={0}
                            role="region"
                            aria-labelledby={`trend-table-cap-${uid}`}
                            className="dashboard-table-wrap"
                          >
                            <table className="dashboard-table dashboard-responsive-table">
                              <caption id={`trend-table-cap-${uid}`} className="sr-only">
                                {t.trendHeading}
                              </caption>
                              <thead>
                                <tr>
                                  <th scope="col">{lang === 'nl' ? 'Datum' : 'Date'}</th>
                                  <th scope="col">{t.kpiVisitors}</th>
                                  <th scope="col">{t.kpiPageviews}</th>
                                  <th scope="col">{lang === 'nl' ? 'Conversies' : 'Conversions'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {phLive.dailyTrend.map((d) => (
                                  <tr key={d.day}>
                                    <th scope="row">{d.day}</th>
                                    <td data-label={t.kpiVisitors}>{d.visitors}</td>
                                    <td data-label={t.kpiPageviews}>{d.pageviews}</td>
                                    <td data-label={lang === 'nl' ? 'Conversies' : 'Conversions'}>
                                      {d.conversions}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </>
                    )}
                  </section>

                  {/* Top Pages + Subdomains */}
                  <div className="dashboard-grid-2">
                    <section
                      className="dashboard-panel"
                      aria-labelledby={`top-pages-heading-${uid}`}
                    >
                      <h2 id={`top-pages-heading-${uid}`}>{t.topPagesHeading}</h2>
                      {phLive.topPages.length === 0 ? (
                        <p className="dashboard-empty">{t.noData}</p>
                      ) : (
                        <div
                          tabIndex={0}
                          role="region"
                          aria-labelledby={`top-pages-heading-${uid}`}
                          className="dashboard-table-wrap"
                        >
                          <table className="dashboard-table dashboard-responsive-table">
                            <caption className="sr-only">{t.topPagesHeading}</caption>
                            <thead>
                              <tr>
                                <th scope="col">URL</th>
                                <th scope="col">{t.kpiVisitors}</th>
                                <th scope="col">{t.kpiPageviews}</th>
                                <th scope="col">Events</th>
                              </tr>
                            </thead>
                            <tbody>
                              {phLive.topPages.map((p) => (
                                <tr key={`${p.host}${p.pathname}`}>
                                  <th scope="row">
                                    <span className="dashboard-code-pill">
                                      {p.host}
                                      {p.pathname}
                                    </span>
                                  </th>
                                  <td data-label={t.kpiVisitors}>{p.visitors}</td>
                                  <td data-label={t.kpiPageviews}>{p.pageviews}</td>
                                  <td data-label="Events">{p.events}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    <section
                      className="dashboard-panel"
                      aria-labelledby={`subdomains-heading-${uid}`}
                    >
                      <h2 id={`subdomains-heading-${uid}`}>{t.subdomainsHeading}</h2>
                      {phLive.summary.subdomains.length === 0 ? (
                        <p className="dashboard-empty">{t.noData}</p>
                      ) : (
                        <div
                          tabIndex={0}
                          role="region"
                          aria-labelledby={`subdomains-heading-${uid}`}
                          className="dashboard-table-wrap"
                        >
                          <table className="dashboard-table dashboard-responsive-table">
                            <caption className="sr-only">{t.subdomainsHeading}</caption>
                            <thead>
                              <tr>
                                <th scope="col">Host</th>
                                <th scope="col">{t.kpiVisitors}</th>
                                <th scope="col">{t.kpiPageviews}</th>
                                <th scope="col">Events</th>
                              </tr>
                            </thead>
                            <tbody>
                              {phLive.summary.subdomains.map((row) => (
                                <tr key={row.subdomain}>
                                  <th scope="row">
                                    <span className="dashboard-code-pill">
                                      {row.subdomain}
                                    </span>
                                  </th>
                                  <td data-label={t.kpiVisitors}>{row.visitors}</td>
                                  <td data-label={t.kpiPageviews}>{row.pageviews}</td>
                                  <td data-label="Events">{row.events}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Real-User PostHog Web Vitals + Locations & Devices + Interactions */}
                  <div className="dashboard-grid-2">
                    <section
                      className="dashboard-panel"
                      aria-labelledby={`vitals-heading-${uid}`}
                    >
                      <h2 id={`vitals-heading-${uid}`}>{t.webVitalsHeading}</h2>
                      {phLive.webVitals.sampleCount === 0 ? (
                        <p className="dashboard-empty">{t.webVitalsEmpty}</p>
                      ) : (
                        <div className="dashboard-mini-metrics">
                          <div className={`dashboard-metric-chip is-${rateVitalStatus('LCP', phLive.webVitals.lcpP75Ms)}`}>
                            <span>LCP (p75)</span>
                            <strong>{formatVitalMs(phLive.webVitals.lcpP75Ms)}</strong>
                          </div>
                          <div className={`dashboard-metric-chip is-${rateVitalStatus('FCP', phLive.webVitals.fcpP75Ms)}`}>
                            <span>FCP (p75)</span>
                            <strong>{formatVitalMs(phLive.webVitals.fcpP75Ms)}</strong>
                          </div>
                          <div className={`dashboard-metric-chip is-${rateVitalStatus('INP', phLive.webVitals.inpP75Ms)}`}>
                            <span>INP (p75)</span>
                            <strong>{formatVitalMs(phLive.webVitals.inpP75Ms)}</strong>
                          </div>
                          <div className={`dashboard-metric-chip is-${rateVitalStatus('CLS', phLive.webVitals.clsP75)}`}>
                            <span>CLS (p75)</span>
                            <strong>{formatCls(phLive.webVitals.clsP75)}</strong>
                          </div>
                        </div>
                      )}

                      <h3>{t.interactionsHeading}</h3>
                      {phLive.languages.length > 0 && (
                        <div className="dashboard-badge-row">
                          {phLive.languages.map((l) => (
                            <span key={l.lang} className="dashboard-badge">
                              Taal {l.lang.toUpperCase()}: {l.visitors}{' '}
                              {lang === 'nl' ? 'bezoekers' : 'visitors'} ({l.events} events)
                            </span>
                          ))}
                        </div>
                      )}
                      {phLive.topInteractions.length === 0 ? (
                        <p className="dashboard-empty">{t.noData}</p>
                      ) : (
                        <div
                          tabIndex={0}
                          role="region"
                          aria-label={t.interactionsHeading}
                          className="dashboard-table-wrap"
                        >
                          <table className="dashboard-table dashboard-responsive-table">
                            <caption className="sr-only">{t.interactionsHeading}</caption>
                            <thead>
                              <tr>
                                <th scope="col">Event</th>
                                <th scope="col">{lang === 'nl' ? 'Aantal' : 'Count'}</th>
                                <th scope="col">{t.kpiVisitors}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {phLive.topInteractions.map((item) => (
                                <tr key={item.event}>
                                  <th scope="row">
                                    <span className="dashboard-code-pill">
                                      {item.event}
                                    </span>
                                  </th>
                                  <td data-label={lang === 'nl' ? 'Aantal' : 'Count'}>
                                    {item.count}
                                  </td>
                                  <td data-label={t.kpiVisitors}>{item.visitors}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    <section
                      className="dashboard-panel"
                      aria-labelledby={`geo-heading-${uid}`}
                    >
                      <h2 id={`geo-heading-${uid}`}>{t.geoDevicesHeading}</h2>
                      {phLive.devices.length > 0 && (
                        <div className="dashboard-badge-row">
                          {phLive.devices.map((d) => (
                            <span key={d.deviceType} className="dashboard-badge">
                              {d.deviceType}: {d.visitors} ({d.sharePct}%)
                            </span>
                          ))}
                        </div>
                      )}
                      {phLive.locations.length === 0 ? (
                        <p className="dashboard-empty">{t.noData}</p>
                      ) : (
                        <div
                          tabIndex={0}
                          role="region"
                          aria-labelledby={`geo-heading-${uid}`}
                          className="dashboard-table-wrap"
                        >
                          <table className="dashboard-table dashboard-responsive-table">
                            <caption className="sr-only">{t.geoDevicesHeading}</caption>
                            <thead>
                              <tr>
                                <th scope="col">{lang === 'nl' ? 'Locatie' : 'Location'}</th>
                                <th scope="col">{t.kpiVisitors}</th>
                                <th scope="col">{t.kpiPageviews}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {phLive.locations.map((loc, i) => (
                                <tr key={`${loc.label}_${i}`}>
                                  <th scope="row">{loc.label}</th>
                                  <td data-label={t.kpiVisitors}>{loc.visitors}</td>
                                  <td data-label={t.kpiPageviews}>{loc.pageviews}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TAB 2: VINDBAARHEID & LIVE CRAWL AUDIT */}
          <div
            role="tabpanel"
            id={`panel-vindbaarheid-${uid}`}
            aria-labelledby={`tab-vindbaarheid-${uid}`}
            hidden={activeTab !== 'vindbaarheid'}
          >
            <div className="dashboard-tabpanel-inner">
              {/* Part A: PostHog Acquisition & Channels */}
              <section
                className="dashboard-panel"
                aria-labelledby={`channels-heading-${uid}`}
              >
                <h2 id={`channels-heading-${uid}`}>{t.channelsHeading}</h2>
                {!phLive ? (
                  <p className="dashboard-empty">{t.connectBody}</p>
                ) : (
                  <div className="dashboard-channel-list">
                    {phLive.channels.map((ch) => (
                      <div key={ch.channel} className="dashboard-channel-row">
                        <div className="dashboard-channel-meta">
                          <strong>{t.channels[ch.channel]}</strong>
                          <span>
                            {ch.visitors} {lang === 'nl' ? 'bezoekers' : 'visitors'} ({ch.sharePct}%) ·{' '}
                            {ch.pageviews} views · {ch.conversions}{' '}
                            {lang === 'nl' ? 'conversies' : 'conversions'}
                          </span>
                        </div>
                        <div className="dashboard-progress-track" aria-hidden="true">
                          <div
                            className={`dashboard-progress-fill is-${ch.channel}`}
                            style={{ width: `${Math.max(ch.visitors > 0 ? 4 : 0, ch.sharePct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {phLive && (
                <div className="dashboard-grid-2">
                  <section
                    className="dashboard-panel"
                    aria-labelledby={`referrers-heading-${uid}`}
                  >
                    <h2 id={`referrers-heading-${uid}`}>{t.referrersHeading}</h2>
                    {phLive.referrers.length === 0 ? (
                      <p className="dashboard-empty">{t.noData}</p>
                    ) : (
                      <div
                        tabIndex={0}
                        role="region"
                        aria-labelledby={`referrers-heading-${uid}`}
                        className="dashboard-table-wrap"
                      >
                        <table className="dashboard-table dashboard-responsive-table">
                          <caption className="sr-only">{t.referrersHeading}</caption>
                          <thead>
                            <tr>
                              <th scope="col">{lang === 'nl' ? 'Bron / Domein' : 'Source / Domain'}</th>
                              <th scope="col">{lang === 'nl' ? 'Kanaal' : 'Channel'}</th>
                              <th scope="col">{t.kpiVisitors}</th>
                              <th scope="col">{t.kpiPageviews}</th>
                              <th scope="col">{lang === 'nl' ? 'Conv.' : 'Conv.'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phLive.referrers.map((r, i) => (
                              <tr key={`${r.referringDomain}_${r.utmSource}_${i}`}>
                                <th scope="row">
                                  <span className="dashboard-code-pill">
                                    {r.referringDomain}
                                  </span>
                                  {r.utmSource && (
                                    <div className="dashboard-subtext">
                                      utm_source={r.utmSource}
                                      {r.utmMedium ? ` · ${r.utmMedium}` : ''}
                                    </div>
                                  )}
                                </th>
                                <td data-label={lang === 'nl' ? 'Kanaal' : 'Channel'}>
                                  {t.channels[r.channel]}
                                </td>
                                <td data-label={t.kpiVisitors}>{r.visitors}</td>
                                <td data-label={t.kpiPageviews}>{r.pageviews}</td>
                                <td data-label="Conv.">{r.conversions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section
                    className="dashboard-panel"
                    aria-labelledby={`landing-heading-${uid}`}
                  >
                    <h2 id={`landing-heading-${uid}`}>{t.landingHeading}</h2>
                    {phLive.landingPages.length === 0 ? (
                      <p className="dashboard-empty">{t.noData}</p>
                    ) : (
                      <div
                        tabIndex={0}
                        role="region"
                        aria-labelledby={`landing-heading-${uid}`}
                        className="dashboard-table-wrap"
                      >
                        <table className="dashboard-table dashboard-responsive-table">
                          <caption className="sr-only">{t.landingHeading}</caption>
                          <thead>
                            <tr>
                              <th scope="col">Entry URL</th>
                              <th scope="col">{t.kpiVisitors}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phLive.landingPages.map((lp) => (
                              <tr key={`${lp.host}${lp.pathname}`}>
                                <th scope="row">
                                  <span className="dashboard-code-pill">
                                    {lp.host}
                                    {lp.pathname}
                                  </span>
                                </th>
                                <td data-label={t.kpiVisitors}>{lp.visitors}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* Part B: Live Production Indexability & Crawl Audit */}
              <section
                className="dashboard-panel"
                aria-labelledby={`site-audit-heading-${uid}`}
              >
                <div className="dashboard-panel-head">
                  <div>
                    <h2 id={`site-audit-heading-${uid}`}>{t.siteAuditHeading}</h2>
                    <p className="dashboard-panel-sub">{t.siteAuditSub}</p>
                  </div>
                  <button
                    type="button"
                    className="automate-btn-secondary"
                    disabled={siteAuditBusy}
                    onClick={() => void runExternalProbes()}
                  >
                    {siteAuditBusy ? t.refreshing : 'Live crawl herhalen'}
                  </button>
                </div>

                {siteAudit && !siteAudit.ok && (
                  <div className="automate-form-error" role="alert">
                    {siteAudit.error}
                  </div>
                )}

                {siteBlockers.length > 0 && (
                  <div className="dashboard-alert-box is-warn" role="status">
                    <strong>
                      {lang === 'nl'
                        ? `${siteBlockers.length} live vindbaarheidsblokkade(s) gevonden:`
                        : `${siteBlockers.length} live indexability issue(s) detected:`}
                    </strong>
                    <ul className="dashboard-alert-list">
                      {siteBlockers.map((b) => (
                        <li key={b.id}>
                          <code>{b.url}</code>: {b.issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {siteAudit?.ok && (
                  <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby={`site-audit-heading-${uid}`}
                    className="dashboard-table-wrap"
                  >
                    <table className="dashboard-table dashboard-responsive-table">
                      <caption className="sr-only">{t.siteAuditHeading}</caption>
                      <thead>
                        <tr>
                          <th scope="col">URL</th>
                          <th scope="col">HTTP / TLS</th>
                          <th scope="col">TTFB</th>
                          <th scope="col">SEO Meta &amp; JSON-LD</th>
                          <th scope="col">{lang === 'nl' ? 'Indexeerbaar' : 'Indexable'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {siteAudit.pages.map((page) => (
                          <tr key={page.id}>
                            <th scope="row">
                              <span className="dashboard-code-pill">{page.url}</span>
                              {page.meta.title && (
                                <div className="dashboard-subtext">{page.meta.title}</div>
                              )}
                            </th>
                            <td data-label="HTTP / TLS">
                              <span
                                className={`dashboard-status-pill ${
                                  page.ok && page.tls.valid ? 'is-good' : 'is-poor'
                                }`}
                              >
                                {page.statusCode ? `HTTP ${page.statusCode}` : 'Fout'} ·{' '}
                                {page.tls.valid ? 'TLS OK' : 'TLS Fout'}
                              </span>
                              {page.tls.validTo && (
                                <div className="dashboard-subtext">
                                  {page.tls.issuer || 'TLS'} · nog {page.tls.daysRemaining}d
                                </div>
                              )}
                            </td>
                            <td data-label="TTFB">
                              {page.ttfbMs !== null ? `${page.ttfbMs} ms` : '—'}
                            </td>
                            <td data-label="SEO Meta">
                              {page.reachable ? (
                                <div className="dashboard-subtext">
                                  Robots: {page.meta.metaRobots || 'default'} · Canonical:{' '}
                                  {page.meta.canonicalUrl || 'ontbreekt'}
                                  <br />
                                  OG: {page.meta.hasOpenGraph ? 'Ja' : 'Nee'} · JSON-LD:{' '}
                                  {page.meta.jsonLdTypes.length > 0
                                    ? page.meta.jsonLdTypes.join(', ')
                                    : 'geen'}
                                </div>
                              ) : (
                                <span className="dashboard-subtext">{page.error}</span>
                              )}
                            </td>
                            <td data-label={lang === 'nl' ? 'Indexeerbaar' : 'Indexable'}>
                              <span
                                className={`dashboard-status-pill ${
                                  page.indexable ? 'is-good' : 'is-poor'
                                }`}
                              >
                                {page.indexable
                                  ? lang === 'nl'
                                    ? 'Ja'
                                    : 'Yes'
                                  : lang === 'nl'
                                    ? 'Geblokkeerd'
                                    : 'Blocked'}
                              </span>
                              {page.issue && (
                                <div className="dashboard-subtext">{page.issue}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Part C: Crawlers (robots.txt, sitemap, llms.txt) + DNS / RDAP / Wayback */}
              <div className="dashboard-grid-2">
                <section
                  className="dashboard-panel"
                  aria-labelledby={`crawlers-heading-${uid}`}
                >
                  <h2 id={`crawlers-heading-${uid}`}>{t.crawlersHeading}</h2>
                  {siteAudit?.ok ? (
                    <>
                      <div className="dashboard-badge-row">
                        {siteAudit.files.map((f) => (
                          <span
                            key={f.id}
                            className={`dashboard-status-pill ${
                              f.ok ? 'is-good' : 'is-poor'
                            }`}
                          >
                            {f.name}: {f.statusCode ? `HTTP ${f.statusCode}` : 'Fout'} (
                            {f.bytes} B · {f.latencyMs}ms)
                          </span>
                        ))}
                      </div>

                      {siteAudit.robots && (
                        <>
                          <h3>Zoekmachine- &amp; AI-bots in live robots.txt</h3>
                          <div className="dashboard-badge-row">
                            {siteAudit.robots.botAccess.map((b) => (
                              <span
                                key={b.bot}
                                className={`dashboard-status-pill ${
                                  b.allowed ? 'is-good' : 'is-poor'
                                }`}
                              >
                                {b.bot}: {b.allowed ? 'Toegestaan' : 'Geblokkeerd'}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      {siteAudit.sitemapUrls.length > 0 && (
                        <div
                          tabIndex={0}
                          role="region"
                          aria-label="Live sitemap URL status"
                          className="dashboard-table-wrap"
                        >
                          <table className="dashboard-table dashboard-responsive-table">
                            <caption className="sr-only">Sitemap URLs</caption>
                            <thead>
                              <tr>
                                <th scope="col">Sitemap URL</th>
                                <th scope="col">Live status</th>
                                <th scope="col">Lastmod</th>
                              </tr>
                            </thead>
                            <tbody>
                              {siteAudit.sitemapUrls.map((u) => (
                                <tr key={u.loc}>
                                  <th scope="row">
                                    <span className="dashboard-code-pill">{u.loc}</span>
                                  </th>
                                  <td data-label="Live status">
                                    <span
                                      className={`dashboard-status-pill ${
                                        u.ok && u.tlsValid ? 'is-good' : 'is-poor'
                                      }`}
                                    >
                                      {u.statusCode ? `HTTP ${u.statusCode}` : 'TLS/Fetch fout'}
                                    </span>
                                    {u.error && (
                                      <div className="dashboard-subtext">{u.error}</div>
                                    )}
                                  </td>
                                  <td data-label="Lastmod">
                                    {u.lastmod || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="dashboard-empty">
                      {siteAuditBusy ? t.refreshing : t.noData}
                    </p>
                  )}
                </section>

                <section
                  className="dashboard-panel"
                  aria-labelledby={`dns-heading-${uid}`}
                >
                  <h2 id={`dns-heading-${uid}`}>{t.dnsRdapHeading}</h2>
                  {discoveryAudit?.ok ? (
                    <>
                      <div className="dashboard-badge-row">
                        {discoveryAudit.rdap?.ok ? (
                          <>
                            <span className="dashboard-status-pill is-good">
                              SIDN RDAP: {discoveryAudit.rdap.status?.join(', ') || 'active'}
                            </span>
                            <span
                              className={`dashboard-status-pill ${
                                discoveryAudit.rdap.dnssecSigned ? 'is-good' : 'is-warn'
                              }`}
                            >
                              DNSSEC:{' '}
                              {discoveryAudit.rdap.dnssecSigned ? 'Signed' : 'Unsigned'}
                            </span>
                            <span className="dashboard-badge">
                              Geregistreerd:{' '}
                              {formatShortDate(discoveryAudit.rdap.registeredAt || '')}
                            </span>
                          </>
                        ) : discoveryAudit.rdap ? (
                          <span className="dashboard-status-pill is-warn">
                            SIDN RDAP: {discoveryAudit.rdap.error || 'Geen respons'}
                          </span>
                        ) : null}
                        {discoveryAudit.wayback?.ok && (
                          <span
                            className={`dashboard-status-pill ${
                              discoveryAudit.wayback.available ? 'is-good' : 'is-warn'
                            }`}
                          >
                            Wayback Machine:{' '}
                            {discoveryAudit.wayback.available
                              ? `Snapshot ${formatWaybackTimestamp(
                                  discoveryAudit.wayback.timestamp
                                )}`
                              : 'Nog geen snapshot'}
                          </span>
                        )}
                      </div>

                      {discoveryAudit.rdap?.nameservers &&
                        discoveryAudit.rdap.nameservers.length > 0 && (
                          <p className="dashboard-subtext">
                            Nameservers: {discoveryAudit.rdap.nameservers.join(', ')}
                          </p>
                        )}

                      <div
                        tabIndex={0}
                        role="region"
                        aria-labelledby={`dns-heading-${uid}`}
                        className="dashboard-table-wrap"
                      >
                        <table className="dashboard-table dashboard-responsive-table">
                          <caption className="sr-only">DNS records</caption>
                          <thead>
                            <tr>
                              <th scope="col">Host</th>
                              <th scope="col">A / AAAA</th>
                              <th scope="col">CNAME / TXT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discoveryAudit.dnsHosts.map((host) => (
                              <tr key={host.host}>
                                <th scope="row">
                                  <span className="dashboard-code-pill">{host.host}</span>
                                </th>
                                <td data-label="A / AAAA">
                                  {[...host.a, ...host.aaaa].join(', ') || '—'}
                                </td>
                                <td data-label="CNAME / TXT">
                                  {host.cname.length > 0
                                    ? `CNAME: ${host.cname.join(', ')}`
                                    : host.txt.length > 0
                                      ? `${host.txt.length} TXT record(s)`
                                      : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="dashboard-empty">
                      {discoveryBusy ? t.refreshing : discoveryAudit?.error || t.noData}
                    </p>
                  )}
                </section>
              </div>
            </div>
          </div>

          {/* TAB 3: PAGESPEED & CRUX */}
          <div
            role="tabpanel"
            id={`panel-pagespeed-${uid}`}
            aria-labelledby={`tab-pagespeed-${uid}`}
            hidden={activeTab !== 'pagespeed'}
          >
            <div className="dashboard-tabpanel-inner">
              <section
                className="dashboard-panel"
                aria-labelledby={`psi-heading-${uid}`}
              >
                <div className="dashboard-panel-head">
                  <div>
                    <h2 id={`psi-heading-${uid}`}>{t.pageSpeedHeading}</h2>
                    <p className="dashboard-panel-sub">
                      Live Google Lighthouse SEO/Performance scores en echte Chrome UX Report (CrUX) velddata.
                    </p>
                  </div>
                </div>

                <div className="dashboard-psi-controls">
                  <div className="automate-field">
                    <label htmlFor={`psi-url-${uid}`}>Doel-URL</label>
                    <select
                      id={`psi-url-${uid}`}
                      name="psiUrl"
                      className="automate-select"
                      value={psiTargetUrl}
                      onChange={(e) =>
                        setPsiTargetUrl(e.target.value as PageSpeedTargetUrl)
                      }
                    >
                      <option value="https://greyson.nl/">https://greyson.nl/</option>
                      <option value="https://www.greyson.nl/">https://www.greyson.nl/</option>
                      <option value="https://greyson.nl/over-mij">https://greyson.nl/over-mij</option>
                    </select>
                  </div>

                  <div className="automate-field">
                    <label htmlFor={`psi-strategy-${uid}`}>Apparaat</label>
                    <select
                      id={`psi-strategy-${uid}`}
                      name="psiStrategy"
                      className="automate-select"
                      value={psiStrategy}
                      onChange={(e) =>
                        setPsiStrategy(e.target.value as PageSpeedStrategy)
                      }
                    >
                      <option value="mobile">Mobile (Googlebot Smartphone)</option>
                      <option value="desktop">Desktop</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="automate-btn-primary"
                    disabled={pageSpeedBusy}
                    onClick={() => void runPageSpeedProbe()}
                  >
                    {pageSpeedBusy ? t.pageSpeedRunning : t.pageSpeedRun}
                  </button>
                </div>

                {pageSpeedResult && !pageSpeedResult.ok && (
                  <div className="automate-form-error" role="alert">
                    <div>{pageSpeedResult.error}</div>
                    {pageSpeedResult.status === 429 && (
                      <div style={{ marginTop: '8px', fontWeight: 500 }}>
                        Tip: Google PageSpeed geeft zonder eigen API-key snel HTTP 429 op gedeelde IP’s. Voeg hieronder (of in <code>.env</code> als <code>GOOGLE_PAGESPEED_API_KEY</code>) een gratis Google PageSpeed Insights API-key toe.
                        <div style={{ marginTop: '8px' }}>
                          <button
                            type="button"
                            className="automate-btn-secondary"
                            onClick={() => setSettingsOpen(true)}
                          >
                            Google API-key invullen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {pageSpeedResult?.ok && pageSpeedResult.scores && (
                  <>
                    <div className="dashboard-psi-scores">
                      <article className="dashboard-kpi-card">
                        <span className="dashboard-kpi-label">SEO</span>
                        <span
                          className={`dashboard-kpi-value ${scoreToneClass(
                            pageSpeedResult.scores.seo
                          )}`}
                        >
                          {pageSpeedResult.scores.seo ?? '—'}
                        </span>
                        <span className="dashboard-kpi-sub">Lighthouse SEO / 100</span>
                      </article>
                      <article className="dashboard-kpi-card">
                        <span className="dashboard-kpi-label">Performance</span>
                        <span
                          className={`dashboard-kpi-value ${scoreToneClass(
                            pageSpeedResult.scores.performance
                          )}`}
                        >
                          {pageSpeedResult.scores.performance ?? '—'}
                        </span>
                        <span className="dashboard-kpi-sub">Lighthouse Perf / 100</span>
                      </article>
                      <article className="dashboard-kpi-card">
                        <span className="dashboard-kpi-label">Accessibility</span>
                        <span
                          className={`dashboard-kpi-value ${scoreToneClass(
                            pageSpeedResult.scores.accessibility
                          )}`}
                        >
                          {pageSpeedResult.scores.accessibility ?? '—'}
                        </span>
                        <span className="dashboard-kpi-sub">WCAG &amp; A11y / 100</span>
                      </article>
                      <article className="dashboard-kpi-card">
                        <span className="dashboard-kpi-label">Best Practices</span>
                        <span
                          className={`dashboard-kpi-value ${scoreToneClass(
                            pageSpeedResult.scores.bestPractices
                          )}`}
                        >
                          {pageSpeedResult.scores.bestPractices ?? '—'}
                        </span>
                        <span className="dashboard-kpi-sub">Security &amp; Web / 100</span>
                      </article>
                    </div>

                    <div className="dashboard-grid-2">
                      <section className="dashboard-panel">
                        <h3>Lighthouse Lab Web Vitals ({pageSpeedResult.strategy})</h3>
                        <div className="dashboard-mini-metrics">
                          <div className="dashboard-metric-chip">
                            <span>FCP</span>
                            <strong>{formatVitalMs(pageSpeedResult.labMetrics?.fcpMs)}</strong>
                          </div>
                          <div className="dashboard-metric-chip">
                            <span>LCP</span>
                            <strong>{formatVitalMs(pageSpeedResult.labMetrics?.lcpMs)}</strong>
                          </div>
                          <div className="dashboard-metric-chip">
                            <span>TBT</span>
                            <strong>{formatVitalMs(pageSpeedResult.labMetrics?.tbtMs)}</strong>
                          </div>
                          <div className="dashboard-metric-chip">
                            <span>CLS</span>
                            <strong>{formatCls(pageSpeedResult.labMetrics?.cls)}</strong>
                          </div>
                        </div>

                        <h3>Chrome UX Report (CrUX echte gebruikers)</h3>
                        {pageSpeedResult.fieldData?.origin || pageSpeedResult.fieldData?.page ? (
                          <div className="dashboard-mini-metrics">
                            {(() => {
                              const crux =
                                pageSpeedResult.fieldData?.page ||
                                pageSpeedResult.fieldData?.origin;
                              return (
                                <>
                                  <div className="dashboard-metric-chip">
                                    <span>CrUX Status</span>
                                    <strong>{crux?.overallCategory || '—'}</strong>
                                  </div>
                                  <div className="dashboard-metric-chip">
                                    <span>LCP (CrUX)</span>
                                    <strong>{formatVitalMs(crux?.lcpMs)}</strong>
                                  </div>
                                  <div className="dashboard-metric-chip">
                                    <span>INP (CrUX)</span>
                                    <strong>{formatVitalMs(crux?.inpMs)}</strong>
                                  </div>
                                  <div className="dashboard-metric-chip">
                                    <span>CLS (CrUX)</span>
                                    <strong>{formatCls(crux?.cls)}</strong>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <p className="dashboard-empty">
                            Google CrUX heeft nog onvoldoende Chrome-verkeer gemeten voor een publiek veldrapport op dit domein.
                          </p>
                        )}
                      </section>

                      <section className="dashboard-panel">
                        <h3>Lighthouse SEO-audits</h3>
                        {pageSpeedResult.seoAudits &&
                        pageSpeedResult.seoAudits.length > 0 ? (
                          <div
                            tabIndex={0}
                            role="region"
                            aria-label="Lighthouse SEO audits"
                            className="dashboard-table-wrap"
                          >
                            <table className="dashboard-table dashboard-responsive-table">
                              <caption className="sr-only">Lighthouse SEO audits</caption>
                              <thead>
                                <tr>
                                  <th scope="col">Check</th>
                                  <th scope="col">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pageSpeedResult.seoAudits.map((audit) => (
                                  <tr key={audit.id}>
                                    <th scope="row">
                                      {audit.title}
                                      {audit.displayValue && (
                                        <div className="dashboard-subtext">
                                          {audit.displayValue}
                                        </div>
                                      )}
                                    </th>
                                    <td data-label="Status">
                                      <span
                                        className={`dashboard-status-pill ${
                                          audit.score === 1
                                            ? 'is-good'
                                            : audit.score === null
                                              ? ''
                                              : 'is-poor'
                                        }`}
                                      >
                                        {audit.score === 1
                                          ? 'Pass'
                                          : audit.score === null
                                            ? audit.scoreDisplayMode || 'Info'
                                            : 'Fail'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="dashboard-empty">{t.noData}</p>
                        )}
                      </section>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>

          {/* TAB 4: BEZOEKERS & LIVE EVENTS (POSTHOG) */}
          <div
            role="tabpanel"
            id={`panel-stream-${uid}`}
            aria-labelledby={`tab-stream-${uid}`}
            hidden={activeTab !== 'stream'}
          >
            <div className="dashboard-tabpanel-inner">
              {!phLive ? (
                <section className="dashboard-panel">
                  <h2>{t.connectHeading}</h2>
                  <p>{t.connectBody}</p>
                </section>
              ) : (
                <div className="dashboard-grid-2">
                  <section
                    className="dashboard-panel"
                    aria-labelledby={`dashboard-visitors-heading-${uid}`}
                  >
                    <h2 id={`dashboard-visitors-heading-${uid}`}>
                      {t.visitorsHeading}
                    </h2>
                    {phLive.visitors.length === 0 ? (
                      <p className="dashboard-empty">{t.noData}</p>
                    ) : (
                      <div
                        tabIndex={0}
                        role="region"
                        aria-labelledby={`dashboard-visitors-heading-${uid}`}
                        className="dashboard-table-wrap"
                      >
                        <table className="dashboard-table dashboard-responsive-table">
                          <caption className="sr-only">{t.visitorsHeading}</caption>
                          <thead>
                            <tr>
                              <th scope="col">Visitor / Replay</th>
                              <th scope="col">{lang === 'nl' ? 'Herkomst' : 'Source'}</th>
                              <th scope="col">{lang === 'nl' ? 'Locatie' : 'Location'}</th>
                              <th scope="col">Device / OS</th>
                              <th scope="col">Entry</th>
                              <th scope="col">Events</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phLive.visitors.map((visitor) => (
                              <tr key={visitor.distinctId}>
                                <th scope="row">
                                  <a
                                    href={`${posthogBaseProjectUrl}/person/${encodeURIComponent(
                                      visitor.distinctId
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="dashboard-code-pill"
                                  >
                                    {visitor.distinctId.slice(0, 14)}
                                  </a>
                                  {visitor.sessionId && (
                                    <div style={{ marginTop: '4px' }}>
                                      <a
                                        href={`${posthogBaseProjectUrl}/replay/${encodeURIComponent(
                                          visitor.sessionId
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="automate-inline-link"
                                        style={{ fontSize: '0.82rem' }}
                                      >
                                        Replay ↗
                                      </a>
                                    </div>
                                  )}
                                </th>
                                <td data-label={lang === 'nl' ? 'Herkomst' : 'Source'}>
                                  <div>{visitor.referringDomain}</div>
                                  <div className="dashboard-subtext">
                                    {t.channels[visitor.channel]}
                                  </div>
                                </td>
                                <td data-label={lang === 'nl' ? 'Locatie' : 'Location'}>
                                  {visitor.locationLabel}
                                  <div className="dashboard-subtext">
                                    {visitor.timezone}
                                  </div>
                                </td>
                                <td data-label="Device / OS">
                                  {visitor.deviceType} · {visitor.browser} · {visitor.os}
                                </td>
                                <td data-label="Entry">
                                  <span className="dashboard-code-pill">
                                    {visitor.subdomain}
                                    {visitor.entryPath}
                                  </span>
                                </td>
                                <td data-label="Events">
                                  {visitor.eventCount}
                                  <div className="dashboard-subtext">
                                    {formatEventTime(visitor.lastSeen)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section
                    className="dashboard-panel"
                    aria-labelledby={`dashboard-events-heading-${uid}`}
                  >
                    <h2 id={`dashboard-events-heading-${uid}`}>
                      {t.eventsHeading}
                    </h2>
                    {phLive.recentEvents.length === 0 ? (
                      <p className="dashboard-empty">{t.noData}</p>
                    ) : (
                      <div
                        tabIndex={0}
                        role="region"
                        aria-labelledby={`dashboard-events-heading-${uid}`}
                        className="dashboard-table-wrap"
                      >
                        <table className="dashboard-table dashboard-responsive-table">
                          <caption className="sr-only">{t.eventsHeading}</caption>
                          <thead>
                            <tr>
                              <th scope="col">Event</th>
                              <th scope="col">Route</th>
                              <th scope="col">Properties</th>
                              <th scope="col">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phLive.recentEvents.map((evt) => (
                              <tr key={evt.id}>
                                <th scope="row">
                                  <span className="dashboard-code-pill">
                                    {evt.event}
                                  </span>
                                </th>
                                <td data-label="Route">
                                  {evt.host}
                                  {evt.pathname}
                                </td>
                                <td data-label="Properties">
                                  {formatEventProperties(evt.properties)}
                                </td>
                                <td data-label="Time">
                                  {formatEventTime(evt.timestamp)}
                                  {evt.sessionId && (
                                    <div>
                                      <a
                                        href={`${posthogBaseProjectUrl}/replay/${encodeURIComponent(
                                          evt.sessionId
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="automate-inline-link"
                                        style={{ fontSize: '0.8rem' }}
                                      >
                                        Replay ↗
                                      </a>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
