import React, { useId } from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  byLine?: string;
  subtitle?: string;
  showWordmark?: boolean;
}

const SIZE_PX: Record<NonNullable<BrandLogoProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 44,
};

function renderSubContent(text: string): React.ReactNode {
  const match = text.match(/^(.*?)(\bGreyson\b)(.*)$/i);
  if (!match) {
    return <span>{text}</span>;
  }
  const [, pre, owner, post] = match;
  return (
    <>
      {pre && <span className="automate-brand-by">{pre}</span>}
      <span className="automate-brand-owner">{owner}</span>
      {post && <span className="automate-brand-by">{post}</span>}
    </>
  );
}

/**
 * Borderless pipeline o-{G}» brand emblem & AUTOMATE • by Greyson lockup.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  label = 'AUTOMATE',
  byLine = 'by Greyson',
  subtitle,
  showWordmark = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const gradRedId = `greyson-logo-red-${uid}`;
  const heightPx = SIZE_PX[size];
  const widthPx = Math.round(heightPx * (88 / 64));
  const resolvedSub = subtitle ?? byLine;

  return (
    <span className="automate-brand-lockup">
      <svg
        className={`automate-logo-mark automate-logo-mark--${size}`}
        width={widthPx}
        height={heightPx}
        viewBox="0 0 88 64"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradRedId}
            x1="10"
            y1="10"
            x2="78"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#D94F48" />
            <stop offset="100%" stopColor="#962721" />
          </linearGradient>
        </defs>

        {/* Open Architectural Registration Crosshairs (+) */}
        <g
          stroke="#D94F48"
          strokeOpacity="0.52"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M10 9H16M13 6V12" />
          <path d="M68 55H74M71 52V58" />
        </g>

        {/* Left Pipeline Input Node */}
        <circle
          cx="5"
          cy="32"
          r="2.5"
          stroke="#D94F48"
          strokeWidth="1.9"
        />
        <path
          d="M7.5 32H12.2"
          stroke={`url(#${gradRedId})`}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Left & Right Code Braces { } */}
        <path
          d="M23 12C18.5 12 16.5 14.4 16.5 18.5V25.5C16.5 28.6 14.6 30.6 11.8 32C14.6 33.4 16.5 35.4 16.5 38.5V45.5C16.5 49.6 18.5 52 23 52"
          stroke={`url(#${gradRedId})`}
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M61 12C65.5 12 67.5 14.4 67.5 18.5V25.5C67.5 28.6 69.4 30.6 72.2 32C69.4 33.4 67.5 35.4 67.5 38.5V45.5C67.5 49.6 65.5 52 61 52"
          stroke={`url(#${gradRedId})`}
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Geometric Monogram 'G' + Pivot Core */}
        <path
          d="M52.5 19.5C49.5 16.2 45.2 14.5 40.5 14.5C31.2 14.5 24.8 21.8 24.8 32C24.8 42.2 31.2 49.5 41 49.5C48.6 49.5 54.2 45 55.6 37.6V32.2H41.5"
          stroke="#18191C"
          strokeWidth="5.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="41.5" cy="32.2" r="2.8" fill={`url(#${gradRedId})`} />

        {/* Right Pipeline Forward Chevrons (>>) */}
        <path
          d="M75 27.5L79.5 32L75 36.5"
          stroke="#D94F48"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M80.5 27.5L85 32L80.5 36.5"
          stroke="#F28B82"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <span className="automate-brand-copy">
          <span className="automate-brand-text">{label}</span>
          {resolvedSub && (
            <span className="automate-brand-sub">
              <span className="automate-brand-dot" aria-hidden="true" />
              <span className="automate-brand-sub-text">
                {renderSubContent(resolvedSub)}
              </span>
            </span>
          )}
        </span>
      )}
    </span>
  );
};
