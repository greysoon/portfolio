import React, { useCallback, useEffect, useState } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { siteConfig } from './config/siteConfig';
import { AutomateLocale } from './config/automateConfig';
import { initTelemetry, trackInteraction } from './utils/telemetry';
import {
  capturePostHogEvent,
  initPostHogBridge,
  isLocalDashboardHost,
} from './utils/posthogClient';
import { TypingHeader } from './components/TypingHeader';
import { LiveAgeBio } from './components/LiveAgeBio';
import { ContactSection } from './components/ContactSection';
import { PastelGlobe } from './components/PastelGlobe';
import { AutomatePage } from './components/AutomatePage';
import { AboutMePage } from './components/AboutMePage';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

const { Content } = Layout;

type ActiveView = 'automate' | 'about' | 'portfolio' | 'dashboard';
type PortfolioMode = 'about' | 'cv';

interface RouteResolution {
  view: ActiveView;
  portfolioMode: PortfolioMode;
}

function resolveViewFromLocation(): RouteResolution {
  if (typeof window === 'undefined') {
    return { view: 'automate', portfolioMode: 'about' };
  }

  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const site = params.get('site')?.toLowerCase();
  const page = params.get('page')?.toLowerCase();

  if (
    isLocalDashboardHost(host) &&
    (host.startsWith('dashboard.') ||
      path.startsWith('/dashboard') ||
      site === 'dashboard')
  ) {
    return { view: 'dashboard', portfolioMode: 'about' };
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
    };
  }

  // Real About Me & Contact page inside the main site (greyson.nl / automation.greyson.nl)
  if (
    path.startsWith('/about') ||
    path.startsWith('/over-mij') ||
    site === 'about' ||
    page === 'about'
  ) {
    return { view: 'about', portfolioMode: 'about' };
  }

  if (
    host.startsWith('automation.') ||
    host.startsWith('automate.') ||
    path.startsWith('/automate') ||
    site === 'automate'
  ) {
    return { view: 'automate', portfolioMode: 'about' };
  }

  // Default main site: greyson.nl, www.greyson.nl, /
  return { view: 'automate', portfolioMode: 'about' };
}

export const App: React.FC = () => {
  const [route, setRoute] = useState<RouteResolution>(() =>
    resolveViewFromLocation()
  );
  const [locale, setLocale] = useState<AutomateLocale>('nl');
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    initTelemetry();
    initPostHogBridge();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolveViewFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (route.view === 'dashboard') {
      document.title = 'Analytics Dashboard — Greyson Automation';
    } else if (route.view === 'about') {
      document.title =
        locale === 'nl'
          ? 'Over Greyson Beimers — Praktische AI & Software'
          : 'About Greyson Beimers — Practical AI & Software';
    } else if (route.view === 'portfolio') {
      document.title =
        route.portfolioMode === 'cv'
          ? siteConfig.cvSummary.title
          : siteConfig.siteTitle;
    } else {
      document.title = 'Greyson Automation — Friesland AI & Workflow Automation';
    }

    if (route.view !== 'portfolio') {
      setIntroComplete(false);
    }

    if (route.view !== 'dashboard') {
      capturePostHogEvent('$pageview', {
        view: route.view,
        mode: route.view === 'portfolio' ? route.portfolioMode : route.view,
      });
    }
  }, [route.view, route.portfolioMode, locale]);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    trackInteraction('intro_complete');
  }, []);

  const navigateToView = useCallback(
    (nextView: ActiveView, portfolioMode: PortfolioMode = 'about') => {
      setRoute({ view: nextView, portfolioMode });

      if (typeof window === 'undefined') return;
      const host = window.location.hostname.toLowerCase();
      const isGreysonDomain =
        host === 'greyson.nl' || host.endsWith('.greyson.nl');
      const url = new URL(window.location.href);

      if (nextView === 'dashboard') {
        if (isGreysonDomain) {
          url.pathname = '/dashboard';
          url.searchParams.delete('site');
          url.searchParams.delete('page');
        } else {
          url.searchParams.set('site', 'dashboard');
          url.searchParams.delete('page');
        }
      } else if (nextView === 'about') {
        if (isGreysonDomain) {
          url.pathname = '/over-mij';
          url.searchParams.delete('site');
          url.searchParams.delete('page');
        } else {
          url.searchParams.set('site', 'about');
          url.searchParams.delete('page');
        }
      } else if (nextView === 'portfolio') {
        if (isGreysonDomain) {
          url.pathname = portfolioMode === 'cv' ? '/cv' : '/about';
          url.searchParams.delete('site');
          url.searchParams.delete('page');
        } else {
          url.searchParams.set('site', portfolioMode === 'cv' ? 'cv' : 'portfolio');
          url.searchParams.delete('page');
        }
      } else {
        url.searchParams.delete('site');
        url.searchParams.delete('page');
        if (
          url.pathname.toLowerCase().startsWith('/about') ||
          url.pathname.toLowerCase().startsWith('/over-mij') ||
          url.pathname.toLowerCase().startsWith('/cv') ||
          url.pathname.toLowerCase().startsWith('/dashboard') ||
          url.pathname.toLowerCase().startsWith('/automate')
        ) {
          url.pathname = '/';
        }
      }

      window.history.pushState(
        { view: nextView, portfolioMode },
        '',
        url.toString()
      );
    },
    []
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: siteConfig.colors.primaryPastelRed,
          colorInfo: siteConfig.colors.primaryPastelRed,
          colorLink: siteConfig.colors.primaryPastelRed,
          colorLinkHover: siteConfig.colors.secondaryPastelRed,
          colorBgBase: siteConfig.colors.bgBase,
          colorTextBase: siteConfig.colors.textPrimary,
          fontFamily: "'Inconsolata', monospace",
        },
      }}
    >
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {route.view === 'dashboard' ? (
        <AnalyticsDashboard onNavigate={navigateToView} />
      ) : route.view === 'about' ? (
        <AboutMePage
          lang={locale}
          onLocaleChange={setLocale}
          onOpenHome={() => navigateToView('automate')}
          onOpenDashboard={() => navigateToView('dashboard')}
        />
      ) : route.view === 'portfolio' ? (
        <Layout className="portfolio-layout">
          <Content className="portfolio-content">
            <TypingHeader onComplete={handleIntroComplete} />

            <main
              id="main"
              tabIndex={-1}
              className={`main-container ${introComplete ? 'visible' : ''}`}
            >
              <LiveAgeBio />
              <ContactSection
                isCvView={route.portfolioMode === 'cv'}
                onOpenAutomate={() => navigateToView('automate')}
              />
              <PastelGlobe visible={introComplete} />
            </main>
          </Content>
        </Layout>
      ) : (
        <AutomatePage
          lang={locale}
          onLocaleChange={setLocale}
          onOpenAbout={() => navigateToView('about')}
          onOpenDashboard={() => navigateToView('dashboard')}
        />
      )}
    </ConfigProvider>
  );
};

export default App;
