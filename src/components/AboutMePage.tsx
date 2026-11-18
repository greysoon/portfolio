import React, { useEffect, useState } from 'react';
import { automateConfig, AutomateLocale } from '../config/automateConfig';
import { trackInteraction } from '../utils/telemetry';
import { capturePostHogEvent } from '../utils/posthogClient';
import { BrandLogo } from './BrandLogo';
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

  const t = automateConfig.copy[lang];

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [interestIndex, setInterestIndex] = useState(0);
  const [interest, setInterest] = useState<string>(t.form.interestOptions[0]);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [submitted, setSubmitted] = useState<InquiryFormPayload | null>(null);
  const [copied, setCopied] = useState(false);

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
          <nav className="automate-nav" aria-label="About navigation">
            <a
              href={homeHref}
              className="automate-brand"
              onClick={(e) => handleInternalRoute(e, 'home', onOpenHome)}
            >
              <BrandLogo label={t.nav.brand} />
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
                  className="automate-nav-link is-current"
                  aria-current="page"
                >
                  {t.nav.aboutLabel}
                </a>
                <a
                  href="#about-contact"
                  className="automate-nav-link"
                  onClick={(e) =>
                    handleSectionScroll(e, 'about-contact', 'about_nav_contact')
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
                href="#about-contact"
                className="automate-btn automate-btn-primary automate-nav-cta"
                onClick={(e) =>
                  handleSectionScroll(e, 'about-contact', 'about_header_contact')
                }
              >
                {t.nav.contactLabel}
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main id="main-content">
        {/* Band 1: Full-Bleed Split About Hero & Clean Profile Panel */}
        <section className="automate-band automate-band--hero">
          <div className="automate-band-inner">
            <div className="automate-about-hero">
              <div className="automate-hero-copy">
                <div className="automate-eyebrow">{t.aboutPage.badge}</div>
                <h1 className="automate-h1">{t.aboutPage.title}</h1>
                <p className="automate-subtitle">{t.aboutPage.subtitle}</p>
                <div className="automate-cta-row">
                  <a
                    href="#about-contact"
                    className="automate-btn automate-btn-primary"
                    onClick={(e) =>
                      handleSectionScroll(
                        e,
                        'about-contact',
                        'about_hero_contact'
                      )
                    }
                  >
                    {t.aboutPage.directContactTitle}
                  </a>
                  <a
                    href={homeHref}
                    className="automate-btn automate-btn-secondary"
                    onClick={(e) => handleInternalRoute(e, 'home', onOpenHome)}
                  >
                    {t.aboutPage.backHomeLabel}
                  </a>
                </div>
              </div>

              <aside
                className="automate-hero-showcase"
                aria-label={t.aboutPage.profileTitle}
              >
                <div className="automate-showcase-head">
                  <span className="automate-kicker">
                    {t.aboutPage.profileTitle}
                  </span>
                </div>

                {/* < 2025 vs 2026 Era Shift Graphic */}
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

                <p className="automate-prose">{t.aboutPage.profileBody}</p>
                {t.aboutPage.stackLine ? (
                  <p className="automate-stack-line">{t.aboutPage.stackLine}</p>
                ) : null}

                <div className="automate-profile-meta">
                  <div className="automate-profile-row">
                    <span className="automate-detail-label">
                      {t.aboutPage.locationLabel}
                    </span>
                    <span className="automate-detail-value">
                      {t.aboutPage.locationValue}
                    </span>
                  </div>

                  <div className="automate-profile-row">
                    <span className="automate-detail-label">
                      {t.aboutPage.emailLabel}
                    </span>
                    <a
                      href="mailto:grey.beimers@gmail.com"
                      className="automate-detail-link"
                      onClick={() => {
                        trackInteraction('automate_direct_email_click', {
                          lang,
                          source: 'about_profile',
                        });
                        capturePostHogEvent('automate_direct_email_click', {
                          lang,
                          source: 'about_profile',
                        });
                      }}
                    >
                      {automateConfig.email}
                    </a>
                  </div>

                  <div className="automate-profile-row">
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
                          source: 'about_profile',
                        });
                        capturePostHogEvent('automate_linkedin_click', {
                          lang,
                          source: 'about_profile',
                        });
                      }}
                    >
                      Greyson Beimers — LinkedIn
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Band 2: Full-Bleed White Story Prose & Open Principles Columns */}
        <section className="automate-band automate-band--white">
          <div className="automate-band-inner">
            <div className="automate-about-editorial">
              <div className="automate-about-story-col automate-reveal">
                <span className="automate-eyebrow">
                  {t.aboutPage.introTitle}
                </span>
                <div className="automate-story-paragraphs">
                  {t.aboutPage.introParagraphs.map((paragraph, idx) => (
                    <p key={idx} className="automate-prose">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="automate-principles-wrap">
                <h2 className="automate-kicker">{t.aboutPage.principlesTitle}</h2>
                <div className="automate-principles-row">
                  {t.aboutPage.principles.map((principle) => (
                    <article
                      key={principle.title}
                      className="automate-principle-col automate-reveal"
                    >
                      <span
                        className="automate-principle-icon"
                        aria-hidden="true"
                      >
                        {principle.icon === 'insight' && (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.1"
                          >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.35-4.35" />
                          </svg>
                        )}
                        {principle.icon === 'speed' && (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.1"
                          >
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                        )}
                        {principle.icon === 'shield' && (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.1"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        )}
                      </span>
                      <h3 className="automate-h3">{principle.title}</h3>
                      <p className="automate-prose">{principle.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Band 3: Full-Bleed Warm Stone Split Direct Contact & Inquiry Form */}
        <section id="about-contact" className="automate-band automate-band--stone">
          <div className="automate-band-inner">
            <div className="automate-contact-split">
              <div className="automate-contact-info automate-reveal">
                <span className="automate-eyebrow">
                  {t.aboutPage.directContactTitle}
                </span>
                <h2 className="automate-h2">{t.aboutPage.ctaTitle}</h2>
                <p className="automate-prose">{t.aboutPage.ctaSubtitle}</p>
                <p className="automate-prose">
                  {t.aboutPage.directContactSubtitle}
                </p>

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
                          source: 'about_contact',
                        });
                        capturePostHogEvent('automate_direct_email_click', {
                          lang,
                          source: 'about_contact',
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
                          source: 'about_contact',
                        });
                        capturePostHogEvent('automate_linkedin_click', {
                          lang,
                          source: 'about_contact',
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
                  className="automate-form-panel automate-form-panel--on-stone"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="automate-form-grid">
                    <div className="automate-field">
                      <label htmlFor="about-name" className="automate-label">
                        {t.form.nameLabel} *
                      </label>
                      <input
                        id="about-name"
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
                      <label htmlFor="about-company" className="automate-label">
                        {t.form.companyLabel}
                      </label>
                      <input
                        id="about-company"
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
                        htmlFor="about-contact-input"
                        className="automate-label"
                      >
                        {t.form.contactLabel} *
                      </label>
                      <input
                        id="about-contact-input"
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
                      <label htmlFor="about-interest" className="automate-label">
                        {t.form.interestLabel}
                      </label>
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

                    <div className="automate-field is-full">
                      <label htmlFor="about-message" className="automate-label">
                        {t.form.messageLabel} *
                      </label>
                      <textarea
                        id="about-message"
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
              href={homeHref}
              className="automate-nav-link"
              onClick={(e) => handleInternalRoute(e, 'home', onOpenHome)}
            >
              {t.nav.homeLabel}
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
