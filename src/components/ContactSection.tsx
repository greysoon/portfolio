import React from 'react';
import { Typography } from 'antd';
import { siteConfig } from '../config/siteConfig';
import { trackInteraction } from '../utils/telemetry';

const { Title } = Typography;

interface ContactSectionProps {
  onOpenAutomate?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenAutomate }) => {
  const isGreysonProductionHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'greyson.nl' ||
      window.location.hostname === 'www.greyson.nl');

  const automateHref = isGreysonProductionHost
    ? 'https://automate.greyson.nl'
    : '?site=automate';

  const handleAutomateClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackInteraction('contact_click', { channel: 'automate' });
    if (
      !isGreysonProductionHost &&
      onOpenAutomate &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      e.button === 0
    ) {
      e.preventDefault();
      onOpenAutomate();
    }
  };

  return (
    <div id="details" className="contact-section">
      <Title level={2} className="contact-line">
        Check out my{' '}
        <a
          href={siteConfig.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pastel-link"
          onClick={() => trackInteraction('contact_click', { channel: 'linkedin' })}
        >
          LinkedIn
          <span className="underline" />
        </a>
        .
      </Title>

      <Title level={2} className="contact-line contact-inquiry">
        Business inquiry?{' '}
        <a
          href={`mailto:${siteConfig.email}`}
          className="pastel-link"
          onClick={() => trackInteraction('contact_click', { channel: 'email' })}
        >
          Email me!
          <span className="underline" />
        </a>
      </Title>

      <Title level={2} className="contact-line contact-inquiry">
        AI &amp; automation in Friesland?{' '}
        <a
          href={automateHref}
          className="pastel-link"
          onClick={handleAutomateClick}
        >
          automate.greyson.nl
          <span className="underline" />
        </a>
      </Title>
    </div>
  );
};
