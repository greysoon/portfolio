import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AutomateLocale } from './config/automateConfig';
import { initTelemetry, trackInteraction } from './utils/telemetry';
import {
  capturePostHogEvent,
  initPostHogBridge,
  isLocalDashboardHost,
} from './utils/posthogClient';
import { applyDocumentSeoMetadata } from './utils/seoMetadata';
import { AutomatePage } from './components/AutomatePage';
import { AboutMePage } from './components/AboutMePage';

const PortfolioView = lazy(() => import('./components/PortfolioView'));
const AnalyticsDashboard = lazy(() =>
  import('./components/AnalyticsDashboard').then((m) => ({
    default: m.AnalyticsDashboard,
  }))
);

export type ActiveView = 'automate' | 'about' | 'portfolio' | 'dashboard';
export type PortfolioMode = 'about' | 'cv';

export interface RouteResolution {
  view: ActiveView;
  portfolioMode: PortfolioMode;
  locale: AutomateLocale;
}

export function resolveViewFromLocation(): RouteResolution {
  if (typeof window === 'undefined') {
    return { view: 'automate', portfolioMode: 'about', locale: 'nl' };
  }

  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const site = params.get('site')?.toLowerCase();
  const page = params.get('page')?.toLowerCase();
  const langParam = params.get('lang')?.toLowerCase();

  if (
    isLocalDashboardHost(host) &&
    (host.startsWith('dashboard.') ||
      path.startsWith('/dashboard') ||
      site === 'dashboard')
  ) {
    return { view: 'dashboard', portfolioMode: 'about', locale: 'en' };
  }

  // Dedicated CV / Portfolio DigitalOcean app (cv.greyson.nl / about.greyson.nl / greyson-cv-about)
  if (
    host.startsWith('cv.') ||
    host.startsWith('about.') ||
    host.includes('cv-about') ||
    host.includes('about-cv') ||
    path.startsWith('/cv') ||
    site === 'cv' ||
    site === 'portfolio'
  ) {
    return {
      view: 'portfolio',
      portfolioMode: host.startsWith('about.') && site !== 'cv' ? 'about' : 'cv',
      locale: 'en',
    };
  }

  // English About route
  if (path.startsWith('/en/about') || path.startsWith('/en/over-mij')) {
    return { view: 'about', portfolioMode: 'about', locale: 'en' };
  }

  // Real About Me & Contact page inside the main site (greyson.nl / automation.greyson.nl)
  if (
    path.startsWith('/about') ||
    path.startsWith('/over-mij') ||
    site === 'about' ||
    page === 'about'
  ) {
    return {
      view: 'about',
      portfolioMode: 'about',
      locale: langParam === 'en' ? 'en' : 'nl',
    };
  }

  // English Home route
  if (path === '/en' || path.startsWith('/en/')) {
    return { view: 'automate', portfolioMode: 'about', locale: 'en' };
  }

  if (
    host.startsWith('automation.') ||
    host.startsWith('automate.') ||
    path.startsWith('/automate') ||
    site === 'automate'
  ) {
    return {
      view: 'automate',
      portfolioMode: 'about',
      locale: langParam === 'en' ? 'en' : 'nl',
    };
  }

  // Default main site: greyson.nl, www.greyson.nl, /
  return {
    view: 'automate',
    portfolioMode: 'about',
    locale: langParam === 'en' ? 'en' : 'nl',
  };
}

export interface AppProps {
  initialRoute?: RouteResolution;
}

