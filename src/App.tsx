import React, { useCallback, useEffect, useState } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { siteConfig } from './config/siteConfig';
import { initTelemetry, trackInteraction } from './utils/telemetry';
import { TypingHeader } from './components/TypingHeader';
import { LiveAgeBio } from './components/LiveAgeBio';
import { ContactSection } from './components/ContactSection';
import { PastelGlobe } from './components/PastelGlobe';
import { AutomatePage } from './components/AutomatePage';

const { Content } = Layout;

type ActiveView = 'portfolio' | 'automate';

function isAutomateRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.toLowerCase().startsWith('automate.') ||
    window.location.pathname.toLowerCase().startsWith('/automate') ||
    new URLSearchParams(window.location.search).get('site') === 'automate'
  );
}

export const App: React.FC = () => {
  const [view, setView] = useState<ActiveView>(() =>
    isAutomateRoute() ? 'automate' : 'portfolio'
  );
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    initTelemetry();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setView(isAutomateRoute() ? 'automate' : 'portfolio');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.title =
      view === 'automate'
        ? 'Greyson Automation — Friesland AI & Workflow Automation'
        : siteConfig.siteTitle;
    if (view === 'automate') {
      setIntroComplete(false);
    }
  }, [view]);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    trackInteraction('intro_complete');
  }, []);

  const handleOpenAutomate = useCallback(() => {
    setView('automate');
    if (
      typeof window !== 'undefined' &&
      !window.location.hostname.toLowerCase().startsWith('automate.')
    ) {
      const url = new URL(window.location.href);
      url.searchParams.set('site', 'automate');
      window.history.pushState({ view: 'automate' }, '', url.toString());
    }
  }, []);

  const handleBackToPortfolio = useCallback(() => {
    setView('portfolio');
    if (
      typeof window !== 'undefined' &&
      !window.location.hostname.toLowerCase().startsWith('automate.')
    ) {
      const url = new URL(window.location.href);
      url.searchParams.delete('site');
      if (url.pathname.toLowerCase().startsWith('/automate')) {
        url.pathname = '/';
      }
      window.history.pushState({ view: 'portfolio' }, '', url.toString());
    }
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
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

      {view === 'automate' ? (
        <AutomatePage onBackToPortfolio={handleBackToPortfolio} />
      ) : (
        <Layout className="portfolio-layout">
          <Content className="portfolio-content">
            <TypingHeader onComplete={handleIntroComplete} />

            <main
              id="main"
              tabIndex={-1}
              className={`main-container ${introComplete ? 'visible' : ''}`}
            >
              <LiveAgeBio />
              <ContactSection onOpenAutomate={handleOpenAutomate} />
              <PastelGlobe visible={introComplete} />
            </main>
          </Content>
        </Layout>
      )}
    </ConfigProvider>
  );
};

export default App;
