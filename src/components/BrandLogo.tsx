import React, { useId } from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  subtitle?: string;
  showWordmark?: boolean;
}

const SIZE_PX: Record<NonNullable<BrandLogoProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 44,
};

/**
 * Custom geometric {G} + AI node-spark brand emblem & wordmark.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  label = 'GREYSON',
  subtitle,
  showWordmark = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const gradRedId = `greyson-logo-red-${uid}`;
  const gradBgId = `greyson-logo-bg-${uid}`;
  const px = SIZE_PX[size];

  return (
    <span className="automate-brand-lockup">
      <svg
        className={`automate-logo-mark automate-logo-mark--${size}`}
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradRedId}
            x1="8"
            y1="6"
            x2="58"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#D94F48" />
            <stop offset="100%" stopColor="#962721" />
          </linearGradient>
          <linearGradient
            id={gradBgId}
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFDFB" />
            <stop offset="100%" stopColor="#F7F5F2" />
          </linearGradient>
        </defs>

        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="15"
          fill={`url(#${gradBgId})`}
          stroke={`url(#${gradRedId})`}
          strokeWidth="2.75"
        />
        <rect
          x="5.5"
          y="5.5"
          width="53"
          height="53"
          rx="12"
          stroke="#F28B82"
          strokeOpacity="0.28"
          strokeWidth="1"
        />

        <path
          d="M40 20L48.5 14.5"
          stroke="#D94F48"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.78"
        />

        <path
          d="M18.5 19.5C15.5 19.5 14.2 21.1 14.2 23.8V28.3C14.2 30.2 13.1 31.3 11.4 32C13.1 32.7 14.2 33.8 14.2 35.7V40.2C14.2 42.9 15.5 44.5 18.5 44.5"
          stroke={`url(#${gradRedId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M45.5 23.2C47.8 23.2 48.8 24.5 48.8 26.8V29.1C48.8 30.6 49.7 31.5 51 32C49.7 32.5 48.8 33.4 48.8 34.9V40.4C48.8 42.9 47.5 44.5 44.5 44.5"
          stroke={`url(#${gradRedId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M39.2 23.6C37.1 21.8 34.4 20.8 31.5 20.8C25.2 20.8 20.8 25.5 20.8 32C20.8 38.5 25.2 43.2 31.8 43.2C36.6 43.2 40.4 40.4 41.2 35.6V32.4H32.2"
          stroke="#18191C"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="32.2" cy="32.4" r="2.2" fill="#D94F48" />
        <circle
          cx="49"
          cy="14"
          r="4.6"
          fill={`url(#${gradRedId})`}
          stroke="#FFFDFB"
          strokeWidth="1.5"
        />
      </svg>

      {showWordmark && (
        <span className="automate-brand-copy">
          <span className="automate-brand-text">
            <span className="brace" aria-hidden="true">
              {'{'}
            </span>
            <span>{label}</span>
            <span className="brace" aria-hidden="true">
              {'}'}
            </span>
          </span>
          {subtitle && <span className="automate-brand-sub">{subtitle}</span>}
        </span>
      )}
    </span>
  );
};
