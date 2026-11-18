import React, { useEffect, useState } from 'react';
import { automateConfig, AutomateLocale } from '../config/automateConfig';
import { trackInteraction } from '../utils/telemetry';
import { capturePostHogEvent } from '../utils/posthogClient';
import { BrandLogo } from './BrandLogo';
import '../styles/automate.css';

export interface InquiryFormPayload {
  subject: string;
  body: string;
  mailtoUrl: string;
}

export const INQUIRY_MAX_LENGTHS = {
  name: 100,
  company: 120,
  contact: 120,
  message: 1500,
} as const;

/**
 * Strips ASCII control characters and enforces an upper character bound.
 */
export function sanitizeInquiryField(
  value: string,
  maxLength: number,
  allowNewlines = false
): string {
  const cleaned = allowNewlines
    ? value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    : value.replace(/[\x00-\x1F\x7F]/g, ' ');
  return cleaned.slice(0, maxLength);
}

/**
 * Builds the subject and body text for a mailto inquiry without side effects.
 */
export function buildInquirySubjectAndBody(params: {
  locale: AutomateLocale;
  name: string;
  company: string;
  contact: string;
  interest: string;
  message: string;
}): { subject: string; body: string } {
  const formCopy = automateConfig.copy[params.locale].form;
  const subjectSuffix = params.company || params.name;
  const subject = `[Automate Friesland] ${params.interest} — ${subjectSuffix}`.slice(
    0,
    200
  );

  const bodyLines = [
    `${formCopy.nameLabel}: ${params.name}`,
    params.company ? `${formCopy.companyLabel}: ${params.company}` : null,
    `${formCopy.contactLabel}: ${params.contact}`,
    `${formCopy.interestLabel}: ${params.interest}`,
    '',
    `${formCopy.messageLabel}:`,
    params.message,
  ].filter((line): line is string => line !== null);

  return { subject, body: bodyLines.join('\n') };
}

/**
 * Copies the formatted inquiry email and address to the clipboard when available.
 */
export async function copyInquiryTextToClipboard(
  subject: string,
  body: string
): Promise<boolean> {
  const clipboardText = `To: ${automateConfig.email}\nSubject: ${subject}\n\n${body}`;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(clipboardText);
      return true;
    }
  } catch {
    // Ignore clipboard permission errors gracefully
  }
  return false;
}

/**
 * Renders the copywriter's direct-email note with an interactive mailto: link.
 */
export function renderDirectEmailNote(
  note: string,
  onDirectClick: () => void
): React.ReactNode {
  const email = automateConfig.email;
  const parts = note.split(email);
  if (parts.length !== 2) {
    return (
      <>
        {note}{' '}
        <a
          href="mailto:grey.beimers@gmail.com"
          className="automate-inline-link"
          onClick={onDirectClick}
        >
          {email}
        </a>
      </>
    );
  }

  return (
    <>
      {parts[0]}
      <a
        href="mailto:grey.beimers@gmail.com"
        className="automate-inline-link"
        onClick={onDirectClick}
      >
        {email}
      </a>
      {parts[1]}
    </>
  );
}

