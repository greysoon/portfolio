import React, { useEffect, useState } from 'react';
import { automateConfig, AutomateLocale } from '../config/automateConfig';
import { trackInteraction } from '../utils/telemetry';
import { capturePostHogEvent } from '../utils/posthogClient';
import {
  buildInquirySubjectAndBody,
  copyInquiryTextToClipboard,
  INQUIRY_MAX_LENGTHS,
  InquiryFormPayload,
  renderDirectEmailNote,
  sanitizeInquiryField,
} from './AutomatePage';
import '../styles/automate.css';

interface AboutMePageProps {
  lang?: AutomateLocale;
  onLocaleChange?: (nextLang: AutomateLocale) => void;
  onOpenHome?: () => void;
  onOpenDashboard?: () => void;
}

export const AboutMePage: React.FC<AboutMePageProps> = ({
  lang: controlledLang,
  onLocaleChange,
  onOpenHome,
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

  const homeHref = '/';
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
    target: 'home' | 'dashboard',
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
      <div className="automate-container automate-about-page">
        <header>
          <nav className="automate-nav" aria-label="About navigation">
            <a
              href={homeHref}
              className="automate-brand"
              onClick={(e) => handleInternalRoute(e, 'home', onOpenHome)}
            >
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
                <a
                  href={homeHref}
                  className="automate-nav-link"
                  onClick={(e) => handleInternalRoute(e, 'home', onOpenHome)}
                >
                  {t.nav.homeLabel}
                </a>
                <a
                  href={aboutHref}
                  className="automate-nav-link active"
                  aria-current="page"
                  onClick={(e) => e.preventDefault()}
                >
                  {t.nav.aboutLabel}
                </a>
                <a href="#about-contact" className="automate-nav-link">
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
          <section className="automate-hero" aria-labelledby="about-hero-title">
            <span className="automate-badge">{t.aboutPage.badge}</span>
            <h1 id="about-hero-title" className="automate-title">
              {t.aboutPage.title}
            </h1>
            <p className="automate-subtitle">{t.aboutPage.subtitle}</p>
            <div className="automate-cta-row">
              <a
                href="#about-contact"
                className="automate-btn-primary"
                onClick={() => {
                  trackInteraction('automate_cta_click', {
                    target: 'about_contact',
                    lang,
                  });
                  capturePostHogEvent('automate_cta_click', {
                    target: 'about_contact',
                    lang,
                  });
                }}
              >
                {t.hero.primaryCta}
              </a>
              <a
                href={homeHref}
                className="automate-btn-secondary"
                onClick={(e) => handleInternalRoute(e, 'home', onOpenHome)}
              >
                <span aria-hidden="true">&larr;</span>
                <span>{t.aboutPage.backHomeLabel}</span>
              </a>
            </div>
          </section>

          <hr className="automate-section-divider" />

          {/* Story & Profile Grid */}
          <section
            className="automate-section"
            aria-labelledby="about-intro-title"
          >
            <div className="automate-about-grid">
              <article className="automate-story-card">
                <h2 id="about-intro-title">{t.aboutPage.introTitle}</h2>
                {t.aboutPage.introParagraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </article>

              <aside
                className="automate-profile-card"
                aria-labelledby="about-profile-title"
              >
                <h2 id="about-profile-title">{t.aboutPage.backgroundTitle}</h2>
                <p>{t.aboutPage.backgroundText}</p>
                <p>
                  <strong>{t.aboutPage.locationLabel}:</strong>{' '}
                  {t.aboutPage.locationValue}
                </p>
                <p>
                  <strong>{t.aboutPage.emailLabel}:</strong>{' '}
                  <a
                    href="mailto:grey.beimers@gmail.com"
                    className="automate-inline-link"
                    onClick={() => {
                      trackInteraction('automate_direct_email_click', { lang });
                      capturePostHogEvent('automate_direct_email_click', {
                        lang,
                      });
                    }}
                  >
                    {automateConfig.email}
                  </a>
                </p>
                <p>
                  <strong>{t.aboutPage.linkedinLabel}:</strong>{' '}
                  <a
                    href={automateConfig.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="automate-inline-link"
                    onClick={() => {
                      trackInteraction('contact_click', { channel: 'linkedin' });
                      capturePostHogEvent('contact_click', {
                        channel: 'linkedin',
                      });
                    }}
                  >
                    Greyson Beimers
                  </a>
                </p>
                <h3>{t.aboutPage.skillsLabel}</h3>
                <ul className="automate-skill-tags">
                  {t.aboutPage.skills.map((skill) => (
                    <li key={skill} className="automate-skill-tag">
                      {skill}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </section>

          <hr className="automate-section-divider" />

          {/* Why Work Directly With Me */}
          <section
            className="automate-section"
            aria-labelledby="about-highlights-title"
          >
            <h2 id="about-highlights-title" className="automate-section-title">
              {t.aboutPage.highlightsTitle}
            </h2>
            <div className="automate-steps-grid">
              {t.aboutPage.highlights.map((item) => (
                <article key={item.id} className="automate-step-card">
                  <span className="automate-step-number">{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <hr className="automate-section-divider" />

          {/* Direct Contact & Inquiry Form */}
          <section
            id="about-contact"
            className="automate-section"
            aria-labelledby="about-contact-title"
          >
            <h2 id="about-contact-title" className="automate-section-title">
              {t.aboutPage.directContactTitle}
            </h2>
            <p className="automate-section-lead">
              {t.aboutPage.directContactSubtitle}
            </p>

            <div className="automate-contact-cards">
              <article className="automate-card">
                <span className="automate-card-eyebrow">
                  {t.aboutPage.emailLabel}
                </span>
                <h3 className="automate-card-title">{automateConfig.email}</h3>
                <p className="automate-card-text">{t.form.directEmailNote}</p>
                <div className="automate-cta-row">
                  <a
                    href="mailto:grey.beimers@gmail.com"
                    className="automate-btn-secondary"
                    onClick={() => {
                      trackInteraction('automate_direct_email_click', { lang });
                      capturePostHogEvent('automate_direct_email_click', {
                        lang,
                      });
                    }}
                  >
                    {t.aboutPage.emailLabel}
                  </a>
                </div>
              </article>

              <article className="automate-card">
                <span className="automate-card-eyebrow">
                  {t.aboutPage.linkedinLabel}
                </span>
                <h3 className="automate-card-title">Greyson Beimers</h3>
                <p className="automate-card-text">{t.aboutPage.locationValue}</p>
                <div className="automate-cta-row">
                  <a
                    href={automateConfig.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="automate-btn-secondary"
                    onClick={() => {
                      trackInteraction('contact_click', { channel: 'linkedin' });
                      capturePostHogEvent('contact_click', {
                        channel: 'linkedin',
                      });
                    }}
                  >
                    {t.aboutPage.linkedinLabel}
                  </a>
                </div>
              </article>
            </div>

            <div className="automate-form-card">
              <h2>{t.aboutPage.ctaTitle}</h2>
              <p>{t.aboutPage.ctaSubtitle}</p>

              <form className="automate-form" onSubmit={handleSubmit} noValidate>
                <div className="automate-form-row">
                  <div className="automate-field">
                    <label htmlFor="about-name">{t.form.nameLabel}</label>
                    <input
                      id="about-name"
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
                    <label htmlFor="about-company">{t.form.companyLabel}</label>
                    <input
                      id="about-company"
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
                    <label htmlFor="about-contact-input">
                      {t.form.contactLabel}
                    </label>
                    <input
                      id="about-contact-input"
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
                    <label htmlFor="about-interest">{t.form.interestLabel}</label>
                    <select
                      id="about-interest"
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
                  <label htmlFor="about-message">{t.form.messageLabel}</label>
                  <textarea
                    id="about-message"
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
              href={homeHref}
              className="automate-inline-link"
              onClick={(e) => handleInternalRoute(e, 'home', onOpenHome)}
            >
              {t.aboutPage.backHomeLabel}
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
