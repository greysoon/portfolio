import React, { useEffect, useState } from 'react';
import { automateConfig, AutomateLocale } from '../config/automateConfig';
import { trackInteraction } from '../utils/telemetry';
import { capturePostHogEvent } from '../utils/posthogClient';
import '../styles/automate.css';

interface AutomatePageProps {
  onOpenAbout?: () => void;
  onOpenCv?: () => void;
  onOpenDashboard?: () => void;
}

interface SubmittedPayload {
  subject: string;
  body: string;
  mailtoUrl: string;
}

const MAX_LENGTHS = {
  name: 100,
  company: 120,
  contact: 120,
  message: 1500,
} as const;

/**
 * Strips ASCII control characters and enforces an upper character bound.
 */
function sanitizeField(
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
 * Renders the copywriter's direct-email note with an interactive mailto: link.
 */
function renderDirectEmailNote(
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

export const AutomatePage: React.FC<AutomatePageProps> = ({
  onOpenAbout,
  onOpenCv,
  onOpenDashboard,
}) => {
  const [lang, setLang] = useState<AutomateLocale>('nl');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [interestIndex, setInterestIndex] = useState(0);
  const [interest, setInterest] = useState<string>(
    automateConfig.copy.nl.form.interestOptions[0]
  );
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedPayload | null>(null);
  const [copied, setCopied] = useState(false);

  const t = automateConfig.copy[lang];

  const isGreysonProd =
    typeof window !== 'undefined' &&
    (window.location.hostname.toLowerCase() === 'greyson.nl' ||
      window.location.hostname.toLowerCase().endsWith('.greyson.nl'));

  const aboutHref = isGreysonProd ? automateConfig.aboutUrl : '?site=about';
  const cvHref = isGreysonProd ? automateConfig.cvUrl : '?site=cv';
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

  const handleLocaleChange = (nextLang: AutomateLocale) => {
    if (nextLang === lang) return;
    setLang(nextLang);
    setInterest(
      automateConfig.copy[nextLang].form.interestOptions[interestIndex] ??
        automateConfig.copy[nextLang].form.interestOptions[0]
    );
    setHasError(false);
    trackInteraction('automate_language_toggle', { lang: nextLang });
    capturePostHogEvent('automate_language_toggle', { lang: nextLang });
  };

  const handleSubdomainNav = (
    e: React.MouseEvent<HTMLAnchorElement>,
    target: 'about' | 'cv' | 'dashboard',
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

    if (!isNormalLeftClick || !callback) return;

    // Dashboard stays on same origin (/dashboard); about/cv switch locally off production subdomains
    if (target === 'dashboard' || !isGreysonProd) {
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

    const cleanName = sanitizeField(name, MAX_LENGTHS.name).trim();
    const cleanCompany = sanitizeField(company, MAX_LENGTHS.company).trim();
    const cleanContact = sanitizeField(contact, MAX_LENGTHS.contact).trim();
    const cleanMessage = sanitizeField(message, MAX_LENGTHS.message, true)
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
    const subjectSuffix = cleanCompany || cleanName;
    const subject = `[Automate Friesland] ${safeInterest} — ${subjectSuffix}`.slice(
      0,
      200
    );

    const bodyLines = [
      `${t.form.nameLabel}: ${cleanName}`,
      cleanCompany ? `${t.form.companyLabel}: ${cleanCompany}` : null,
      `${t.form.contactLabel}: ${cleanContact}`,
      `${t.form.interestLabel}: ${safeInterest}`,
      '',
      `${t.form.messageLabel}:`,
      cleanMessage,
    ].filter((line): line is string => line !== null);

    const body = bodyLines.join('\n');
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
    const clipboardText = `To: ${automateConfig.email}\nSubject: ${submitted.subject}\n\n${submitted.body}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(clipboardText);
        setCopied(true);
        trackInteraction('automate_copy_fallback', { lang });
        capturePostHogEvent('automate_copy_fallback', { lang });
      }
    } catch {
      // Ignore clipboard permission errors gracefully
    }
  };

  return (
    <div className="automate-scroll-root">
      <div className="automate-container">
        <header>
          <nav className="automate-nav" aria-label="Primary navigation">
            <span className="automate-brand">
              <span className="brace" aria-hidden="true">
                {'{'}
              </span>
              <span>{t.nav.brand}</span>
              <span className="brace" aria-hidden="true">
                {'}'}
              </span>
            </span>

            <div className="automate-nav-actions">
              <div className="automate-nav-links">
                <a
                  href={aboutHref}
                  className="automate-back-link"
                  onClick={(e) => handleSubdomainNav(e, 'about', onOpenAbout)}
                >
                  {t.nav.aboutLabel}
                </a>
                <a
                  href={cvHref}
                  className="automate-back-link"
                  onClick={(e) => handleSubdomainNav(e, 'cv', onOpenCv)}
                >
                  {t.nav.cvLabel}
                </a>
                <a
                  href={dashboardHref}
                  className="automate-back-link"
                  onClick={(e) =>
                    handleSubdomainNav(e, 'dashboard', onOpenDashboard)
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
          <section className="automate-hero" aria-labelledby="automate-hero-title">
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

          {/* Honest Friesland Story */}
          <section className="automate-section" aria-labelledby="automate-story-title">
            <article className="automate-story-card">
              <h2 id="automate-story-title">{t.storyTitle}</h2>
              {t.storyParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>
          </section>

          {/* Two Core Pillars */}
          <section
            className="automate-section"
            aria-labelledby="automate-pillars-title"
          >
            <h2 id="automate-pillars-title" className="automate-section-title">
              {t.pillarsTitle}
            </h2>
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

          {/* Practical Use Cases */}
          <section
            id="automate-usecases"
            className="automate-section"
            aria-labelledby="automate-usecases-title"
          >
            <h2 id="automate-usecases-title" className="automate-section-title">
              {t.useCasesTitle}
            </h2>
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

          {/* Friesland Region Coverage */}
          <section
            className="automate-section"
            aria-labelledby="automate-region-title"
          >
            <h2 id="automate-region-title" className="automate-section-title">
              {t.regionTitle}
            </h2>
            <p className="automate-section-lead">{t.regionSubtitle}</p>
            <ul className="automate-region-list" aria-label={automateConfig.region}>
              <li className="automate-region-tag">{automateConfig.region}</li>
              {automateConfig.cities.map((city) => (
                <li key={city} className="automate-region-tag">
                  {city}
                </li>
              ))}
            </ul>
          </section>

          {/* Interactive Contact Form */}
          <section
            id="automate-contact"
            className="automate-section"
            aria-labelledby="automate-contact-title"
          >
            <div className="automate-form-card">
              <h2 id="automate-contact-title">{t.form.title}</h2>
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
                      maxLength={MAX_LENGTHS.name}
                      aria-required="true"
                      aria-invalid={hasError && !name.trim()}
                      placeholder={t.form.namePlaceholder}
                      value={name}
                      onChange={(e) =>
                        setName(sanitizeField(e.target.value, MAX_LENGTHS.name))
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
                      maxLength={MAX_LENGTHS.company}
                      placeholder={t.form.companyPlaceholder}
                      value={company}
                      onChange={(e) =>
                        setCompany(sanitizeField(e.target.value, MAX_LENGTHS.company))
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
                      maxLength={MAX_LENGTHS.contact}
                      aria-required="true"
                      aria-invalid={hasError && !contact.trim()}
                      placeholder={t.form.contactPlaceholder}
                      value={contact}
                      onChange={(e) =>
                        setContact(sanitizeField(e.target.value, MAX_LENGTHS.contact))
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
                    maxLength={MAX_LENGTHS.message}
                    aria-required="true"
                    aria-invalid={hasError && !message.trim()}
                    placeholder={t.form.messagePlaceholder}
                    value={message}
                    onChange={(e) =>
                      setMessage(
                        sanitizeField(e.target.value, MAX_LENGTHS.message, true)
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
              onClick={(e) => handleSubdomainNav(e, 'about', onOpenAbout)}
            >
              {t.footer.portfolioLinkLabel}
            </a>
            <a
              href={cvHref}
              className="automate-inline-link"
              onClick={(e) => handleSubdomainNav(e, 'cv', onOpenCv)}
            >
              {t.nav.cvLabel}
            </a>
            <a
              href={dashboardHref}
              className="automate-inline-link"
              onClick={(e) =>
                handleSubdomainNav(e, 'dashboard', onOpenDashboard)
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
