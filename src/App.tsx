import React, { useCallback, useState } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { siteConfig } from './config/siteConfig';
import { TypingHeader } from './components/TypingHeader';
import { LiveAgeBio } from './components/LiveAgeBio';
import { ContactSection } from './components/ContactSection';
import { PastelGlobe } from './components/PastelGlobe';

const { Content } = Layout;

export const App: React.FC = () => {
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
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
        <Content className="portfolio-content">
          <TypingHeader onComplete={handleIntroComplete} />

          <main
            id="main"
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
