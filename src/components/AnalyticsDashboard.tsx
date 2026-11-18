import React, { useCallback, useEffect, useState } from 'react';
import { automateConfig } from '../config/automateConfig';
import { trackInteraction } from '../utils/telemetry';
import {
  clearOwnerAuthSession,
  fetchPostHogAnalytics,
  getLocalVisitorAnalytics,
  getOwnerAuthStatus,
  getPostHogConfig,
  isLocalDashboardHost,
  LocalVisitorAnalytics,
  normalizePostHogRegion,
  OWNER_EMAIL,
  PostHogAnalyticsResult,
  PostHogRegion,
  savePostHogConfig,
  verifyOwnerPassphrase,
  verifyPostHogPersonalKey,
} from '../utils/posthogClient';
import { BrandLogo } from './BrandLogo';
import '../styles/automate.css';

interface AnalyticsDashboardProps {
  onNavigate?: (
    view: 'automate' | 'about' | 'portfolio' | 'dashboard',
    portfolioMode?: 'about' | 'cv'
  ) => void;
}

const INPUT_BOUNDS = {
  email: 254,
  passphrase: 256,
  apiKey: 256,
  projectId: 32,
} as const;

function formatVital(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${Math.round(value)} ms`;
}

function formatEventTime(isoString: string): string {
  if (!isoString) return '—';
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return isoString;
  return parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatEventProperties(
  props: Readonly<Record<string, string | number | boolean>>
): string {
  const priorityKeys = [
    'view',
    'mode',
    'interest',
    'target',
    'channel',
    'lang',
    'type',
    'value',
    'rating',
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
      if (
        seen.has(key) ||
        key === 'host' ||
        key === 'subdomain' ||
        key === 'pathname' ||
        val === ''
      ) {
        continue;
      }
      entries.push(`${key}=${String(val)}`);
      if (entries.length >= 4) break;
    }
  }

  return entries.length > 0 ? entries.join(' · ') : '—';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onNavigate,
}) => {
  const initialConfig = getPostHogConfig();
  const initialAuth = getOwnerAuthStatus();

  const isLocalOnly =
    typeof window !== 'undefined' &&
    isLocalDashboardHost(window.location.hostname);

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

  // PostHog Cloud config & direct key auth state
  const [region, setRegion] = useState<PostHogRegion>(initialConfig.region);
  const [projectApiKey, setProjectApiKey] = useState<string>(
    initialConfig.projectApiKey
  );
  const [personalApiKey, setPersonalApiKey] = useState<string>(
    initialConfig.personalApiKey
  );
  const [projectId, setProjectId] = useState<string>(initialConfig.projectId);

  // Live + local analytics state
  const [localSnapshot, setLocalSnapshot] = useState<LocalVisitorAnalytics>(() =>
    getLocalVisitorAnalytics()
  );
  const [liveAnalytics, setLiveAnalytics] =
    useState<PostHogAnalyticsResult | null>(null);
  const [queryBusy, setQueryBusy] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [queryError, setQueryError] = useState<string>('');

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

  const refreshLocalSnapshot = useCallback(() => {
    setLocalSnapshot(getLocalVisitorAnalytics());
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    refreshLocalSnapshot();
  }, [unlocked, refreshLocalSnapshot]);

  const handleFetchLivePostHog = useCallback(
    async (override?: {
      region?: PostHogRegion;
      projectApiKey?: string;
      personalApiKey?: string;
      projectId?: string;
    }) => {
      const nextCfg = savePostHogConfig({
        region: override?.region ?? region,
        projectApiKey: override?.projectApiKey ?? projectApiKey,
        personalApiKey: override?.personalApiKey ?? personalApiKey,
        projectId: override?.projectId ?? projectId,
      });

      setQueryBusy(true);
      setQueryError('');
      setStatusMessage('');

      const result = await fetchPostHogAnalytics(nextCfg);
      setQueryBusy(false);

      if (result.ok) {
        setLiveAnalytics(result);
        setStatusMessage(
          `Synced live PostHog Cloud data (${result.region.toUpperCase()} project ${result.projectId}).`
        );
        trackInteraction('dashboard_posthog_fetch', {
          region: result.region,
          ok: true,
        });
      } else {
        setQueryError(
          result.error || 'Unable to fetch live PostHog analytics.'
        );
        trackInteraction('dashboard_posthog_fetch', {
          region: nextCfg.region,
          ok: false,
        });
      }
    },
    [region, projectApiKey, personalApiKey, projectId]
  );

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
      refreshLocalSnapshot();
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
      await handleFetchLivePostHog({
        region: result.region,
        personalApiKey,
        projectId: result.projectId,
        projectApiKey,
      });
    } else {
      setAuthError(
        result.error || 'Unable to verify PostHog Personal API Key.'
      );
      trackInteraction('dashboard_auth', { method: 'posthog_key', ok: false });
    }
  };

  const handleSaveConfig = () => {
    const saved = savePostHogConfig({
      region,
      projectApiKey,
      personalApiKey,
      projectId,
    });
    setRegion(saved.region);
    setProjectApiKey(saved.projectApiKey);
    setPersonalApiKey(saved.personalApiKey);
    setProjectId(saved.projectId);
    setQueryError('');
    setStatusMessage(
      `Saved PostHog configuration (${saved.region.toUpperCase()}). Personal API key stays session-only.`
    );
  };

  const handleSignOut = () => {
    clearOwnerAuthSession(true);
    setUnlocked(false);
    setPassphrase('');
    setPersonalApiKey('');
    setLiveAnalytics(null);
    setStatusMessage('');
    setQueryError('');
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

  const activeSummary =
    liveAnalytics?.ok ? liveAnalytics.summary : localSnapshot.summary;
  const activeVisitors =
    liveAnalytics?.ok ? liveAnalytics.visitors : localSnapshot.visitors;
  const activeEvents =
    liveAnalytics?.ok ? liveAnalytics.recentEvents : localSnapshot.recentEvents;

  if (!unlocked) {
    return (
      <div className="dashboard-root">
        <div className="dashboard-container">
          <nav className="automate-nav" aria-label="Dashboard navigation">
            <span className="automate-brand">
              <BrandLogo label="GREYSON ANALYTICS" />
            </span>

            <div className="automate-nav-links">
              <a
                href={mainSiteHref}
                className="automate-back-link"
                onClick={(e) => handleNavClick(e, 'automate')}
              >
                &larr; Home (greyson.nl)
              </a>
              <a
                href={aboutHref}
                className="automate-back-link"
                onClick={(e) => handleNavClick(e, 'about')}
              >
                Over mij
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

  return (
    <div className="dashboard-root">
      <div className="dashboard-container">
        <main id="main" tabIndex={-1}>
          {/* Header */}
          <header className="dashboard-header">
            <div>
              <span className="automate-brand">
                <BrandLogo label="GREYSON ANALYTICS" />
              </span>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <span
                  className={`dashboard-badge ${
                    liveAnalytics?.ok ? 'dashboard-badge-live' : ''
                  }`}
                >
                  {liveAnalytics?.ok
                    ? `PostHog Cloud Live (${liveAnalytics.region.toUpperCase()})`
                    : 'Local Session Telemetry Active'}
                </span>
                <span className="dashboard-badge">
                  {isLocalOnly
                    ? 'Local Stats Console (localhost only)'
                    : `Auth: ${authMethod === 'posthog_key' ? 'PostHog Key' : OWNER_EMAIL}`}
                </span>
                <span className="dashboard-badge">
                  DNT: {localSnapshot.doNotTrack ? 'Enabled' : 'Off'}
                </span>
              </div>
            </div>

            <div className="dashboard-header-actions">
              <a
                href={mainSiteHref}
                className="automate-back-link"
                onClick={(e) => handleNavClick(e, 'automate')}
              >
                &larr; Home (greyson.nl)
              </a>
              <a
                href={aboutHref}
                className="automate-back-link"
                onClick={(e) => handleNavClick(e, 'about')}
              >
                Over mij
              </a>
              <button
                type="button"
                className="automate-btn-secondary"
                onClick={refreshLocalSnapshot}
              >
                Refresh Local
              </button>
              {!isLocalOnly && (
                <button
                  type="button"
                  className="automate-btn-primary"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              )}
            </div>
          </header>

          {/* PostHog Cloud Integration Bar */}
          <section
            className="dashboard-posthog-config"
            aria-labelledby="dashboard-posthog-heading"
          >
            <div>
              <h2 id="dashboard-posthog-heading">PostHog Cloud Integration</h2>
              <p className="automate-form-note" style={{ marginTop: '4px' }}>
                Configure a PostHog Project API Key (<code>phc_...</code>) for
                live event capture across all subdomains, and a session-scoped
                Personal API Key (<code>phx_...</code>) + Project ID to query
                live HogQL visitor analytics.
              </p>
            </div>

            <div className="dashboard-config-grid">
              <div className="automate-field">
                <label htmlFor="ph-region">Region</label>
                <select
                  id="ph-region"
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
                <label htmlFor="ph-project-key">Project API Key (phc_...)</label>
                <input
                  id="ph-project-key"
                  type="text"
                  className="automate-input"
                  autoComplete="off"
                  maxLength={INPUT_BOUNDS.apiKey}
                  value={projectApiKey}
                  onChange={(e) => setProjectApiKey(e.target.value)}
                  placeholder="phc_..."
                />
              </div>

              <div className="automate-field">
                <label htmlFor="ph-personal-key">
                  Personal API Key (phx_...)
                </label>
                <input
                  id="ph-personal-key"
                  type="password"
                  className="automate-input"
                  autoComplete="off"
                  maxLength={INPUT_BOUNDS.apiKey}
                  value={personalApiKey}
                  onChange={(e) => setPersonalApiKey(e.target.value)}
                  placeholder="phx_..."
                />
              </div>

              <div className="automate-field">
                <label htmlFor="ph-project-id">Project ID</label>
                <input
                  id="ph-project-id"
                  type="text"
                  className="automate-input"
                  autoComplete="off"
                  maxLength={INPUT_BOUNDS.projectId}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="e.g. 12345"
                />
              </div>
            </div>

            <div className="automate-form-actions">
              <button
                type="button"
                className="automate-btn-primary"
                disabled={queryBusy}
                onClick={() => void handleFetchLivePostHog()}
              >
                {queryBusy ? 'Fetching PostHog Data...' : 'Fetch Live PostHog Data'}
              </button>
              <button
                type="button"
                className="automate-btn-secondary"
                onClick={handleSaveConfig}
              >
                Save Config
              </button>
              {liveAnalytics?.ok && (
                <button
                  type="button"
                  className="automate-btn-secondary"
                  onClick={() => {
                    setLiveAnalytics(null);
                    setStatusMessage('Switched back to live local session telemetry.');
                  }}
                >
                  View Local Session
                </button>
              )}
            </div>

            {statusMessage && (
              <div className="automate-form-status" role="status" aria-live="polite">
                <span>{statusMessage}</span>
              </div>
            )}
            {queryError && (
              <div className="automate-form-error" role="alert">
                {queryError}
              </div>
            )}
          </section>

          {/* KPI Summary Cards */}
          <section
            className="dashboard-kpi-grid"
            aria-label="Analytics summary metrics"
          >
            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">Visitors</span>
              <span className="dashboard-kpi-value">
                {activeSummary.totalUniqueVisitors}
              </span>
              <span className="dashboard-kpi-sub">
                {liveAnalytics?.ok ? '30d unique visitors' : 'Active browser session'}
              </span>
            </article>

            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">Pageviews</span>
              <span className="dashboard-kpi-value">
                {activeSummary.totalPageviews}
              </span>
              <span className="dashboard-kpi-sub">
                {liveAnalytics?.ok ? 'PostHog $pageview (30d)' : 'Session pageviews'}
              </span>
            </article>

            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">Inquiry / Contact Clicks</span>
              <span className="dashboard-kpi-value">
                {activeSummary.inquiryClicks}
              </span>
              <span className="dashboard-kpi-sub">
                Form submits, CTAs &amp; links
              </span>
            </article>

            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">Active Subdomain</span>
              <span className="dashboard-kpi-value" style={{ fontSize: '1.2rem' }}>
                {activeSummary.activeSubdomain}
              </span>
              <span className="dashboard-kpi-sub">
                {activeSummary.subdomains.filter((s) => s.events > 0).length} active
                host(s)
              </span>
            </article>

            <article className="dashboard-kpi-card">
              <span className="dashboard-kpi-label">Web Vitals (FCP / LCP / TTFB)</span>
              <span className="dashboard-kpi-value" style={{ fontSize: '1.2rem' }}>
                FCP {formatVital(localSnapshot.vitals.FCP)}
              </span>
              <span className="dashboard-kpi-sub">
                LCP {formatVital(localSnapshot.vitals.LCP)} · TTFB{' '}
                {formatVital(localSnapshot.vitals.TTFB)}
              </span>
            </article>
          </section>

          {/* Subdomain Breakdown */}
          <section
            className="dashboard-panel"
            style={{ marginBottom: '24px' }}
            aria-labelledby="dashboard-subdomains-heading"
          >
            <h2 id="dashboard-subdomains-heading">Subdomain Traffic Breakdown</h2>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Subdomain</th>
                    <th>Visitors</th>
                    <th>Pageviews</th>
                    <th>Total Events</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSummary.subdomains.map((row) => (
                    <tr key={row.subdomain}>
                      <td>
                        <span className="dashboard-code-pill">{row.subdomain}</span>
                      </td>
                      <td>{row.visitors}</td>
                      <td>{row.pageviews}</td>
                      <td>{row.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Who Is Visiting + What They Do */}
          <div className="dashboard-grid-2">
            <section
              className="dashboard-panel"
              aria-labelledby="dashboard-visitors-heading"
            >
              <h2 id="dashboard-visitors-heading">Who Is Visiting</h2>
              {activeVisitors.length === 0 ? (
                <p className="dashboard-empty">No visitor profiles recorded yet.</p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Visitor ID</th>
                        <th>Location / Timezone</th>
                        <th>Referrer</th>
                        <th>Device / Browser / OS</th>
                        <th>Subdomain</th>
                        <th>Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVisitors.map((visitor) => (
                        <tr key={visitor.distinctId}>
                          <td>
                            <span className="dashboard-code-pill">
                              {visitor.distinctId}
                            </span>
                          </td>
                          <td>
                            {visitor.locationLabel}
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                              {visitor.timezone}
                            </div>
                          </td>
                          <td>{visitor.referringDomain}</td>
                          <td>
                            {visitor.deviceType} · {visitor.browser} · {visitor.os}
                          </td>
                          <td>
                            <span className="dashboard-code-pill">
                              {visitor.subdomain}
                            </span>
                          </td>
                          <td>{visitor.eventCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section
              className="dashboard-panel"
              aria-labelledby="dashboard-events-heading"
            >
              <h2 id="dashboard-events-heading">What They Do (Live Stream)</h2>
              {activeEvents.length === 0 ? (
                <p className="dashboard-empty">No events captured yet.</p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Route</th>
                        <th>Properties</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeEvents.map((evt) => (
                        <tr key={evt.id}>
                          <td>
                            <span className="dashboard-code-pill">{evt.event}</span>
                          </td>
                          <td>
                            {evt.host}
                            {evt.pathname}
                          </td>
                          <td>{formatEventProperties(evt.properties)}</td>
                          <td>{formatEventTime(evt.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};