export const App: React.FC<AppProps> = ({ initialRoute }) => {
  const [route, setRoute] = useState<RouteResolution>(
    () => initialRoute ?? resolveViewFromLocation()
  );
  const [locale, setLocale] = useState<AutomateLocale>(
    () => initialRoute?.locale ?? resolveViewFromLocation().locale
  );
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    initTelemetry();
    initPostHogBridge();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const next = resolveViewFromLocation();
      setRoute(next);
      setLocale(next.locale);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    applyDocumentSeoMetadata({
      view: route.view,
      portfolioMode: route.portfolioMode,
      locale,
    });

    if (route.view !== 'portfolio') {
      setIntroComplete(false);
    }

    if (route.view !== 'dashboard') {
      capturePostHogEvent('$pageview', {
        view: route.view,
        mode: route.view === 'portfolio' ? route.portfolioMode : route.view,
        lang: locale,
      });
    }
  }, [route.view, route.portfolioMode, locale]);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    trackInteraction('intro_complete');
  }, []);

  const syncHistoryUrl = useCallback(
    (
      nextView: ActiveView,
      nextPortfolioMode: PortfolioMode,
      nextLocale: AutomateLocale
    ) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      const usesQuerySite = url.searchParams.has('site');

      if (nextView === 'dashboard') {
        if (!usesQuerySite) {
          url.pathname = '/dashboard';
          url.searchParams.delete('site');
          url.searchParams.delete('page');
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('site', 'dashboard');
          url.searchParams.delete('page');
        }
      } else if (nextView === 'about') {
        if (!usesQuerySite) {
          url.pathname = nextLocale === 'en' ? '/en/about' : '/over-mij';
          url.searchParams.delete('site');
          url.searchParams.delete('page');
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('site', 'about');
          if (nextLocale === 'en') {
            url.searchParams.set('lang', 'en');
          } else {
            url.searchParams.delete('lang');
          }
          url.searchParams.delete('page');
        }
      } else if (nextView === 'portfolio') {
        if (!usesQuerySite) {
          url.pathname = nextPortfolioMode === 'cv' ? '/cv' : '/about';
          url.searchParams.delete('site');
          url.searchParams.delete('page');
        } else {
          url.searchParams.set(
            'site',
            nextPortfolioMode === 'cv' ? 'cv' : 'portfolio'
          );
          url.searchParams.delete('page');
        }
      } else {
        if (!usesQuerySite) {
          url.pathname = nextLocale === 'en' ? '/en' : '/';
          url.searchParams.delete('site');
          url.searchParams.delete('page');
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('site', 'automate');
          if (nextLocale === 'en') {
            url.searchParams.set('lang', 'en');
          } else {
            url.searchParams.delete('lang');
          }
          url.searchParams.delete('page');
        }
      }

      window.history.pushState(
        { view: nextView, portfolioMode: nextPortfolioMode, locale: nextLocale },
        '',
        url.toString()
      );
    },
    []
  );

  const navigateToView = useCallback(
    (nextView: ActiveView, portfolioMode: PortfolioMode = 'about') => {
      setRoute({ view: nextView, portfolioMode, locale });
      syncHistoryUrl(nextView, portfolioMode, locale);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    },
    [locale, syncHistoryUrl]
  );

  const handleLocaleChange = useCallback(
    (nextLocale: AutomateLocale) => {
      setLocale(nextLocale);
      setRoute((prev) => {
        syncHistoryUrl(prev.view, prev.portfolioMode, nextLocale);
        return { ...prev, locale: nextLocale };
      });
    },
    [syncHistoryUrl]
  );

  const skipLabel =
    locale === 'nl' && (route.view === 'automate' || route.view === 'about')
      ? 'Ga naar hoofdinhoud'
      : 'Skip to main content';

  return (
    <>
      <a href="#main" className="skip-link">
        {skipLabel}
      </a>

      {route.view === 'dashboard' ? (
        <Suspense
          fallback={<div className="dashboard-root" aria-busy="true" />}
        >
          <AnalyticsDashboard onNavigate={navigateToView} />
        </Suspense>
      ) : route.view === 'about' ? (
        <AboutMePage
          lang={locale}
          onLocaleChange={handleLocaleChange}
          onOpenHome={() => navigateToView('automate')}
          onOpenDashboard={() => navigateToView('dashboard')}
        />
      ) : route.view === 'portfolio' ? (
        <Suspense
          fallback={<div className="portfolio-layout" aria-busy="true" />}
        >
          <PortfolioView
            portfolioMode={route.portfolioMode}
            introComplete={introComplete}
            onIntroComplete={handleIntroComplete}
            onOpenAutomate={() => navigateToView('automate')}
          />
        </Suspense>
      ) : (
        <AutomatePage
          lang={locale}
          onLocaleChange={handleLocaleChange}
          onOpenAbout={() => navigateToView('about')}
          onOpenDashboard={() => navigateToView('dashboard')}
        />
      )}
    </>
  );
};

export default App;