const renderInfographicVisual = (
  id: 'map' | 'build' | 'joy',
  beforeLabel?: string,
  afterLabel?: string,
  oldTag?: string,
  newTag?: string,
  statValue?: string
) => {
  if (id === 'map') {
    return (
      <svg
        className="automate-infographic-svg"
        viewBox="0 0 320 132"
        role="img"
        aria-hidden="true"
      >
        <rect x="6" y="10" width="308" height="112" rx="12" fill="#f7f5f2" />
        {/* Left: tangled routine */}
        <circle cx="40" cy="40" r="10" fill="#d4d7de" />
        <circle cx="52" cy="86" r="10" fill="#d4d7de" />
        <circle cx="96" cy="54" r="10" fill="#d4d7de" />
        <path
          d="M40 40 C75 20, 30 98, 96 54 M52 86 C70 40, 82 95, 96 54"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2.2"
          strokeDasharray="4 4"
        />
        <text
          x="64"
          y="112"
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="700"
          fill="#5c606b"
        >
          {beforeLabel ?? 'Mail / Excel'}
        </text>
        {/* Bridge arrow */}
        <path
          d="M126 64 L164 64 M156 56 L165 64 L156 72"
          fill="none"
          stroke="#b83730"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right: clear structured flow */}
        <rect
          x="180"
          y="34"
          width="116"
          height="58"
          rx="10"
          fill="#ffffff"
          stroke="#b83730"
          strokeWidth="1.8"
        />
        <circle cx="204" cy="63" r="8" fill="#b83730" />
        <line
          x1="212"
          y1="63"
          x2="230"
          y2="63"
          stroke="#b83730"
          strokeWidth="2.4"
        />
        <circle cx="238" cy="63" r="8" fill="#18191c" />
        <line
          x1="246"
          y1="63"
          x2="264"
          y2="63"
          stroke="#18191c"
          strokeWidth="2.4"
        />
        <circle cx="272" cy="63" r="8" fill="#b83730" />
        <text
          x="238"
          y="112"
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="700"
          fill="#962721"
        >
          {afterLabel ?? 'Helder proces'}
        </text>
      </svg>
    );
  }

  if (id === 'build') {
    return (
      <svg
        className="automate-infographic-svg"
        viewBox="0 0 320 132"
        role="img"
        aria-hidden="true"
      >
        <rect x="6" y="10" width="308" height="112" rx="12" fill="#f7f5f2" />
        {/* Old < 2025 bar */}
        <text x="24" y="34" fontSize="11" fontWeight="700" fill="#5c606b">
          {oldTag ?? '< 2025: 6–12 wkn'}
        </text>
        <rect x="24" y="42" width="272" height="16" rx="8" fill="#dcdfe6" />
        <line
          x1="26"
          y1="50"
          x2="292"
          y2="50"
          stroke="#8c919b"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        {/* 2026 fast bar */}
        <text x="24" y="82" fontSize="11.5" fontWeight="800" fill="#962721">
          {newTag ?? '2026: 1 middag/dag'}
        </text>
        <rect x="24" y="90" width="272" height="18" rx="9" fill="#ece7e1" />
        <rect x="24" y="90" width="64" height="18" rx="9" fill="#b83730" />
        <path
          d="M104 99 L282 99"
          stroke="#b83730"
          strokeWidth="2"
          strokeDasharray="3 5"
        />
        <circle cx="288" cy="99" r="5" fill="#18191c" />
      </svg>
    );
  }

  return (
    <svg
      className="automate-infographic-svg"
      viewBox="0 0 320 132"
      role="img"
      aria-hidden="true"
    >
      <rect x="6" y="10" width="308" height="112" rx="12" fill="#f7f5f2" />
      {/* Chart grid lines */}
      <line x1="24" y1="34" x2="296" y2="34" stroke="#e4dfd9" strokeWidth="1" />
      <line x1="24" y1="64" x2="296" y2="64" stroke="#e4dfd9" strokeWidth="1" />
      <line x1="24" y1="94" x2="296" y2="94" stroke="#e4dfd9" strokeWidth="1" />
      {/* Manual busywork dropping curve */}
      <path
        d="M32 34 C96 36, 136 86, 224 92 L288 94"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2.5"
        strokeDasharray="5 4"
      />
      {/* Joy / efficiency rising curve */}
      <path
        d="M32 90 C102 86, 148 40, 224 32 L288 28"
        fill="none"
        stroke="#b83730"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="288" cy="28" r="5.5" fill="#b83730" />
      <circle cx="288" cy="94" r="4.5" fill="#9ca3af" />
      <rect x="172" y="98" width="124" height="20" rx="10" fill="#18191c" />
      <text
        x="234"
        y="112"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="700"
        fill="#ffffff"
      >
        {statValue ?? '-80% handwerk'}
      </text>
    </svg>
  );
};

interface AutomatePageProps {
  lang?: AutomateLocale;
  onLocaleChange?: (nextLang: AutomateLocale) => void;
  onOpenAbout?: () => void;
  onOpenDashboard?: () => void;
}

