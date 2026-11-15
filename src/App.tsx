import React, { useCallback, useEffect, useState } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { siteConfig } from './config/siteConfig';
import { initTelemetry, trackInteraction } from './utils/telemetry';
import { TypingHeader } from './components/TypingHeader';
import { LiveAgeBio } from './components/LiveAgeBio';
import { ContactSection } from './components/ContactSection';
import { PastelGlobe } from './components/PastelGlobe';

const { Content } = Layout;

export const App: React.FC = () => {
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    initTelemetry();
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    trackInteraction('intro_complete');
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
      <Layout className="portfolio-layout">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Content className="portfolio-content">
          <TypingHeader onComplete={handleIntroComplete} />

          <main
            id="main"
            tabIndex={-1}
            className={`main-container ${introComplete ? 'visible' : ''}`}
          >
            <LiveAgeBio />
            <ContactSection />
            <PastelGlobe visible={introComplete} />
          </main>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
