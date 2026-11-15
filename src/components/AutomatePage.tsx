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
  const [interest, setInterest] = useState<string>(
    t.form.interestOptions[0]
  );
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
            <a href="#overzicht" className="automate-brand">
              <BrandLogo label={t.nav.brand} />
            </a>

            <div className="automate-nav-actions">
              <div className="automate-nav-links">
                <a href="#diensten" className="automate-nav-link">
                  {t.nav.servicesLabel}
                </a>
                <a href="#automate-usecases" className="automate-nav-link">
                  {t.nav.useCasesLabel}
                </a>
                <a href="#werkwijze" className="automate-nav-link">
                  {t.nav.processLabel}
                </a>
                <a
                  href={aboutHref}
                  className="automate-nav-link"
                  onClick={(e) => handleInternalRoute(e, 'about', onOpenAbout)}
                >
                  {t.nav.aboutLabel}
                </a>
                <a href="#automate-contact" className="automate-nav-link">
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
                onClick={() => {
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
        {/* Band 1: Full-Bleed Warm Editorial Split Hero + Interactive Live Workflow Preview */}
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
                    onClick={() => {
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
                    onClick={() => {
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

                <div
                  id="hero-showcase-panel"
                  className="automate-showcase-panel"
                  role="tabpanel"
                  aria-labelledby={`showcase-tab-${activeScenario.id}`}
                >
                  <h2 className="automate-showcase-headline">
                    {activeScenario.headline}
                  </h2>

                  <div className="automate-showcase-flow">
                    <div className="automate-flow-node">
                      <span className="automate-flow-label">
                        {t.heroShowcase.inputLabel}
                      </span>
                      <p className="automate-flow-text">{activeScenario.input}</p>
                    </div>

                    <div className="automate-flow-node is-accent">
                      <span className="automate-flow-label">
                        {t.heroShowcase.engineLabel}
                      </span>
                      <p className="automate-flow-text">{activeScenario.engine}</p>
                    </div>

                    <div className="automate-flow-node">
                      <span className="automate-flow-label">
                        {t.heroShowcase.outputLabel}
                      </span>
                      <p className="automate-flow-text">{activeScenario.output}</p>
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

        {/* Band 2: Full-Bleed White Asymmetric Capabilities Band */}
        <section id="diensten" className="automate-band automate-band--white">
          <div className="automate-band-inner">
            <div className="automate-band-header">
              <span className="automate-eyebrow">{t.services.eyebrow}</span>
              <h2 className="automate-h2">{t.services.title}</h2>
              <p className="automate-lead">{t.services.intro}</p>
            </div>

            <div className="automate-services-split">
              <article className="automate-service-pillar">
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

              <article className="automate-service-pillar">
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
                        row.tone === 'accent' ? 'is-accent' : 'is-muted'
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

        {/* Band 3: Horizontal Editorial Case Study Rows on Warm Stone */}
        <section
          id="automate-usecases"
          className="automate-band automate-band--stone"
        >
          <div className="automate-band-inner">
            <div className="automate-band-header">
              <span className="automate-eyebrow">{t.useCases.eyebrow}</span>
              <h2 className="automate-h2">{t.useCases.title}</h2>
              <p className="automate-lead">{t.useCases.intro}</p>
            </div>

            <div className="automate-case-list">
              {t.useCases.items.map((item) => (
                <article key={item.id} className="automate-case-row">
                  <div className="automate-case-quote-col">
                    <span className="automate-case-tag">{item.tag}</span>
                    <blockquote className="automate-case-quote">
                      {item.situation}
                    </blockquote>
                  </div>
                  <div className="automate-case-solution-col">
                    <h3 className="automate-h3">{item.title}</h3>
                    <p className="automate-prose">{item.narrative}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Band 4: Full-Bleed Dark Charcoal Editorial Story & Vertical Collaboration Timeline */}
        <section id="werkwijze" className="automate-band automate-band--dark">
          <div className="automate-band-inner">
            <div className="automate-story-split">
              <div className="automate-story-narrative">
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
                <p className="automate-story-region">{t.story.regionLine}</p>
              </div>

              <div className="automate-story-timeline-col">
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
                      <span className="automate-timeline-phase">
                        {step.phase}
                      </span>
                      <h4 className="automate-timeline-title">{step.title}</h4>
                      <p className="automate-timeline-text">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Band 5: Warm Tint Asymmetric Founder Teaser Banner */}
        <section id="over-mij" className="automate-band automate-band--tint">
          <div className="automate-band-inner">
            <div className="automate-teaser-banner">
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
              <div className="automate-contact-info">
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

              <div className="automate-contact-form-wrap">
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
