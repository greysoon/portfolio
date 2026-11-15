import React, { useCallback, useEffect, useState } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { siteConfig } from './config/siteConfig';
import { initTelemetry, trackInteraction } from './utils/telemetry';
import {
  capturePostHogEvent,
  initPostHogBridge,
} from './utils/posthogClient';
import { TypingHeader } from './components/TypingHeader';
import { LiveAgeBio } from './components/LiveAgeBio';
import { ContactSection } from './components/ContactSection';
import { PastelGlobe } from './components/PastelGlobe';
import { AutomatePage } from './components/AutomatePage';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

const { Content } = Layout;

type ActiveView = 'automate' | 'portfolio' | 'dashboard';
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

  if (
    host.startsWith('dashboard.') ||
    path.startsWith('/dashboard') ||
    site === 'dashboard'
  ) {
    return { view: 'dashboard', portfolioMode: 'about' };
  }

  if (host.startsWith('cv.') || path.startsWith('/cv') || site === 'cv') {
    return { view: 'portfolio', portfolioMode: 'cv' };
  }

  if (
    host.startsWith('about.') ||
    path.startsWith('/about') ||
    site === 'about' ||
    site === 'portfolio'
  ) {
    return { view: 'portfolio', portfolioMode: 'about' };
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

    capturePostHogEvent('$pageview', {
      view: route.view,
      mode: route.view === 'portfolio' ? route.portfolioMode : route.view,
    });
  }, [route.view, route.portfolioMode]);

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
        } else {
          url.searchParams.set('site', 'dashboard');
        }
      } else if (nextView === 'portfolio') {
        if (isGreysonDomain) {
          url.pathname = portfolioMode === 'cv' ? '/cv' : '/about';
          url.searchParams.delete('site');
        } else {
          url.searchParams.set('site', portfolioMode === 'cv' ? 'cv' : 'about');
        }
      } else {
        url.searchParams.delete('site');
        if (
          url.pathname.toLowerCase().startsWith('/about') ||
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
          onOpenAbout={() => navigateToView('portfolio', 'about')}
          onOpenCv={() => navigateToView('portfolio', 'cv')}
          onOpenDashboard={() => navigateToView('dashboard')}
        />
      )}
    </ConfigProvider>
  );
};

export default App;
