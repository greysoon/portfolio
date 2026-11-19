import React, { useEffect } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { siteConfig } from '../config/siteConfig';
import { TypingHeader } from './TypingHeader';
import { LiveAgeBio } from './LiveAgeBio';
import { ContactSection } from './ContactSection';
import { PastelGlobe } from './PastelGlobe';

const { Content } = Layout;

const INCONSOLATA_HREF =
  'https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;500;600;700&display=swap';

export interface PortfolioViewProps {
  portfolioMode: 'about' | 'cv';
  introComplete: boolean;
  onIntroComplete: () => void;
  onOpenAutomate: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolioMode,
  introComplete,
  onIntroComplete,
  onOpenAutomate,
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.head.querySelector(`link[href="${INCONSOLATA_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = INCONSOLATA_HREF;
    document.head.appendChild(link);
  }, []);

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
      <Layout className="portfolio-layout">
        <Content className="portfolio-content">
          <TypingHeader onComplete={onIntroComplete} />

          <main
            id="main"
            tabIndex={-1}
            className={`main-container ${introComplete ? 'visible' : ''}`}
          >
            <LiveAgeBio />
            <ContactSection
              isCvView={portfolioMode === 'cv'}
              onOpenAutomate={onOpenAutomate}
            />
            <PastelGlobe visible={introComplete} />
          </main>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default PortfolioView;
