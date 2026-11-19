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

type TimeWindowDays = 7 | 30 | 90;

const INPUT_BOUNDS = {
  email: 254,
  passphrase: 256,
  apiKey: 256,
  projectId: 32,
} as const;

const COPY = {
  nl: {
    brandLabel: 'GREYSON ANALYTICS',
    pageTitle: 'Website Overzicht — Bezoek & Vindbaarheid',
    homeLink: '← Terug naar site',
    aboutLink: 'Over mij',
    refreshAll: 'Vernieuwen',
    refreshing: 'Laden...',
    settingsBtn: 'Koppelingen (.env)',
    signOut: 'Uitloggen',
    periodLabel: 'Periode',
    daysUnit: 'd',
    excludeLocalLabel: 'Alleen echte bezoekers (filter localhost)',
    posthogConnected: (region: string, days: number) =>
      `PostHog Live (${region.toUpperCase()} · ${days}d)`,
    posthogMissing: 'PostHog: vul sleutel in .env in',
    siteCheckBadge: (okCount: number, total: number) =>
      `Vindbaarheid: ${okCount}/${total} URL’s OK`,
    psiBadgeOk: (seo: number | null, perf: number | null) =>
      `PageSpeed: ${seo ?? '—'} SEO · ${perf ?? '—'} Perf`,
    psiBadgePending: 'PageSpeed: wachtend / quota',
    connectBannerPrefix:
      'PostHog bezoekcijfers zijn nog niet gekoppeld. Vul',
    connectBannerSuffix:
      'in .env in (Project ID wordt automatisch herkend) en klik op Vernieuwen, of',
    connectBannerBtn: 'Sleutel tijdelijk invoeren',
    kpiVisitors: 'Unieke bezoekers',
    kpiLeads: 'Leads & Contactacties',
    kpiSearchAi: 'Gevonden via Zoek / AI',
    kpiReachable: 'Live Bereikbaarheid',
    kpiPageSpeed: 'Google SEO & Snelheid',
    sectionTrafficTitle: '1. Hoe presteert de website qua bezoek?',
    sectionTrafficSub: 'Rechtstreekse cijfers uit PostHog Cloud voor de gekozen periode.',
    sectionFindabilityTitle: '2. Kunnen mensen de website vinden?',
    sectionFindabilitySub:
      'Herkomst van bezoekers (PostHog) gecombineerd met live HTTP-, TLS-, SEO- en DNS-controles.',
    trendTitle: 'Bezoekers & paginaweergaves per dag',
    topPagesTitle: 'Populairste pagina’s',
    vitalsTitle: 'Snelheid echte bezoekers ($web_vitals)',
    vitalsEmpty:
      'Nog geen $web_vitals events in PostHog binnen deze periode.',
    behaviorTitle: 'Interacties, apparaten & taal',
    channelsTitle: 'Waar komen bezoekers vandaan?',
    referrersTitle: 'Top bronnen & landingspagina’s',
    liveUrlsTitle: 'Live controle per URL (greyson.nl)',
    crawlersTitle: 'Zoekmachines, AI-bots & Domein',
    visitorsHeading: 'Recente bezoekers (PostHog)',
    eventsHeading: 'Recente acties (Live stream)',
    noPosthogData: 'Koppel PostHog om actuele bezoekersdata te zien.',
    noMeasurements: 'Nog geen metingen in deze periode.',
    channels: {
      organic_search: 'Google / Bing / Zoekmachines',
      ai_search: 'AI-zoekmachines (ChatGPT / Perplexity)',
      social: 'Social media (LinkedIn / X)',
      referral: 'Verwijzende websites',
      direct: 'Direct / ingetypt',
    } as Record<AcquisitionChannelKey, string>,
  },
  en: {
    brandLabel: 'GREYSON ANALYTICS',
    pageTitle: 'Website Overview — Traffic & Findability',
    homeLink: '← Back to site',
    aboutLink: 'About me',
    refreshAll: 'Refresh',
    refreshing: 'Loading...',
    settingsBtn: 'Connections (.env)',
    signOut: 'Sign Out',
    periodLabel: 'Range',
    daysUnit: 'd',
    excludeLocalLabel: 'Production visitors only (exclude localhost)',
    posthogConnected: (region: string, days: number) =>
      `PostHog Live (${region.toUpperCase()} · ${days}d)`,
    posthogMissing: 'PostHog: add key to .env',
    siteCheckBadge: (okCount: number, total: number) =>
      `Findability: ${okCount}/${total} URLs OK`,
    psiBadgeOk: (seo: number | null, perf: number | null) =>
      `PageSpeed: ${seo ?? '—'} SEO · ${perf ?? '—'} Perf`,
    psiBadgePending: 'PageSpeed: pending / quota',
    connectBannerPrefix: 'PostHog visitor metrics are not connected yet. Add',
    connectBannerSuffix:
      'to .env (Project ID auto-resolves) and click Refresh, or',
    connectBannerBtn: 'Enter session key',
    kpiVisitors: 'Unique Visitors',
    kpiLeads: 'Leads & Contact Clicks',
    kpiSearchAi: 'Found via Search / AI',
    kpiReachable: 'Live Reachability',
    kpiPageSpeed: 'Google SEO & Speed',
    sectionTrafficTitle: '1. How does the website perform on visits?',
    sectionTrafficSub: 'Live measurements directly from PostHog Cloud.',
    sectionFindabilityTitle: '2. Can people find the website?',
    sectionFindabilitySub:
      'Visitor acquisition sources (PostHog) combined with live HTTP, TLS, SEO, and DNS audits.',
    trendTitle: 'Daily visitors & pageviews',
    topPagesTitle: 'Top pages',
    vitalsTitle: 'Real-user Web Vitals ($web_vitals)',
    vitalsEmpty: 'No $web_vitals events recorded in PostHog in this window yet.',
    behaviorTitle: 'Interactions, devices & language',
    channelsTitle: 'Where do visitors come from?',
    referrersTitle: 'Top sources & landing pages',
    liveUrlsTitle: 'Live check per URL (greyson.nl)',
    crawlersTitle: 'Search engines, AI bots & Domain',
    visitorsHeading: 'Who Is Visiting',
    eventsHeading: 'What They Do (Live Stream)',
    noPosthogData: 'Connect PostHog to view live visitor metrics.',
    noMeasurements: 'No recorded measurements in this window.',
    channels: {
      organic_search: 'Organic Search (Google / Bing)',
      ai_search: 'AI Search (ChatGPT / Perplexity)',
      social: 'Social Media (LinkedIn / X)',
      referral: 'Referral Links',
      direct: 'Direct / Typed',
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
  metric: 'LCP' | 'FCP' | 'INP' | 'CLS',
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
    if (entries.length >= 3) break;
  }

  if (entries.length < 3) {
    for (const [key, val] of Object.entries(props)) {
      if (seen.has(key) || val === '') continue;
      entries.push(`${key}=${String(val)}`);
      if (entries.length >= 3) break;
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

  // Owner login state (non-local only)
  const [ownerEmail, setOwnerEmail] = useState<string>(OWNER_EMAIL);
  const [passphrase, setPassphrase] = useState<string>('');
  const [lockedUntil, setLockedUntil] = useState<number | null>(
    initialAuth.lockedUntil
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [authError, setAuthError] = useState<string>('');
  const [authBusy, setAuthBusy] = useState<boolean>(false);

  // PostHog Cloud & Google PageSpeed credentials state
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
    posthogKeyPresent: false,
    posthogProjectId: '',
    posthogRegion: 'eu',
    hasPageSpeedKey: false,
  });

  // Query filter state
  const [daysWindow, setDaysWindow] = useState<TimeWindowDays>(30);
  const [excludeLocal, setExcludeLocal] = useState<boolean>(true);

  // Live PostHog state
  const [liveAnalytics, setLiveAnalytics] =
    useState<PostHogAnalyticsResult | null>(null);
  const [posthogBusy, setPosthogBusy] = useState<boolean>(false);
  const [posthogError, setPosthogError] = useState<string>('');
  const [settingsFeedback, setSettingsFeedback] = useState<string>('');

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

  const settingsDialogRef = useRef<HTMLDialogElement | null>(null);
  const pointerDownOutsideDialog = useRef(false);
  const initialBootRan = useRef(false);
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

  const openSettingsDialog = () => {
    setSettingsFeedback('');
    const dialog = settingsDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  const closeSettingsDialog = () => {
    const dialog = settingsDialogRef.current;
    if (dialog && dialog.open) {
      dialog.close('');
    }
  };

  useEffect(() => {
    const dialog = settingsDialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      dialog.returnValue = '';
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [unlocked]);

  const runPostHogFetch = useCallback(
    async (opts?: {
      region?: PostHogRegion;
      projectApiKey?: string;
      personalApiKey?: string;
      projectId?: string;
      days?: TimeWindowDays;
      excludeLocal?: boolean;
      useServerEnv?: boolean;
      freshStatus?: DashboardEnvStatus;
    }) => {
      const status = opts?.freshStatus ?? envStatus;
      const useServer = Boolean(opts?.useServerEnv ?? status.posthogEnvConfigured);
      const targetRegion =
        opts?.region ?? (useServer && !projectId ? status.posthogRegion : region);
      const targetProjectId =
        opts?.projectId ?? (projectId || status.posthogProjectId);
      const targetPersonalKey = opts?.personalApiKey ?? personalApiKey;
      const targetDays = opts?.days ?? daysWindow;
      const targetExcludeLocal = opts?.excludeLocal ?? excludeLocal;

      const hasSessionKey = Boolean(
        targetPersonalKey && targetPersonalKey.startsWith('phx_')
      );
      const canUseServer = useServer && Boolean(targetProjectId);

      if (!hasSessionKey && !canUseServer) {
        setLiveAnalytics(null);
        return false;
      }

      const nextCfg = savePostHogConfig({
        region: targetRegion,
        projectApiKey: opts?.projectApiKey ?? projectApiKey,
        personalApiKey: targetPersonalKey,
        projectId: targetProjectId,
      });

      setPosthogBusy(true);
      setPosthogError('');

      const result = await fetchPostHogAnalytics({
        ...nextCfg,
        days: targetDays,
        excludeLocal: targetExcludeLocal,
        useServerEnv: canUseServer && !hasSessionKey,
      });

      setPosthogBusy(false);

      if (result.ok) {
        setLiveAnalytics(result);
        if (!projectId && result.projectId) {
          setProjectId(result.projectId);
        }
        return true;
      }
      setPosthogError(
        result.error || 'Unable to fetch live PostHog analytics.'
      );
      return false;
    },
    [
      envStatus,
      region,
      projectId,
      personalApiKey,
      projectApiKey,
      daysWindow,
      excludeLocal,
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

  // Boot all live data sources immediately in parallel on dashboard load
  useEffect(() => {
    if (!unlocked || initialBootRan.current) return;
    initialBootRan.current = true;

    const boot = async () => {
      const status = await fetchDashboardEnvStatus();
      setEnvStatus(status);

      const resolvedProjectId = projectId || status.posthogProjectId;
      const resolvedRegion = projectId ? region : status.posthogRegion || region;
      if (!projectId && status.posthogProjectId) {
        setProjectId(status.posthogProjectId);
        setRegion(status.posthogRegion);
      }

      const hasSessionKey = Boolean(
        personalApiKey && personalApiKey.startsWith('phx_')
      );
      if (hasSessionKey) {
        void runPostHogFetch({
          region: resolvedRegion,
          projectId: resolvedProjectId,
          personalApiKey,
          useServerEnv: false,
          freshStatus: status,
        });
      } else if (status.posthogEnvConfigured) {
        void runPostHogFetch({
          region: status.posthogRegion,
          projectId: resolvedProjectId,
          useServerEnv: true,
          freshStatus: status,
        });
      }

      void runExternalProbes();
      void runPageSpeedProbe(psiTargetUrl, psiStrategy);
    };

    void boot();
  }, [
    unlocked,
    projectId,
    region,
    personalApiKey,
    psiTargetUrl,
    psiStrategy,
    runPostHogFetch,
    runExternalProbes,
    runPageSpeedProbe,
  ]);

  const handleRefreshAll = async () => {
    const status = await fetchDashboardEnvStatus();
    setEnvStatus(status);
    if (!projectId && status.posthogProjectId) {
      setProjectId(status.posthogProjectId);
      setRegion(status.posthogRegion);
    }

    await Promise.all([
      runPostHogFetch({ freshStatus: status }),
      runExternalProbes(),
      runPageSpeedProbe(psiTargetUrl, psiStrategy),
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
      setProjectId(result.projectId);
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
    setSettingsFeedback('');
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

    const status = await fetchDashboardEnvStatus();
    setEnvStatus(status);
    const ok = await runPostHogFetch({
      region: saved.region,
      projectApiKey: saved.projectApiKey,
      personalApiKey: saved.personalApiKey,
      projectId: saved.projectId || status.posthogProjectId,
      freshStatus: status,
    });

    if (savedPsi || status.hasPageSpeedKey) {
      void runPageSpeedProbe(psiTargetUrl, psiStrategy, savedPsi);
    }

    if (ok) {
      closeSettingsDialog();
    } else {
      setSettingsFeedback(
        lang === 'nl'
          ? 'Instellingen opgeslagen in deze tab-sessie.'
          : 'Settings saved for this tab session.'
      );
    }
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
    setSettingsFeedback(
      lang === 'nl'
        ? 'Sessiegebonden sleutels gewist uit sessionStorage.'
        : 'Session keys cleared from sessionStorage.'
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
                    <label htmlFor="dash-login-project-id">
                      Project ID (optional)
                    </label>
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
                      placeholder="Auto-detected from phx_"
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

  const maxTopPageViews = phLive
    ? Math.max(1, ...phLive.topPages.map((p) => p.pageviews))
    : 1;

  const allowedBotsCount =
    siteAudit?.ok && siteAudit.robots
      ? siteAudit.robots.botAccess.filter((b) => b.allowed).length
      : 0;
  const totalBotsCount =
    siteAudit?.ok && siteAudit.robots ? siteAudit.robots.botAccess.length : 0;

  return (
    <div className="dashboard-root">
      <div className="dashboard-container">
        {/* Compact Header + Global Filter Controls */}
        <header className="dashboard-header dashboard-header--compact">
          <div className="dashboard-header-top">
            <div className="dashboard-brand-block">
              <span className="automate-brand">
                <BrandLogo label={t.brandLabel} />
              </span>
              <h1 className="dashboard-page-title">{t.pageTitle}</h1>
              <div className="dashboard-badge-row">
                <span
                  className={`dashboard-badge ${
                    phLive ? 'dashboard-badge-live' : 'dashboard-badge-warn'
                  }`}
                >
                  {phLive
                    ? t.posthogConnected(phLive.region, phLive.days)
                    : t.posthogMissing}
                </span>
                {siteAudit?.ok && (
                  <span
                    className={`dashboard-badge ${
                      siteIndexableCount === siteTotalCount
                        ? 'dashboard-badge-live'
                        : 'dashboard-badge-warn'
                    }`}
                  >
                    {t.siteCheckBadge(siteIndexableCount, siteTotalCount)}
                  </span>
                )}
                <span
                  className={`dashboard-badge ${
                    pageSpeedResult?.ok ? 'dashboard-badge-live' : ''
                  }`}
                >
                  {pageSpeedResult?.ok && pageSpeedResult.scores
                    ? t.psiBadgeOk(
                        pageSpeedResult.scores.seo,
                        pageSpeedResult.scores.performance
                      )
                    : t.psiBadgePending}
                </span>
                {!isLocalOnly && (
                  <span className="dashboard-badge">
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
                className="automate-btn-secondary"
                onClick={openSettingsDialog}
              >
                {t.settingsBtn}
              </button>

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
          </div>

          <div className="dashboard-subbar">
            <div
              className="dashboard-period-group"
              role="group"
              aria-label={t.periodLabel}
            >
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
                  {d}
                  {t.daysUnit}
                </button>
              ))}
            </div>

            <label
              className="dashboard-checkbox-label"
              htmlFor={`excl-local-${uid}`}
            >
              <input
                id={`excl-local-${uid}`}
                type="checkbox"
                checked={excludeLocal}
                onChange={(e) => handleExcludeLocalToggle(e.target.checked)}
              />
              <span>{t.excludeLocalLabel}</span>
            </label>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="dashboard-main-stack">
          {/* Compact 1-Line PostHog Connection Strip (never pushes dashboard off-screen) */}
          {!phLive && (
            <div className="dashboard-compact-notice" role="status">
              <span>
                {t.connectBannerPrefix}{' '}
                <code>POSTHOG_PERSONAL_API_KEY</code> {t.connectBannerSuffix}{' '}
                <button
                  type="button"
                  className="dashboard-inline-action"
                  onClick={openSettingsDialog}
                >
                  {t.connectBannerBtn}
                </button>
                .
              </span>
              {posthogError && (
                <span className="dashboard-inline-err">{posthogError}</span>
              )}
            </div>
          )}
          {phLive && posthogError && (
            <div className="automate-form-error" role="alert">
              {posthogError}
            </div>
          )}

          {/* BAND 1: 5 Hoofdcijfers in 1 oogopslag */}
          <section
            className="dashboard-kpi-grid dashboard-kpi-grid--5"
            aria-label="Website overview KPIs"
          >
            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">{t.kpiVisitors}</span>
              <span className="dashboard-kpi-value">
                {phLive ? phLive.summary.totalUniqueVisitors : '—'}
              </span>
              <span className="dashboard-kpi-sub">
                {phLive
                  ? `${phLive.summary.totalPageviews} views · ${formatDuration(
                      phLive.summary.avgSessionDurationSec
                    )} gem.`
                  : 'Wacht op PostHog (.env)'}
              </span>
            </article>

            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">{t.kpiLeads}</span>
              <span className="dashboard-kpi-value">
                {phLive ? phLive.summary.inquiryClicks : '—'}
              </span>
              <span className="dashboard-kpi-sub">
                {phLive
                  ? `${phLive.summary.formSubmits} formulier · ${phLive.summary.conversionRatePct}% conv.`
                  : 'Wacht op PostHog (.env)'}
              </span>
            </article>

            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">{t.kpiSearchAi}</span>
              <span className="dashboard-kpi-value">
                {phLive ? `${phLive.summary.searchAndAiSharePct}%` : '—'}
              </span>
              <span className="dashboard-kpi-sub">
                {phLive
                  ? `${phLive.summary.searchAndAiVisitors} bezoekers via Google / AI`
                  : 'Wacht op PostHog (.env)'}
              </span>
            </article>

            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">{t.kpiReachable}</span>
              <span
                className={`dashboard-kpi-value ${
                  siteAudit?.ok
                    ? siteIndexableCount === siteTotalCount
                      ? 'is-good'
                      : 'is-poor'
                    : ''
                }`}
              >
                {siteAudit?.ok
                  ? `${siteIndexableCount}/${siteTotalCount}`
                  : siteAuditBusy
                    ? '...'
                    : '—'}
              </span>
              <span className="dashboard-kpi-sub">
                {siteAudit?.ok
                  ? siteBlockers.length > 0
                    ? `${siteBlockers.length} blokkade(s) gevonden`
                    : 'Alle gecontroleerde URL’s OK'
                  : 'Live crawl wordt uitgevoerd...'}
              </span>
            </article>

            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">{t.kpiPageSpeed}</span>
              {pageSpeedResult?.ok && pageSpeedResult.scores ? (
                <>
                  <span
                    className={`dashboard-kpi-value ${scoreToneClass(
                      pageSpeedResult.scores.seo
                    )}`}
                  >
                    {pageSpeedResult.scores.seo ?? '—'}
                    <span className="dashboard-kpi-slash"> / 100</span>
                  </span>
                  <span className="dashboard-kpi-sub">
                    SEO {pageSpeedResult.scores.seo ?? '—'} · Perf{' '}
                    {pageSpeedResult.scores.performance ?? '—'} (
                    {pageSpeedResult.strategy})
                  </span>
                </>
              ) : (
                <>
                  <span className="dashboard-kpi-value is-warn">
                    {pageSpeedBusy ? '...' : pageSpeedResult?.status === 429 ? '429' : '—'}
                  </span>
                  <span className="dashboard-kpi-sub">
                    {pageSpeedBusy
                      ? 'Lighthouse analyseert...'
                      : pageSpeedResult?.status === 429
                        ? 'Google API-key in .env nodig'
                        : pageSpeedResult?.error || 'Klik op meten'}
                  </span>
                </>
              )}
            </article>
          </section>

          {/* BAND 2: Twee kolommen naast elkaar — Links Bezoek, Rechts Vindbaarheid */}
          <div className="dashboard-grid-2 dashboard-main-columns">
            {/* LINKER KOLOM: BEZOEK & PRESTATIES */}
            <section
              className="dashboard-panel dashboard-column-panel"
              aria-labelledby={`traffic-col-heading-${uid}`}
            >
              <div className="dashboard-section-head">
                <h2 id={`traffic-col-heading-${uid}`}>
                  {t.sectionTrafficTitle}
                </h2>
                <p className="dashboard-panel-sub">{t.sectionTrafficSub}</p>
              </div>

              {!phLive ? (
                <div className="dashboard-empty">
                  {t.noPosthogData}{' '}
                  <button
                    type="button"
                    className="dashboard-inline-action"
                    onClick={openSettingsDialog}
                  >
                    {t.connectBannerBtn}
                  </button>
                </div>
              ) : (
                <>
                  {/* Dagelijkse grafiek */}
                  <div className="dashboard-subblock">
                    <div className="dashboard-panel-head">
                      <h3>{t.trendTitle}</h3>
                      <span className="dashboard-legend">
                        <span className="dashboard-legend-item">
                          <span className="dashboard-dot is-pv" aria-hidden="true" />
                          Views
                        </span>
                        <span className="dashboard-legend-item">
                          <span className="dashboard-dot is-vis" aria-hidden="true" />
                          {lang === 'nl' ? 'Bezoekers' : 'Visitors'}
                        </span>
                      </span>
                    </div>

                    {phLive.dailyTrend.length === 0 ? (
                      <p className="dashboard-empty">{t.noMeasurements}</p>
                    ) : (
                      <>
                        <div className="dashboard-chart-wrap">
                          <svg
                            className="dashboard-bar-svg"
                            viewBox={`0 0 ${Math.max(400, phLive.dailyTrend.length * 26)} 136`}
                            role="img"
                            aria-label={`${t.trendTitle}: ${phLive.dailyTrend
                              .map(
                                (d) =>
                                  `${d.day}: ${d.visitors} visitors, ${d.pageviews} pageviews`
                              )
                              .join('; ')}`}
                          >
                            {phLive.dailyTrend.map((point, i) => {
                              const svgW = Math.max(400, phLive.dailyTrend.length * 26);
                              const slotW = Math.max(
                                16,
                                Math.floor(svgW / phLive.dailyTrend.length)
                              );
                              const x = i * slotW + 3;
                              const pvH = Math.max(
                                point.pageviews > 0 ? 4 : 0,
                                Math.round((point.pageviews / maxDailyValue) * 96)
                              );
                              const visH = Math.max(
                                point.visitors > 0 ? 4 : 0,
                                Math.round((point.visitors / maxDailyValue) * 96)
                              );
                              const barW = Math.max(4, Math.floor((slotW - 8) / 2));
                              return (
                                <g key={point.day}>
                                  <rect
                                    x={x}
                                    y={108 - pvH}
                                    width={barW}
                                    height={pvH}
                                    rx="2"
                                    fill="rgba(217, 79, 72, 0.35)"
                                  >
                                    <title>{`${point.day}: ${point.pageviews} pageviews`}</title>
                                  </rect>
                                  <rect
                                    x={x + barW + 2}
                                    y={108 - visH}
                                    width={barW}
                                    height={visH}
                                    rx="2"
                                    fill="#d94f48"
                                  >
                                    <title>{`${point.day}: ${point.visitors} visitors`}</title>
                                  </rect>
                                  {(i === 0 ||
                                    i === phLive.dailyTrend.length - 1 ||
                                    i % Math.max(1, Math.ceil(phLive.dailyTrend.length / 5)) ===
                                      0) && (
                                    <text
                                      x={x + barW}
                                      y="128"
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
                              ? `Dagelijkse cijfers als tabel (${phLive.dailyTrend.length} dagen)`
                              : `Daily table (${phLive.dailyTrend.length} days)`}
                          </summary>
                          <div
                            tabIndex={0}
                            role="region"
                            aria-label={t.trendTitle}
                            className="dashboard-table-wrap"
                          >
                            <table className="dashboard-table dashboard-responsive-table">
                              <caption className="sr-only">{t.trendTitle}</caption>
                              <thead>
                                <tr>
                                  <th scope="col">Datum</th>
                                  <th scope="col">Bezoekers</th>
                                  <th scope="col">Views</th>
                                  <th scope="col">Conv.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {phLive.dailyTrend.map((d) => (
                                  <tr key={d.day}>
                                    <th scope="row">{d.day}</th>
                                    <td data-label="Bezoekers">{d.visitors}</td>
                                    <td data-label="Views">{d.pageviews}</td>
                                    <td data-label="Conv.">{d.conversions}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </>
                    )}
                  </div>

                  {/* Populairste pagina's (direct visueel) */}
                  <div className="dashboard-subblock">
                    <h3>{t.topPagesTitle}</h3>
                    {phLive.topPages.length === 0 ? (
                      <p className="dashboard-empty">{t.noMeasurements}</p>
                    ) : (
                      <div className="dashboard-bar-list">
                        {phLive.topPages.slice(0, 6).map((p) => {
                          const pct = Math.max(
                            6,
                            Math.round((p.pageviews / maxTopPageViews) * 100)
                          );
                          return (
                            <div
                              key={`${p.host}${p.pathname}`}
                              className="dashboard-channel-row"
                            >
                              <div className="dashboard-channel-meta">
                                <span className="dashboard-code-pill">
                                  {p.host}
                                  {p.pathname}
                                </span>
                                <span>
                                  <strong>{p.visitors}</strong>{' '}
                                  {lang === 'nl' ? 'bezoekers' : 'visitors'} ·{' '}
                                  {p.pageviews} views
                                </span>
                              </div>
                              <div className="dashboard-progress-track" aria-hidden="true">
                                <div
                                  className="dashboard-progress-fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Web Vitals + Apparaten & Taal + Top Interacties */}
                  <div className="dashboard-subblock">
                    <h3>{t.vitalsTitle}</h3>
                    {phLive.webVitals.sampleCount === 0 ? (
                      <p className="dashboard-panel-sub">{t.vitalsEmpty}</p>
                    ) : (
                      <div className="dashboard-mini-metrics">
                        <div
                          className={`dashboard-metric-chip is-${rateVitalStatus(
                            'LCP',
                            phLive.webVitals.lcpP75Ms
                          )}`}
                        >
                          <span>LCP (p75)</span>
                          <strong>{formatVitalMs(phLive.webVitals.lcpP75Ms)}</strong>
                        </div>
                        <div
                          className={`dashboard-metric-chip is-${rateVitalStatus(
                            'FCP',
                            phLive.webVitals.fcpP75Ms
                          )}`}
                        >
                          <span>FCP (p75)</span>
                          <strong>{formatVitalMs(phLive.webVitals.fcpP75Ms)}</strong>
                        </div>
                        <div
                          className={`dashboard-metric-chip is-${rateVitalStatus(
                            'INP',
                            phLive.webVitals.inpP75Ms
                          )}`}
                        >
                          <span>INP (p75)</span>
                          <strong>{formatVitalMs(phLive.webVitals.inpP75Ms)}</strong>
                        </div>
                        <div
                          className={`dashboard-metric-chip is-${rateVitalStatus(
                            'CLS',
                            phLive.webVitals.clsP75
                          )}`}
                        >
                          <span>CLS (p75)</span>
                          <strong>{formatCls(phLive.webVitals.clsP75)}</strong>
                        </div>
                      </div>
                    )}

                    <h3 style={{ marginTop: '8px' }}>{t.behaviorTitle}</h3>
                    <div className="dashboard-badge-row">
                      <span className="dashboard-badge">
                        Bounce: {phLive.summary.bounceRatePct}%
                      </span>
                      {phLive.devices.map((d) => (
                        <span key={d.deviceType} className="dashboard-badge">
                          {d.deviceType}: {d.sharePct}%
                        </span>
                      ))}
                      {phLive.languages.map((l) => (
                        <span key={l.lang} className="dashboard-badge">
                          {l.lang.toUpperCase()}: {l.visitors}
                        </span>
                      ))}
                      {phLive.locations.slice(0, 3).map((loc, idx) => (
                        <span key={`${loc.label}_${idx}`} className="dashboard-badge">
                          {loc.label}: {loc.visitors}
                        </span>
                      ))}
                    </div>

                    {phLive.topInteractions.length > 0 && (
                      <div className="dashboard-badge-row">
                        {phLive.topInteractions.slice(0, 6).map((item) => (
                          <span key={item.event} className="dashboard-status-pill">
                            {item.event}: {item.count}× ({item.visitors})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* RECHTER KOLOM: VINDBAARHEID & TECHNIEK */}
            <section
              className="dashboard-panel dashboard-column-panel"
              aria-labelledby={`findability-col-heading-${uid}`}
            >
              <div className="dashboard-section-head">
                <h2 id={`findability-col-heading-${uid}`}>
                  {t.sectionFindabilityTitle}
                </h2>
                <p className="dashboard-panel-sub">{t.sectionFindabilitySub}</p>
              </div>

              {/* A. Herkomstkanalen (PostHog) */}
              <div className="dashboard-subblock">
                <h3>{t.channelsTitle}</h3>
                {!phLive ? (
                  <p className="dashboard-panel-sub">{t.noPosthogData}</p>
                ) : (
                  <div className="dashboard-channel-list">
                    {phLive.channels.map((ch) => (
                      <div key={ch.channel} className="dashboard-channel-row">
                        <div className="dashboard-channel-meta">
                          <strong>{t.channels[ch.channel]}</strong>
                          <span>
                            {ch.visitors} ({ch.sharePct}%) · {ch.conversions} conv.
                          </span>
                        </div>
                        <div className="dashboard-progress-track" aria-hidden="true">
                          <div
                            className={`dashboard-progress-fill is-${ch.channel}`}
                            style={{
                              width: `${Math.max(ch.visitors > 0 ? 4 : 0, ch.sharePct)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {phLive && (phLive.referrers.length > 0 || phLive.landingPages.length > 0) && (
                  <details className="dashboard-details">
                    <summary>
                      {t.referrersTitle} ({phLive.referrers.length} bronnen ·{' '}
                      {phLive.landingPages.length} landingspagina’s)
                    </summary>
                    <div
                      tabIndex={0}
                      role="region"
                      aria-label={t.referrersTitle}
                      className="dashboard-table-wrap"
                    >
                      <table className="dashboard-table dashboard-responsive-table">
                        <caption className="sr-only">{t.referrersTitle}</caption>
                        <thead>
                          <tr>
                            <th scope="col">Bron / Entry</th>
                            <th scope="col">Bezoekers</th>
                            <th scope="col">Views</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phLive.referrers.slice(0, 8).map((r, i) => (
                            <tr key={`${r.referringDomain}_${r.utmSource}_${i}`}>
                              <th scope="row">
                                <span className="dashboard-code-pill">
                                  {r.referringDomain}
                                </span>
                                {r.utmSource ? ` (utm: ${r.utmSource})` : ''}
                              </th>
                              <td data-label="Bezoekers">{r.visitors}</td>
                              <td data-label="Views">{r.pageviews}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>

              {/* B. Live URL Indexeerbaarheid (In 1 oogopslag groen / rood) */}
              <div className="dashboard-subblock">
                <div className="dashboard-panel-head">
                  <h3>{t.liveUrlsTitle}</h3>
                  <button
                    type="button"
                    className="dashboard-mini-btn"
                    disabled={siteAuditBusy}
                    onClick={() => void runExternalProbes()}
                  >
                    {siteAuditBusy ? t.refreshing : 'Test live'}
                  </button>
                </div>

                {siteAudit && !siteAudit.ok && (
                  <div className="automate-form-error" role="alert">
                    {siteAudit.error}
                  </div>
                )}

                {siteAudit?.ok && (
                  <div className="dashboard-url-checklist">
                    {siteAudit.pages.map((page) => (
                      <div
                        key={page.id}
                        className={`dashboard-url-row ${
                          page.indexable ? 'is-ok' : 'is-blocked'
                        }`}
                      >
                        <div className="dashboard-url-main">
                          <span
                            className={`dashboard-status-dot ${
                              page.indexable ? 'is-good' : 'is-poor'
                            }`}
                            aria-hidden="true"
                          />
                          <code className="dashboard-url-text">{page.url}</code>
                        </div>
                        <div className="dashboard-url-status">
                          <span
                            className={`dashboard-status-pill ${
                              page.indexable ? 'is-good' : 'is-poor'
                            }`}
                          >
                            {page.statusCode
                              ? `HTTP ${page.statusCode}`
                              : 'TLS-fout'}
                            {page.ttfbMs !== null ? ` · ${page.ttfbMs}ms` : ''}
                          </span>
                          <span className="dashboard-url-note">
                            {page.indexable
                              ? 'Indexeerbaar'
                              : page.issue || 'Geblokkeerd'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* C. Zoekmachines, AI-bots, RDAP, DNS & PageSpeed samengevat */}
              <div className="dashboard-subblock">
                <h3>{t.crawlersTitle}</h3>
                <div className="dashboard-badge-row">
                  {siteAudit?.ok &&
                    siteAudit.files.map((f) => (
                      <span
                        key={f.id}
                        className={`dashboard-status-pill ${
                          f.ok ? 'is-good' : 'is-poor'
                        }`}
                      >
                        {f.name}: {f.statusCode ? `${f.statusCode}` : 'Fout'}
                      </span>
                    ))}
                  {siteAudit?.ok && siteAudit.robots && (
                    <span
                      className={`dashboard-status-pill ${
                        allowedBotsCount === totalBotsCount ? 'is-good' : 'is-warn'
                      }`}
                    >
                      Bots: {allowedBotsCount}/{totalBotsCount} toegestaan
                    </span>
                  )}
                  {discoveryAudit?.ok && discoveryAudit.rdap?.ok && (
                    <span className="dashboard-status-pill is-good">
                      SIDN: {discoveryAudit.rdap.status?.[0] || 'active'} ·{' '}
                      {discoveryAudit.rdap.dnssecSigned ? 'DNSSEC' : 'No DNSSEC'}
                    </span>
                  )}
                  {discoveryAudit?.ok && discoveryAudit.wayback?.ok && (
                    <span
                      className={`dashboard-status-pill ${
                        discoveryAudit.wayback.available ? 'is-good' : 'is-warn'
                      }`}
                    >
                      Wayback:{' '}
                      {discoveryAudit.wayback.available
                        ? formatWaybackTimestamp(discoveryAudit.wayback.timestamp)
                        : 'Geen'}
                    </span>
                  )}
                </div>

                {/* Inline compacte PageSpeed bar + details */}
                <div className="dashboard-psi-inline">
                  <div className="dashboard-psi-inline-controls">
                    <select
                      aria-label="PageSpeed URL"
                      className="automate-select dashboard-select-compact"
                      value={psiTargetUrl}
                      onChange={(e) =>
                        setPsiTargetUrl(e.target.value as PageSpeedTargetUrl)
                      }
                    >
                      <option value="https://greyson.nl/">greyson.nl/</option>
                      <option value="https://www.greyson.nl/">www.greyson.nl/</option>
                      <option value="https://greyson.nl/over-mij">greyson.nl/over-mij</option>
                    </select>
                    <select
                      aria-label="PageSpeed apparaat"
                      className="automate-select dashboard-select-compact"
                      value={psiStrategy}
                      onChange={(e) =>
                        setPsiStrategy(e.target.value as PageSpeedStrategy)
                      }
                    >
                      <option value="mobile">Mobile</option>
                      <option value="desktop">Desktop</option>
                    </select>
                    <button
                      type="button"
                      className="dashboard-mini-btn"
                      disabled={pageSpeedBusy}
                      onClick={() => void runPageSpeedProbe()}
                    >
                      {pageSpeedBusy ? 'Meten...' : 'Meet PageSpeed'}
                    </button>
                  </div>

                  {pageSpeedResult?.ok && pageSpeedResult.scores ? (
                    <div className="dashboard-mini-metrics" style={{ marginTop: '10px' }}>
                      <div className="dashboard-metric-chip">
                        <span>SEO</span>
                        <strong>{pageSpeedResult.scores.seo ?? '—'}</strong>
                      </div>
                      <div className="dashboard-metric-chip">
                        <span>Perf</span>
                        <strong>{pageSpeedResult.scores.performance ?? '—'}</strong>
                      </div>
                      <div className="dashboard-metric-chip">
                        <span>A11y</span>
                        <strong>{pageSpeedResult.scores.accessibility ?? '—'}</strong>
                      </div>
                      <div className="dashboard-metric-chip">
                        <span>LCP</span>
                        <strong>{formatVitalMs(pageSpeedResult.labMetrics?.lcpMs)}</strong>
                      </div>
                    </div>
                  ) : pageSpeedResult && !pageSpeedResult.ok ? (
                    <p className="dashboard-panel-sub" style={{ marginTop: '8px', color: '#991b1b' }}>
                      {pageSpeedResult.status === 429
                        ? 'Google PageSpeed daglimiet bereikt (HTTP 429) — vul GOOGLE_PAGESPEED_API_KEY in .env in voor live Lighthouse & CrUX.'
                        : pageSpeedResult.error}
                    </p>
                  ) : null}
                </div>

                {/* Technische diepgang netjes ingeklapt zodat hoofdoverzicht schoon blijft */}
                {(siteAudit?.ok || discoveryAudit?.ok || pageSpeedResult?.ok) && (
                  <details className="dashboard-details">
                    <summary>
                      {lang === 'nl'
                        ? 'Technische details: DNS, sitemap-URL’s, bots & Lighthouse SEO-checks'
                        : 'Technical details: DNS, sitemap URLs, bots & Lighthouse SEO'}
                    </summary>

                    <div className="dashboard-details-stack">
                      {siteAudit?.ok && siteAudit.robots && (
                        <div className="dashboard-badge-row">
                          {siteAudit.robots.botAccess.map((b) => (
                            <span
                              key={b.bot}
                              className={`dashboard-status-pill ${
                                b.allowed ? 'is-good' : 'is-poor'
                              }`}
                            >
                              {b.bot}: {b.allowed ? 'OK' : 'Blocked'}
                            </span>
                          ))}
                        </div>
                      )}

                      {discoveryAudit?.ok && (
                        <div
                          tabIndex={0}
                          role="region"
                          aria-label="DNS records"
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
                                    <span className="dashboard-code-pill">
                                      {host.host}
                                    </span>
                                  </th>
                                  <td data-label="A / AAAA">
                                    {[...host.a, ...host.aaaa].join(', ') || '—'}
                                  </td>
                                  <td data-label="CNAME / TXT">
                                    {host.cname.length > 0
                                      ? host.cname.join(', ')
                                      : host.txt.length > 0
                                        ? `${host.txt.length} TXT`
                                        : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {discoveryAudit?.rdap?.ok &&
                        discoveryAudit.rdap.registeredAt && (
                          <p className="dashboard-subtext">
                            SIDN geregistreerd:{' '}
                            {formatShortDate(discoveryAudit.rdap.registeredAt)} ·
                            Nameservers:{' '}
                            {discoveryAudit.rdap.nameservers?.join(', ') || '—'}
                          </p>
                        )}

                      {pageSpeedResult?.ok &&
                        pageSpeedResult.seoAudits &&
                        pageSpeedResult.seoAudits.length > 0 && (
                          <div className="dashboard-badge-row">
                            {pageSpeedResult.seoAudits.map((a) => (
                              <span
                                key={a.id}
                                className={`dashboard-status-pill ${
                                  a.score === 1 ? 'is-good' : a.score === null ? '' : 'is-poor'
                                }`}
                              >
                                {a.title}: {a.score === 1 ? 'Pass' : a.score === null ? 'Info' : 'Fail'}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </details>
                )}
              </div>
            </section>
          </div>

          {/* BAND 3: Recente Bezoekers & Live Events (PostHog) */}
          <div className="dashboard-grid-2">
            <section
              className="dashboard-panel"
              aria-labelledby={`dashboard-visitors-heading-${uid}`}
            >
              <h2 id={`dashboard-visitors-heading-${uid}`}>
                {t.visitorsHeading}
              </h2>
              {!phLive ? (
                <p className="dashboard-empty">{t.noPosthogData}</p>
              ) : phLive.visitors.length === 0 ? (
                <p className="dashboard-empty">{t.noMeasurements}</p>
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
                        <th scope="col">Visitor</th>
                        <th scope="col">Herkomst</th>
                        <th scope="col">Locatie</th>
                        <th scope="col">Entry</th>
                        <th scope="col">Events</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phLive.visitors.slice(0, 15).map((visitor) => (
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
                              {visitor.distinctId.slice(0, 12)}
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
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  Replay ↗
                                </a>
                              </div>
                            )}
                          </th>
                          <td data-label="Herkomst">
                            <div>{visitor.referringDomain}</div>
                            <div className="dashboard-subtext">
                              {t.channels[visitor.channel]}
                            </div>
                          </td>
                          <td data-label="Locatie">
                            {visitor.locationLabel}
                            <div className="dashboard-subtext">
                              {visitor.deviceType} · {visitor.browser}
                            </div>
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
              <h2 id={`dashboard-events-heading-${uid}`}>{t.eventsHeading}</h2>
              {!phLive ? (
                <p className="dashboard-empty">{t.noPosthogData}</p>
              ) : phLive.recentEvents.length === 0 ? (
                <p className="dashboard-empty">{t.noMeasurements}</p>
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
                        <th scope="col">Details</th>
                        <th scope="col">Tijd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phLive.recentEvents.slice(0, 15).map((evt) => (
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
                          <td data-label="Details">
                            {formatEventProperties(evt.properties)}
                          </td>
                          <td data-label="Tijd">
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
                                  style={{ fontSize: '0.78rem' }}
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
        </main>

        {/* Native <dialog> voor .env & sessiesleutels (dialog guide compliant) */}
        <dialog
          ref={settingsDialogRef}
          className="dashboard-dialog"
          aria-labelledby={`settings-dialog-title-${uid}`}
          {...({ closedby: 'any' } as Record<string, string>)}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            pointerDownOutsideDialog.current =
              e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom;
          }}
          onPointerUp={(e) => {
            if (!pointerDownOutsideDialog.current) return;
            pointerDownOutsideDialog.current = false;
            const rect = e.currentTarget.getBoundingClientRect();
            const isOutside =
              e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom;
            if (isOutside && !('closedBy' in HTMLDialogElement.prototype)) {
              closeSettingsDialog();
            }
          }}
        >
          <div className="dashboard-dialog-inner">
            <div className="dashboard-panel-head">
              <h2 id={`settings-dialog-title-${uid}`}>
                {lang === 'nl'
                  ? 'Koppelingen (.env & sessiesleutels)'
                  : 'Connections (.env & session keys)'}
              </h2>
              <button
                type="button"
                className="dashboard-mini-btn"
                onClick={closeSettingsDialog}
              >
                {lang === 'nl' ? 'Sluiten' : 'Close'}
              </button>
            </div>

            <div className="dashboard-env-summary">
              <p className="dashboard-panel-sub" style={{ marginTop: 0 }}>
                {lang === 'nl'
                  ? 'Standaard leest dit lokale dashboard automatisch de velden uit .env (nooit meegebundeld in productie). Vul daar je keys in voor permanente lokale koppeling, of test hieronder tijdelijk:'
                  : 'By default this local dashboard reads your .env fields automatically (never bundled into dist/). Fill them in .env permanently, or override for this session below:'}
              </p>
              <div className="dashboard-badge-row">
                <span
                  className={`dashboard-status-pill ${
                    envStatus.posthogKeyPresent ? 'is-good' : 'is-warn'
                  }`}
                >
                  .env POSTHOG_PERSONAL_API_KEY:{' '}
                  {envStatus.posthogKeyPresent ? 'Geladen' : 'Leeg'}
                </span>
                <span
                  className={`dashboard-status-pill ${
                    envStatus.posthogProjectId ? 'is-good' : 'is-warn'
                  }`}
                >
                  POSTHOG_PROJECT_ID:{' '}
                  {envStatus.posthogProjectId || 'Auto via phc_'}
                </span>
                <span
                  className={`dashboard-status-pill ${
                    envStatus.hasPageSpeedKey ? 'is-good' : ''
                  }`}
                >
                  .env GOOGLE_PAGESPEED_API_KEY:{' '}
                  {envStatus.hasPageSpeedKey ? 'Geladen' : 'Optioneel'}
                </span>
              </div>
            </div>

            <form
              className="automate-form"
              onSubmit={handleSaveAndFetchConfig}
              noValidate
            >
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
                  <label htmlFor={`ph-project-id-${uid}`}>
                    Project ID (optioneel bij phx_)
                  </label>
                  <input
                    id={`ph-project-id-${uid}`}
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
                    placeholder="Auto via token"
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
                        envStatus.posthogKeyPresent
                          ? '(.env actief)'
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
                          : 'AIza...'
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

              {settingsFeedback && (
                <div className="automate-form-status" role="status">
                  <span>{settingsFeedback}</span>
                </div>
              )}

              <div className="automate-form-actions">
                <button
                  type="submit"
                  className="automate-btn-primary"
                  disabled={posthogBusy}
                >
                  {posthogBusy ? t.refreshing : 'Opslaan & Data Ophalen'}
                </button>
                <button
                  type="button"
                  className="automate-btn-secondary"
                  onClick={handleClearSessionKeys}
                >
                  Sessie-sleutels wissen
                </button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    </div>
  );
};
