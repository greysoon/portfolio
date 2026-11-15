import React, { useEffect, useState } from 'react';
import { automateConfig, AutomateLocale } from '../config/automateConfig';
import { trackInteraction } from '../utils/telemetry';
import { capturePostHogEvent } from '../utils/posthogClient';
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

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [interestIndex, setInterestIndex] = useState(0);
  const [interest, setInterest] = useState<string>(
    automateConfig.copy[lang].form.interestOptions[0]
  );
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [submitted, setSubmitted] = useState<InquiryFormPayload | null>(null);
  const [copied, setCopied] = useState(false);

  const t = automateConfig.copy[lang];

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
      <div className="automate-container">
        <header>
          <nav className="automate-nav" aria-label="Primary navigation">
            <a href="#overzicht" className="automate-brand">
              <span className="brace" aria-hidden="true">
                {'{'}
              </span>
              <span>{t.nav.brand}</span>
              <span className="brace" aria-hidden="true">
                {'}'}
              </span>
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
                  className={`lang-btn ${lang === 'nl' ? 'active' : ''}`}
                  aria-pressed={lang === 'nl'}
                  onClick={() => handleLocaleChange('nl')}
                >
                  NL
                </button>
                <button
                  type="button"
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  aria-pressed={lang === 'en'}
                  onClick={() => handleLocaleChange('en')}
                >
                  EN
                </button>
              </div>
            </div>
          </nav>
        </header>

        <main id="main" tabIndex={-1}>
          {/* Hero */}
          <section
            id="overzicht"
            className="automate-hero"
            aria-labelledby="automate-hero-title"
          >
            <span className="automate-badge">{t.hero.badge}</span>
            <h1 id="automate-hero-title" className="automate-title">
              {t.hero.title}
            </h1>
            <p className="automate-subtitle">{t.hero.subtitle}</p>
            <div className="automate-cta-row">
              <a
                href="#automate-contact"
                className="automate-btn-primary"
                onClick={() => {
                  trackInteraction('automate_cta_click', {
                    target: 'contact',
                    lang,
                  });
                  capturePostHogEvent('automate_cta_click', {
                    target: 'contact',
                    lang,
                  });
                }}
              >
                {t.hero.primaryCta}
              </a>
              <a
                href="#automate-usecases"
                className="automate-btn-secondary"
                onClick={() => {
                  trackInteraction('automate_cta_click', {
                    target: 'usecases',
                    lang,
                  });
                  capturePostHogEvent('automate_cta_click', {
                    target: 'usecases',
                    lang,
                  });
                }}
              >
                {t.hero.secondaryCta}
              </a>
            </div>
          </section>

          <hr className="automate-section-divider" />

          {/* 01 — Diensten & Oplossingen */}
          <section
            id="diensten"
            className="automate-section"
            aria-labelledby="automate-pillars-title"
          >
            <div className="automate-section-header">
              <span className="automate-section-num">
                {t.sections.services.number}
              </span>
              <h2 id="automate-pillars-title" className="automate-section-title">
                {t.pillarsTitle}
              </h2>
            </div>
            <p className="automate-section-lead">{t.pillarsSubtitle}</p>
            <div className="automate-grid-2">
              {t.pillars.map((pillar) => (
                <article key={pillar.id} className="automate-card">
                  <span className="automate-card-eyebrow">{pillar.tag}</span>
                  <h3 className="automate-card-title">{pillar.title}</h3>
                  <p className="automate-card-text">{pillar.summary}</p>
                  <ul>
                    {pillar.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <hr className="automate-section-divider" />

          {/* 02 — Praktijkvoorbeelden */}
          <section
            id="automate-usecases"
            className="automate-section"
            aria-labelledby="automate-usecases-title"
          >
            <div className="automate-section-header">
              <span className="automate-section-num">
                {t.sections.useCases.number}
              </span>
              <h2 id="automate-usecases-title" className="automate-section-title">
                {t.useCasesTitle}
              </h2>
            </div>
            <p className="automate-section-lead">{t.useCasesSubtitle}</p>
            <div className="automate-grid-usecases">
              {t.useCases.map((useCase) => (
                <article key={useCase.id} className="automate-card">
                  <span className="automate-card-eyebrow">{useCase.category}</span>
                  <h3 className="automate-card-title">{useCase.title}</h3>
                  <p className="automate-card-text">{useCase.description}</p>
                  <p className="automate-card-example">{useCase.example}</p>
                </article>
              ))}
            </div>
          </section>

          <hr className="automate-section-divider" />

          {/* 03 — Werkwijze & Het Eerlijke Verhaal */}
          <section
            id="werkwijze"
            className="automate-section"
            aria-labelledby="automate-process-title"
          >
            <div className="automate-section-header">
              <span className="automate-section-num">
                {t.sections.process.number}
              </span>
              <h2 id="automate-process-title" className="automate-section-title">
                {t.processTitle}
              </h2>
            </div>
            <p className="automate-section-lead">{t.processSubtitle}</p>

            <div className="automate-steps-grid">
              {t.processSteps.map((step) => (
                <article key={step.number} className="automate-step-card">
                  <span className="automate-step-number">{step.tag}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>

            <article
              className="automate-story-card"
              aria-labelledby="automate-story-title"
            >
              <h3 id="automate-story-title">{t.storyTitle}</h3>
              {t.storyParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>

            <div style={{ marginTop: '28px' }}>
              <h3 className="automate-section-title">{t.regionTitle}</h3>
              <p className="automate-section-lead">{t.regionSubtitle}</p>
              <ul className="automate-region-list" aria-label={automateConfig.region}>
                <li className="automate-region-tag">{automateConfig.region}</li>
                {automateConfig.cities.map((city) => (
                  <li key={city} className="automate-region-tag">
                    {city}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <hr className="automate-section-divider" />

          {/* 04 — Over Greyson Teaser */}
          <section
            id="over-mij"
            className="automate-section"
            aria-labelledby="automate-about-teaser-title"
          >
            <div className="automate-section-header">
              <span className="automate-section-num">
                {t.sections.about.number}
              </span>
              <h2
                id="automate-about-teaser-title"
                className="automate-section-title"
              >
                {t.aboutTeaser.title}
              </h2>
            </div>
            <div className="automate-about-teaser">
              <p>{t.aboutTeaser.summary}</p>
              <a
                href={aboutHref}
                className="automate-btn-secondary"
                onClick={(e) => handleInternalRoute(e, 'about', onOpenAbout)}
              >
                <span>{t.aboutTeaser.ctaLabel}</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </section>

          <hr className="automate-section-divider" />

          {/* 05 — Contact */}
          <section
            id="automate-contact"
            className="automate-section"
            aria-labelledby="automate-contact-title"
          >
            <div className="automate-section-header">
              <span className="automate-section-num">
                {t.sections.contact.number}
              </span>
              <h2 id="automate-contact-title" className="automate-section-title">
                {t.form.title}
              </h2>
            </div>

            <div className="automate-form-card">
              <p>{t.form.subtitle}</p>

              <form className="automate-form" onSubmit={handleSubmit} noValidate>
                <div className="automate-form-row">
                  <div className="automate-field">
                    <label htmlFor="automate-name">{t.form.nameLabel}</label>
                    <input
                      id="automate-name"
                      name="name"
                      type="text"
                      className="automate-input"
                      autoComplete="name"
                      maxLength={INQUIRY_MAX_LENGTHS.name}
                      aria-required="true"
                      aria-invalid={hasError && !name.trim()}
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
                    <label htmlFor="automate-company">{t.form.companyLabel}</label>
                    <input
                      id="automate-company"
                      name="company"
                      type="text"
                      className="automate-input"
                      autoComplete="organization"
                      maxLength={INQUIRY_MAX_LENGTHS.company}
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
                </div>

                <div className="automate-form-row">
                  <div className="automate-field">
                    <label htmlFor="automate-contact-input">
                      {t.form.contactLabel}
                    </label>
                    <input
                      id="automate-contact-input"
                      name="contact"
                      type="text"
                      className="automate-input"
                      maxLength={INQUIRY_MAX_LENGTHS.contact}
                      aria-required="true"
                      aria-invalid={hasError && !contact.trim()}
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
                    <label htmlFor="automate-interest">{t.form.interestLabel}</label>
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
                </div>

                <div className="automate-field">
                  <label htmlFor="automate-message">{t.form.messageLabel}</label>
                  <textarea
                    id="automate-message"
                    name="message"
                    className="automate-textarea"
                    maxLength={INQUIRY_MAX_LENGTHS.message}
                    aria-required="true"
                    aria-invalid={hasError && !message.trim()}
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

                {hasError && (
                  <div className="automate-form-error" role="alert">
                    {t.form.validationError}
                  </div>
                )}

                <div className="automate-form-actions">
                  <button type="submit" className="automate-btn-primary">
                    {t.form.submitButton}
                  </button>
                </div>
              </form>

              {submitted && (
                <div
                  className="automate-form-status"
                  role="status"
                  aria-live="polite"
                >
                  <strong>{t.form.submittedTitle}</strong>
                  <span>{t.form.submittedDescription}</span>
                  <div className="automate-form-actions">
                    <button
                      type="button"
                      className="automate-btn-secondary"
                      onClick={handleCopyFallback}
                    >
                      {t.form.copyFallbackButton}
                    </button>
                  </div>
                  {copied && <span>{t.form.copiedNotice}</span>}
                </div>
              )}

              <p className="automate-form-note">
                {renderDirectEmailNote(t.form.directEmailNote, () => {
                  trackInteraction('automate_direct_email_click', { lang });
                  capturePostHogEvent('automate_direct_email_click', { lang });
                })}
              </p>
            </div>
          </section>
        </main>

        <footer className="automate-footer">
          <span>{t.footer.note}</span>
          <div className="automate-footer-links">
            <a
              href={aboutHref}
              className="automate-inline-link"
              onClick={(e) => handleInternalRoute(e, 'about', onOpenAbout)}
            >
              {t.footer.aboutLinkLabel}
            </a>
            <a
              href={dashboardHref}
              className="automate-inline-link"
              onClick={(e) =>
                handleInternalRoute(e, 'dashboard', onOpenDashboard)
              }
            >
              {t.nav.dashboardLabel}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