export const AutomatePage: React.FC<AutomatePageProps> = ({
  lang: controlledLang,
  onLocaleChange,
  onOpenAbout,
  onOpenDashboard,
}) => {
  const [internalLang, setInternalLang] = useState<AutomateLocale>('nl');
  const lang = controlledLang ?? internalLang;

  const t = automateConfig.copy[lang];

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    t.heroShowcase.scenarios[0].id
  );
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [interestIndex, setInterestIndex] = useState(0);
  const [interest, setInterest] = useState<string>(t.form.interestOptions[0]);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [submitted, setSubmitted] = useState<InquiryFormPayload | null>(null);
  const [copied, setCopied] = useState(false);

  const activeScenario =
    t.heroShowcase.scenarios.find((s) => s.id === selectedScenarioId) ??
    t.heroShowcase.scenarios[0];

  const isGreysonProd =
    typeof window !== 'undefined' &&
    (window.location.hostname.toLowerCase() === 'greyson.nl' ||
      window.location.hostname.toLowerCase().endsWith('.greyson.nl'));

  const aboutHref = isGreysonProd ? automateConfig.aboutPath : '?site=about';
  const dashboardHref = isGreysonProd
    ? automateConfig.dashboardPath
    : '?site=dashboard';

  useEffect(() => {
    const previousLang = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previousLang || 'en';
    };
  }, [lang]);

  useEffect(() => {
    setInterest(
      automateConfig.copy[lang].form.interestOptions[interestIndex] ??
        automateConfig.copy[lang].form.interestOptions[0]
    );
  }, [lang, interestIndex]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.automate-reveal'));
    if (nodes.length === 0) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [lang]);

  const handleSectionScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
    targetLabel: string
  ) => {
    e.preventDefault();
    const target = document.getElementById(sectionId);
    if (target) {
      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      target.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start',
      });
      if (window.history?.pushState) {
        window.history.pushState(null, '', `#${sectionId}`);
      }
    }
    trackInteraction('automate_nav_scroll', { target: targetLabel, lang });
    capturePostHogEvent('automate_nav_scroll', { target: targetLabel, lang });
  };

  const handleLocaleChange = (nextLang: AutomateLocale) => {
    if (nextLang === lang) return;
    if (onLocaleChange) {
      onLocaleChange(nextLang);
    } else {
      setInternalLang(nextLang);
    }
    setHasError(false);
    trackInteraction('automate_language_toggle', { lang: nextLang });
    capturePostHogEvent('automate_language_toggle', { lang: nextLang });
  };

  const handleInternalRoute = (
    e: React.MouseEvent<HTMLAnchorElement>,
    target: 'about' | 'dashboard',
    callback?: () => void
  ) => {
    trackInteraction('automate_nav_click', { target, lang });
    capturePostHogEvent('automate_link_click', { target, lang });

    const isNormalLeftClick =
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      e.button === 0;

    if (isNormalLeftClick && callback) {
      e.preventDefault();
      callback();
    }
  };

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    trackInteraction('automate_scenario_select', { scenarioId, lang });
    capturePostHogEvent('automate_scenario_select', { scenarioId, lang });
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = e.target.selectedIndex;
    const safeIdx = idx >= 0 && idx < t.form.interestOptions.length ? idx : 0;
    setInterestIndex(safeIdx);
    setInterest(t.form.interestOptions[safeIdx]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanName = sanitizeInquiryField(name, INQUIRY_MAX_LENGTHS.name).trim();
    const cleanCompany = sanitizeInquiryField(
      company,
      INQUIRY_MAX_LENGTHS.company
    ).trim();
    const cleanContact = sanitizeInquiryField(
      contact,
      INQUIRY_MAX_LENGTHS.contact
    ).trim();
    const cleanMessage = sanitizeInquiryField(
      message,
      INQUIRY_MAX_LENGTHS.message,
      true
    )
      .replace(/\r\n/g, '\n')
      .trim();

    if (!cleanName || !cleanContact || !cleanMessage) {
      setHasError(true);
      setSubmitted(null);
      return;
    }

    setHasError(false);

    const safeInterest =
      t.form.interestOptions[interestIndex] ?? interest ?? t.form.interestOptions[0];

    const { subject, body } = buildInquirySubjectAndBody({
      locale: lang,
      name: cleanName,
      company: cleanCompany,
      contact: cleanContact,
      interest: safeInterest,
      message: cleanMessage,
    });

    const mailtoUrl = `mailto:${automateConfig.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Record only non-PII metadata (selected interest category & locale)
    trackInteraction('automate_inquiry_submit', {
      interest: safeInterest,
      lang,
    });
    capturePostHogEvent('automate_inquiry_submit', {
      interest: safeInterest,
      lang,
    });

    setSubmitted({ subject, body, mailtoUrl });
    setCopied(false);
    window.location.href = mailtoUrl;
  };

  const handleCopyFallback = async () => {
    if (!submitted) return;
    const ok = await copyInquiryTextToClipboard(submitted.subject, submitted.body);
    if (ok) {
      setCopied(true);
      trackInteraction('automate_copy_fallback', { lang });
      capturePostHogEvent('automate_copy_fallback', { lang });
    }
  };

  return (
    <div className="automate-scroll-root">
      <header className="automate-header">
        <div className="automate-header-inner">
          <nav className="automate-nav" aria-label="Primary navigation">
            <a
              href="#overzicht"
              className="automate-brand"
              onClick={(e) => handleSectionScroll(e, 'overzicht', 'brand_top')}
            >
              <BrandLogo label={t.nav.brand} />
            </a>

            <div className="automate-nav-actions">
              <div className="automate-nav-links">
                <a
                  href="#diensten"
                  className="automate-nav-link"
                  onClick={(e) => handleSectionScroll(e, 'diensten', 'nav_diensten')}
                >
                  {t.nav.servicesLabel}
                </a>
                <a
                  href="#automate-usecases"
                  className="automate-nav-link"
                  onClick={(e) =>
                    handleSectionScroll(e, 'automate-usecases', 'nav_usecases')
                  }
                >
                  {t.nav.useCasesLabel}
                </a>
                <a
                  href="#werkwijze"
                  className="automate-nav-link"
                  onClick={(e) => handleSectionScroll(e, 'werkwijze', 'nav_werkwijze')}
                >
                  {t.nav.processLabel}
                </a>
                <a
                  href={aboutHref}
                  className="automate-nav-link"
                  onClick={(e) => handleInternalRoute(e, 'about', onOpenAbout)}
                >
                  {t.nav.aboutLabel}
                </a>
                <a
                  href="#automate-contact"
                  className="automate-nav-link"
                  onClick={(e) =>
                    handleSectionScroll(e, 'automate-contact', 'nav_contact')
                  }
                >
                  {t.nav.contactLabel}
                </a>
                <a
                  href={dashboardHref}
                  className="automate-back-link"
                  onClick={(e) =>
                    handleInternalRoute(e, 'dashboard', onOpenDashboard)
                  }
                >
                  {t.nav.dashboardLabel}
                </a>
              </div>

              <div
                className="automate-lang-switch"
                role="group"
                aria-label={t.nav.languageLabel}
              >
                <button
                  type="button"
                  className={`automate-lang-btn ${lang === 'nl' ? 'is-active' : ''}`}
                  onClick={() => handleLocaleChange('nl')}
                  aria-pressed={lang === 'nl'}
                >
                  NL
                </button>
                <button
                  type="button"
                  className={`automate-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
                  onClick={() => handleLocaleChange('en')}
                  aria-pressed={lang === 'en'}
                >
                  EN
                </button>
              </div>

              <a
                href="#automate-contact"
                className="automate-btn automate-btn-primary automate-nav-cta"
                onClick={(e) => {
                  handleSectionScroll(e, 'automate-contact', 'header_contact');
                  trackInteraction('automate_cta_click', {
                    target: 'header_contact',
                    lang,
                  });
                  capturePostHogEvent('automate_cta_click', {
                    target: 'header_contact',
                    lang,
                  });
                }}
              >
                {t.hero.primaryCta}
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main id="main-content">
        {/* Band 1: Visual-First Split Hero + < 2025 vs 2026 Interactive Flow Diagram */}
        <section id="overzicht" className="automate-band automate-band--hero">
          <div className="automate-band-inner">
            <div className="automate-hero-split">
              <div className="automate-hero-copy">
                <div className="automate-eyebrow">{t.hero.badge}</div>
                <h1 className="automate-h1">{t.hero.title}</h1>
                <p className="automate-subtitle">{t.hero.subtitle}</p>
                <div className="automate-cta-row">
                  <a
                    href="#automate-contact"
                    className="automate-btn automate-btn-primary"
                    onClick={(e) => {
                      handleSectionScroll(e, 'automate-contact', 'hero_contact');
                      trackInteraction('automate_cta_click', {
                        target: 'hero_contact',
                        lang,
                      });
                      capturePostHogEvent('automate_cta_click', {
                        target: 'hero_contact',
                        lang,
                      });
                    }}
                  >
                    {t.hero.primaryCta}
                  </a>
                  <a
                    href="#diensten"
                    className="automate-btn automate-btn-secondary"
                    onClick={(e) => {
                      handleSectionScroll(e, 'diensten', 'hero_services');
                      trackInteraction('automate_cta_click', {
                        target: 'hero_services',
                        lang,
                      });
                      capturePostHogEvent('automate_cta_click', {
                        target: 'hero_services',
                        lang,
                      });
                    }}
                  >
                    {t.hero.secondaryCta}
                  </a>
                </div>

                {/* Compact 3-Step Visual Mission Strip */}
                <div
                  className="automate-hero-visual-strip"
                  aria-label="Mission summary"
                >
                  {t.hero.missionStrip.map((item, idx) => (
                    <React.Fragment key={item.step}>
                      <div className="automate-strip-item">
                        <span className="automate-strip-icon" aria-hidden="true">
                          {idx === 0 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <circle cx="11" cy="11" r="7" />
                              <path d="M21 21l-4.35-4.35" />
                            </svg>
                          )}
                          {idx === 1 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                          )}
                          {idx === 2 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                        <span className="automate-strip-text">{item.label}</span>
                      </div>
                      {idx < t.hero.missionStrip.length - 1 && (
                        <span className="automate-strip-arrow" aria-hidden="true">
                          →
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <aside
                className="automate-hero-showcase"
                aria-label={t.heroShowcase.kicker}
              >
                <div className="automate-showcase-head">
                  <span className="automate-kicker">{t.heroShowcase.kicker}</span>
                  <p className="automate-showcase-caption">
                    {t.heroShowcase.caption}
                  </p>
                </div>

                {/* < 2025 vs 2026 Visual Shift Comparison */}
                <div className="automate-era-grid">
                  <div className="automate-era-card is-before">
                    <div className="automate-era-top">
                      <span className="automate-era-tag">
                        {t.heroShowcase.eraBefore.tag}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </div>
                    <strong className="automate-era-title">
                      {t.heroShowcase.eraBefore.title}
                    </strong>
                    <span className="automate-era-detail">
                      {t.heroShowcase.eraBefore.detail}
                    </span>
                  </div>

                  <div className="automate-era-card is-now">
                    <div className="automate-era-top">
                      <span className="automate-era-tag">
                        {t.heroShowcase.eraNow.tag}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        aria-hidden="true"
                      >
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    <strong className="automate-era-title">
                      {t.heroShowcase.eraNow.title}
                    </strong>
                    <span className="automate-era-detail">
                      {t.heroShowcase.eraNow.detail}
                    </span>
                  </div>
                </div>

                {/* Interactive Workflow Scenario Tabs */}
                <div
                  className="automate-showcase-tabs"
                  role="tablist"
                  aria-label={t.heroShowcase.kicker}
                >
                  {t.heroShowcase.scenarios.map((scenario) => {
                    const isActive = scenario.id === activeScenario.id;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        role="tab"
                        id={`showcase-tab-${scenario.id}`}
                        aria-selected={isActive}
                        aria-controls="hero-showcase-panel"
                        className={`automate-showcase-tab ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleScenarioSelect(scenario.id)}
                      >
                        {scenario.tab}
                      </button>
                    );
                  })}
                </div>

                {/* Visual Node Flow Diagram */}
                <div
                  key={activeScenario.id}
                  id="hero-showcase-panel"
                  className="automate-showcase-panel"
                  role="tabpanel"
                  aria-labelledby={`showcase-tab-${activeScenario.id}`}
                >
                  <h2 className="automate-showcase-headline">
                    {activeScenario.headline}
                  </h2>

                  <div className="automate-visual-flow-diagram">
                    <div className="automate-flow-node is-before">
                      <div className="automate-flow-node-top">
                        <span className="automate-flow-label">
                          {t.heroShowcase.inputLabel}
                        </span>
                        <span className="automate-flow-duration">
                          {activeScenario.oldDuration}
                        </span>
                      </div>
                      <div className="automate-flow-pills">
                        {activeScenario.oldFlow.map((step, idx) => (
                          <React.Fragment key={step}>
                            <span className="automate-flow-pill is-muted">
                              {step}
                            </span>
                            {idx < activeScenario.oldFlow.length - 1 && (
                              <span
                                className="automate-flow-sep"
                                aria-hidden="true"
                              >
                                →
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="automate-flow-bridge">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        aria-hidden="true"
                      >
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                      <span className="automate-bridge-pill">
                        {activeScenario.buildTime}
                      </span>
                      <span className="automate-bridge-text">
                        {activeScenario.engine}
                      </span>
                    </div>

                    <div className="automate-flow-node is-accent">
                      <div className="automate-flow-node-top">
                        <span className="automate-flow-label">
                          {t.heroShowcase.outputLabel}
                        </span>
                        <span className="automate-flow-duration is-accent">
                          {activeScenario.newDuration}
                        </span>
                      </div>
                      <div className="automate-flow-pills">
                        {activeScenario.newFlow.map((step, idx) => (
                          <React.Fragment key={step}>
                            <span className="automate-flow-pill is-accent">
                              {step}
                            </span>
                            {idx < activeScenario.newFlow.length - 1 && (
                              <span
                                className="automate-flow-sep"
                                aria-hidden="true"
                              >
                                →
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="automate-showcase-metric">
                    <span className="automate-metric-label">
                      {t.heroShowcase.metricLabel}
                    </span>
                    <span className="automate-metric-value">
                      {activeScenario.metric}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Band 2: Full-Bleed White Visual Blueprint Infographic + Comparison */}
        <section id="diensten" className="automate-band automate-band--white">
          <div className="automate-band-inner">
            <div className="automate-band-header automate-reveal">
              <span className="automate-eyebrow">{t.services.eyebrow}</span>
              <h2 className="automate-h2">{t.services.title}</h2>
              {t.services.intro ? (
                <p className="automate-lead">{t.services.intro}</p>
              ) : null}
            </div>

            {/* 3-Panel Visual SVG Infographic */}
            <div className="automate-infographic-grid">
              {t.services.infographicPanels.map((panel) => (
                <article
                  key={panel.id}
                  className="automate-infographic-card automate-reveal"
                >
                  <span className="automate-kicker">{panel.step}</span>
                  <h3 className="automate-h3">{panel.title}</h3>
                  {renderInfographicVisual(
                    panel.id,
                    'beforeLabel' in panel ? panel.beforeLabel : undefined,
                    'afterLabel' in panel ? panel.afterLabel : undefined,
                    'oldTag' in panel ? panel.oldTag : undefined,
                    'newTag' in panel ? panel.newTag : undefined,
                    'statValue' in panel ? panel.statValue : undefined
                  )}
                  <p className="automate-prose">{panel.caption}</p>
                </article>
              ))}
            </div>

            <div className="automate-services-split">
              <article className="automate-service-pillar automate-reveal">
                <span className="automate-kicker">
                  {t.services.automationEyebrow}
                </span>
                <h3 className="automate-h3">{t.services.automationTitle}</h3>
                <p className="automate-prose">{t.services.automationBody}</p>

                <div
                  className="automate-pipeline"
                  aria-label={t.services.automationEyebrow}
                >
                  {t.services.automationPipeline.map((stage, idx) => (
                    <div key={stage.stage} className="automate-pipeline-stage">
                      <div className="automate-pipeline-marker" aria-hidden="true">
                        <span className="automate-pipeline-dot" />
                        {idx < t.services.automationPipeline.length - 1 && (
                          <span className="automate-pipeline-connector" />
                        )}
                      </div>
                      <div className="automate-pipeline-body">
                        <span className="automate-pipeline-badge">
                          {stage.badge}
                        </span>
                        <span className="automate-pipeline-name">
                          {stage.stage}
                        </span>
                        <span className="automate-pipeline-detail">
                          {stage.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="automate-service-pillar automate-reveal">
                <span className="automate-kicker">
                  {t.services.softwareEyebrow}
                </span>
                <h3 className="automate-h3">{t.services.softwareTitle}</h3>
                <p className="automate-prose">{t.services.softwareBody}</p>

                <div
                  className="automate-comparison"
                  aria-label={t.services.softwareEyebrow}
                >
                  {t.services.softwareComparison.map((row) => (
                    <div
                      key={row.label}
                      className={`automate-comparison-row ${
                        row.tone === 'accent'
                          ? 'is-accent'
                          : row.tone === 'result'
                            ? 'is-result'
                            : 'is-muted'
                      }`}
                    >
                      <div className="automate-comparison-meta">
                        <span className="automate-comparison-label">
                          {row.label}
                        </span>
                        <span className="automate-comparison-value">
                          {row.value}
                        </span>
                      </div>
                      <div className="automate-comparison-track" aria-hidden="true">
                        <div className="automate-comparison-fill" />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Band 3: Visual Before -> After Flow Cards Grid */}
        <section
          id="automate-usecases"
          className="automate-band automate-band--stone"
        >
          <div className="automate-band-inner">
            <div className="automate-band-header automate-reveal">
              <span className="automate-eyebrow">{t.useCases.eyebrow}</span>
              <h2 className="automate-h2">{t.useCases.title}</h2>
              <p className="automate-lead">{t.useCases.intro}</p>
            </div>

            <div className="automate-case-visual-grid">
              {t.useCases.items.map((item) => (
                <article
                  key={item.id}
                  className="automate-case-row is-card automate-reveal"
                >
                  <div className="automate-case-top">
                    <span className="automate-case-tag">{item.tag}</span>
                    <span className="automate-ba-badge">{item.buildBadge}</span>
                  </div>

                  <h3 className="automate-h3">{item.title}</h3>
                  <blockquote className="automate-case-quote">
                    {item.situation}
                  </blockquote>

                  {/* Before -> After Visual Flow Diagram */}
                  <div className="automate-ba-diagram">
                    <div className="automate-ba-row is-before">
                      <span className="automate-ba-row-label">
                        {item.oldWayLabel}
                      </span>
                      <div className="automate-ba-steps">
                        {item.oldSteps.map((step, idx) => (
                          <React.Fragment key={step}>
                            <span className="automate-ba-node">{step}</span>
                            {idx < item.oldSteps.length - 1 && (
                              <span className="automate-ba-arrow" aria-hidden="true">
                                →
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="automate-ba-row is-after">
                      <span className="automate-ba-row-label">
                        {item.newWayLabel}
                      </span>
                      <div className="automate-ba-steps">
                        {item.newSteps.map((step, idx) => (
                          <React.Fragment key={step}>
                            <span className="automate-ba-node">{step}</span>
                            {idx < item.newSteps.length - 1 && (
                              <span className="automate-ba-arrow" aria-hidden="true">
                                →
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="automate-prose">{item.narrative}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Band 4: Full-Bleed Dark Charcoal Visual Mission & 3-Step Timeline */}
        <section id="werkwijze" className="automate-band automate-band--dark">
          <div className="automate-band-inner">
            <div className="automate-story-split">
              <div className="automate-story-narrative automate-reveal">
                <span className="automate-eyebrow automate-eyebrow--light">
                  {t.story.eyebrow}
                </span>
                <h2 className="automate-h2 automate-h2--light">
                  {t.story.title}
                </h2>
                <div className="automate-story-paragraphs">
                  {t.story.paragraphs.map((paragraph, idx) => (
                    <p key={idx} className="automate-prose automate-prose--light">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Visual Impact Shift Graphic on Dark Ground */}
                <div className="automate-dark-shift-card">
                  <span className="automate-kicker automate-kicker--light">
                    {t.story.shiftCard.title}
                  </span>
                  <div className="automate-dark-shift-bars">
                    <div className="automate-dark-bar is-old">
                      <div className="automate-dark-bar-meta">
                        <span>{t.story.shiftCard.oldLabel}</span>
                        <span>{t.story.shiftCard.oldStat}</span>
                      </div>
                      <div className="automate-dark-bar-track" aria-hidden="true">
                        <div className="automate-dark-bar-fill" />
                      </div>
                    </div>
                    <div className="automate-dark-bar is-new">
                      <div className="automate-dark-bar-meta">
                        <span>{t.story.shiftCard.newLabel}</span>
                        <span>{t.story.shiftCard.newStat}</span>
                      </div>
                      <div className="automate-dark-bar-track" aria-hidden="true">
                        <div className="automate-dark-bar-fill" />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="automate-story-region">{t.story.regionLine}</p>
              </div>

              <div className="automate-story-timeline-col automate-reveal">
                <h3 className="automate-kicker automate-kicker--light">
                  {t.story.processTitle}
                </h3>
                <ol className="automate-timeline">
                  {t.story.steps.map((step) => (
                    <li key={step.phase} className="automate-timeline-item">
                      <span
                        className="automate-timeline-node"
                        aria-hidden="true"
                      />
                      <div className="automate-timeline-head">
                        <span className="automate-timeline-phase">
                          {step.phase}
                        </span>
                        <span className="automate-timeline-badge">
                          {step.badge}
                        </span>
                      </div>
                      <h4 className="automate-timeline-title">{step.title}</h4>
                      <p className="automate-timeline-text">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Band 5: Warm Tint Founder Teaser Banner */}
        <section id="over-mij" className="automate-band automate-band--tint">
          <div className="automate-band-inner">
            <div className="automate-teaser-banner automate-reveal">
              <div className="automate-teaser-copy">
                <span className="automate-eyebrow">{t.aboutTeaser.eyebrow}</span>
                <h2 className="automate-h2">{t.aboutTeaser.title}</h2>
                <p className="automate-prose">{t.aboutTeaser.summary}</p>
              </div>
              <div className="automate-teaser-action">
                <a
                  href={aboutHref}
                  className="automate-btn automate-btn-primary"
                  onClick={(e) => handleInternalRoute(e, 'about', onOpenAbout)}
                >
                  {t.aboutTeaser.ctaLabel}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Band 6: Full-Bleed White Asymmetric Direct Contact + Interactive Inquiry Form */}
        <section
          id="automate-contact"
          className="automate-band automate-band--white"
        >
          <div className="automate-band-inner">
            <div className="automate-contact-split">
              <div className="automate-contact-info automate-reveal">
                <span className="automate-eyebrow">{t.form.eyebrow}</span>
                <h2 className="automate-h2">{t.form.title}</h2>
                <p className="automate-prose">{t.form.subtitle}</p>

                <div className="automate-contact-details">
                  <div className="automate-contact-detail">
                    <span className="automate-detail-label">
                      {t.aboutPage.emailLabel}
                    </span>
                    <a
                      href="mailto:grey.beimers@gmail.com"
                      className="automate-detail-link"
                      onClick={() => {
                        trackInteraction('automate_direct_email_click', {
                          lang,
                          source: 'contact_band',
                        });
                        capturePostHogEvent('automate_direct_email_click', {
                          lang,
                          source: 'contact_band',
                        });
                      }}
                    >
                      {automateConfig.email}
                    </a>
                  </div>

                  <div className="automate-contact-detail">
                    <span className="automate-detail-label">
                      {t.aboutPage.linkedinLabel}
                    </span>
                    <a
                      href={automateConfig.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="automate-detail-link"
                      onClick={() => {
                        trackInteraction('automate_linkedin_click', {
                          lang,
                          source: 'contact_band',
                        });
                        capturePostHogEvent('automate_linkedin_click', {
                          lang,
                          source: 'contact_band',
                        });
                      }}
                    >
                      Greyson Beimers — LinkedIn
                    </a>
                  </div>

                  <div className="automate-contact-detail">
                    <span className="automate-detail-label">
                      {t.aboutPage.locationLabel}
                    </span>
                    <p className="automate-detail-value">
                      {automateConfig.cities.join(' · ')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="automate-contact-form-wrap automate-reveal">
                <form
                  className="automate-form-panel"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="automate-form-grid">
                    <div className="automate-field">
                      <label htmlFor="automate-name" className="automate-label">
                        {t.form.nameLabel} *
                      </label>
                      <input
                        id="automate-name"
                        name="name"
                        type="text"
                        required
                        maxLength={INQUIRY_MAX_LENGTHS.name}
                        autoComplete="name"
                        className="automate-input"
                        placeholder={t.form.namePlaceholder}
                        value={name}
                        onChange={(e) =>
                          setName(
                            sanitizeInquiryField(
                              e.target.value,
                              INQUIRY_MAX_LENGTHS.name
                            )
                          )
                        }
                      />
                    </div>

                    <div className="automate-field">
                      <label
                        htmlFor="automate-company"
                        className="automate-label"
                      >
                        {t.form.companyLabel}
                      </label>
                      <input
                        id="automate-company"
                        name="company"
                        type="text"
                        maxLength={INQUIRY_MAX_LENGTHS.company}
                        autoComplete="organization"
                        className="automate-input"
                        placeholder={t.form.companyPlaceholder}
                        value={company}
                        onChange={(e) =>
                          setCompany(
                            sanitizeInquiryField(
                              e.target.value,
                              INQUIRY_MAX_LENGTHS.company
                            )
                          )
                        }
                      />
                    </div>

                    <div className="automate-field">
                      <label
                        htmlFor="automate-contact-input"
                        className="automate-label"
                      >
                        {t.form.contactLabel} *
                      </label>
                      <input
                        id="automate-contact-input"
                        name="contact"
                        type="text"
                        required
                        maxLength={INQUIRY_MAX_LENGTHS.contact}
                        autoComplete="email"
                        className="automate-input"
                        placeholder={t.form.contactPlaceholder}
                        value={contact}
                        onChange={(e) =>
                          setContact(
                            sanitizeInquiryField(
                              e.target.value,
                              INQUIRY_MAX_LENGTHS.contact
                            )
                          )
                        }
                      />
                    </div>

                    <div className="automate-field">
                      <label
                        htmlFor="automate-interest"
                        className="automate-label"
                      >
                        {t.form.interestLabel}
                      </label>
                      <select
                        id="automate-interest"
                        name="interest"
                        className="automate-select"
                        value={interest}
                        onChange={handleInterestChange}
                      >
                        {t.form.interestOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="automate-field is-full">
                      <label
                        htmlFor="automate-message"
                        className="automate-label"
                      >
                        {t.form.messageLabel} *
                      </label>
                      <textarea
                        id="automate-message"
                        name="message"
                        required
                        maxLength={INQUIRY_MAX_LENGTHS.message}
                        className="automate-textarea"
                        placeholder={t.form.messagePlaceholder}
                        value={message}
                        onChange={(e) =>
                          setMessage(
                            sanitizeInquiryField(
                              e.target.value,
                              INQUIRY_MAX_LENGTHS.message,
                              true
                            )
                          )
                        }
                      />
                    </div>
                  </div>

                  {hasError && (
                    <div className="automate-error-text" role="alert">
                      {t.form.validationError}
                    </div>
                  )}

                  <div className="automate-form-footer">
                    <button
                      type="submit"
                      className="automate-btn automate-btn-primary"
                    >
                      {t.form.submitButton}
                    </button>
                    <p className="automate-direct-note">
                      {renderDirectEmailNote(t.form.directEmailNote, () => {
                        trackInteraction('automate_direct_email_click', { lang });
                        capturePostHogEvent('automate_direct_email_click', {
                          lang,
                        });
                      })}
                    </p>
                  </div>

                  {submitted && (
                    <div className="automate-success-box" role="status">
                      <strong>{t.form.submittedTitle}</strong>
                      <p>{t.form.submittedDescription}</p>
                      <div className="automate-success-actions">
                        <a
                          href={submitted.mailtoUrl}
                          className="automate-btn automate-btn-primary"
                        >
                          {t.form.submitButton}
                        </a>
                        <button
                          type="button"
                          className="automate-btn automate-btn-secondary"
                          onClick={handleCopyFallback}
                        >
                          {t.form.copyFallbackButton}
                        </button>
                      </div>
                      {copied && (
                        <div className="automate-copy-status">
                          {t.form.copiedNotice}
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="automate-band automate-band--footer">
        <div className="automate-band-inner automate-footer-inner">
          <div className="automate-footer-brand">
            <BrandLogo size="sm" label={t.nav.brand} />
            <p className="automate-footer-note">{t.footer.note}</p>
          </div>
          <div className="automate-footer-links">
            <a
              href={aboutHref}
              className="automate-nav-link"
              onClick={(e) => handleInternalRoute(e, 'about', onOpenAbout)}
            >
              {t.footer.aboutLinkLabel}
            </a>
            <a
              href={dashboardHref}
              className="automate-nav-link"
              onClick={(e) =>
                handleInternalRoute(e, 'dashboard', onOpenDashboard)
              }
            >
              {t.nav.dashboardLabel}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
