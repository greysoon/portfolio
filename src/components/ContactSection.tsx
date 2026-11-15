import React from 'react';
import { Typography } from 'antd';
import { siteConfig } from '../config/siteConfig';
import { trackInteraction } from '../utils/telemetry';
import { capturePostHogEvent } from '../utils/posthogClient';
import '../styles/automate.css';

const { Title } = Typography;

interface ContactSectionProps {
  isCvView?: boolean;
  onOpenAutomate?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  isCvView,
  onOpenAutomate,
}) => {
  const isGreysonProductionHost =
    typeof window !== 'undefined' &&
    (window.location.hostname.toLowerCase() === 'greyson.nl' ||
      window.location.hostname.toLowerCase().endsWith('.greyson.nl'));

  const detectedCv =
    typeof window !== 'undefined' &&
    (window.location.hostname.toLowerCase().startsWith('cv.') ||
      window.location.pathname.toLowerCase().startsWith('/cv') ||
      new URLSearchParams(window.location.search).get('site')?.toLowerCase() ===
        'cv');

  const showCvCard = isCvView ?? detectedCv;

  const automateHref = isGreysonProductionHost
    ? 'https://automation.greyson.nl'
    : '?site=automate';

  const handleAutomateClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackInteraction('contact_click', { channel: 'automate' });
    capturePostHogEvent('contact_click', { channel: 'automate' });

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
          onClick={() => {
            trackInteraction('contact_click', { channel: 'linkedin' });
            capturePostHogEvent('contact_click', { channel: 'linkedin' });
          }}
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
          onClick={() => {
            trackInteraction('contact_click', { channel: 'email' });
            capturePostHogEvent('contact_click', { channel: 'email' });
          }}
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
          automation.greyson.nl
          <span className="underline" />
        </a>
      </Title>

      {showCvCard && (
        <section
          className="cv-card"
          aria-label={siteConfig.cvSummary.title}
        >
          <div className="cv-card-header">
            <h3 className="cv-card-title">{siteConfig.cvSummary.title}</h3>
            <span className="cv-card-meta">{siteConfig.cvSummary.location}</span>
          </div>
          <div className="cv-card-meta">
            {siteConfig.cvSummary.role} — {siteConfig.cvSummary.availability}
          </div>
          <ul className="cv-stack-list" aria-label="Core technology stack">
            {siteConfig.cvSummary.coreStack.map((tech) => (
              <li key={tech} className="cv-stack-tag">
                {tech}
              </li>
            ))}
          </ul>
          <ul className="cv-highlights">
            {siteConfig.cvSummary.highlights.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
