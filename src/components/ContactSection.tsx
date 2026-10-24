import React from 'react';
import { Typography } from 'antd';
import { siteConfig } from '../config/siteConfig';

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
        >
          LinkedIn
          <span className="underline" />
        </a>
        .
      </Title>

      <Title level={2} className="contact-line contact-inquiry">
        Business inquiry?{' '}
        <a href={`mailto:${siteConfig.email}`} className="pastel-link">
          Email me!
          <span className="underline" />
        </a>
      </Title>
    </div>
  );
};
