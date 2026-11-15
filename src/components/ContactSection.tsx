import React from 'react';
import { Typography } from 'antd';
import { siteConfig } from '../config/siteConfig';
import { trackInteraction } from '../utils/telemetry';

const { Title } = Typography;

export const ContactSection: React.FC = () => {
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
    </div>
  );
};
