import { automateConfig, AutomateLocale } from '../config/automateConfig';
import { siteConfig } from '../config/siteConfig';

export type SeoView = 'automate' | 'about' | 'portfolio' | 'dashboard';
export type SeoPortfolioMode = 'about' | 'cv';

export interface SeoAlternateLink {
  readonly hreflang: string;
  readonly href: string;
}

export interface SeoMetadataPayload {
  readonly lang: 'nl' | 'en';
  readonly title: string;
  readonly description: string;
  readonly keywords: string;
  readonly robots: string;
  readonly canonicalUrl: string;
  readonly ogType: 'website' | 'profile';
  readonly ogUrl: string;
  readonly ogLocale: string;
  readonly ogLocaleAlternate: string;
  readonly ogSiteName: string;
  readonly ogImage: string;
  readonly ogImageAlt: string;
  readonly twitterTitle: string;
  readonly twitterDescription: string;
  readonly alternates: readonly SeoAlternateLink[];
  readonly jsonLd: Record<string, unknown>;
}

const ORIGIN = 'https://greyson.nl';

function buildPersonNode(locale: AutomateLocale): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': `${ORIGIN}/#person`,
    name: 'Greyson Beimers',
    jobTitle:
      locale === 'nl'
        ? 'Full-Stack Software Engineer & AI Automatiseringsspecialist'
        : 'Full-Stack Software Engineer & AI Automation Specialist',
    description:
      locale === 'nl'
        ? 'Greyson Beimers helpt bedrijven in Friesland en Nederland door vastgeroeste bedrijfsprocessen visueel in kaart te brengen en binnen een middag of dag op te lossen met custom AI-tools.'
        : 'Greyson Beimers helps businesses in Friesland and the Netherlands map rusty workflows visually and ship custom AI tools in a single afternoon or day.',
    url: `${ORIGIN}/`,
    image: `${ORIGIN}/og-image.png`,
    email: `mailto:${automateConfig.email}`,
    sameAs: [automateConfig.linkedinUrl],
    knowsAbout: [
      'AI Workflow Automation',
      'Custom Web Applications',
      'Process Mapping',
      'TypeScript',
      'React',
      'Excel to Web App Migration',
      'Quote & Intake Automation',
    ],
    homeLocation: {
      '@type': 'Place',
      name: 'Friesland & Amsterdam, Netherlands',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'Friesland',
        addressCountry: 'NL',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 53.2012,
        longitude: 5.7999,
      },
    },
  };
}

function buildWebsiteNode(locale: AutomateLocale): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${ORIGIN}/#website`,
    url: `${ORIGIN}/`,
    name:
      locale === 'nl'
        ? 'Greyson — AI & Custom Tools in 1 Dag'
        : 'Greyson — AI & Custom Tools in 1 Day',
    alternateName: 'Greyson Automation',
    description:
      locale === 'nl'
        ? 'Praktische AI-processen en maatwerk webtools in één middag of dag voor bedrijven in Friesland.'
        : 'Practical AI workflows and custom web tools built in one afternoon or day for businesses in Friesland and the Netherlands.',
    inLanguage: ['nl-NL', 'en-US'],
    publisher: {
      '@id': `${ORIGIN}/#person`,
    },
  };
}

function buildServiceNode(locale: AutomateLocale): Record<string, unknown> {
  const isNl = locale === 'nl';
  return {
    '@type': 'ProfessionalService',
    '@id': `${ORIGIN}/#service`,
    name: 'Greyson Automation — AI & Custom Tools Friesland',
    url: `${ORIGIN}/`,
    image: isNl ? `${ORIGIN}/og-image.png` : `${ORIGIN}/og-image-en.png`,
    logo: `${ORIGIN}/logo.svg`,
    email: `mailto:${automateConfig.email}`,
    priceRange: '€€',
    founder: {
      '@id': `${ORIGIN}/#person`,
    },
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Friesland',
      addressCountry: 'NL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 53.2012,
      longitude: 5.7999,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: automateConfig.email,
      availableLanguage: ['Dutch', 'English'],
    },
    serviceType: isNl
      ? [
          'AI-procesautomatisering',
          'Custom software & webtools in 1 dag',
          'Offerte- en mailautomatisering',
          'Excel naar webportaal migratie',
          'Afgeschermde interne AI-kennisbank',
        ]
      : [
          'AI Workflow Automation',
          'Custom Web Tools in 1 Day',
          'Quote & Email Intake Automation',
          'Excel Spreadsheet to Web App Migration',
          'Internal AI Knowledge Base',
        ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: isNl ? '1-Dag Custom AI Oplossingen' : '1-Day Custom AI Solutions',
      itemListElement: automateConfig.copy[locale].useCases.items.map((item) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: item.title,
          description: item.narrative,
        },
      })),
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Friesland' },
      { '@type': 'City', name: 'Leeuwarden' },
      { '@type': 'City', name: 'Sneek' },
      { '@type': 'City', name: 'Heerenveen' },
      { '@type': 'City', name: 'Drachten' },
      { '@type': 'City', name: 'Harlingen' },
      { '@type': 'City', name: 'Franeker' },
      { '@type': 'City', name: 'Dokkum' },
      { '@type': 'Country', name: 'Nederland' },
    ],
  };
}

export function getSeoMetadata(params: {
  view: SeoView;
  portfolioMode?: SeoPortfolioMode;
  locale?: AutomateLocale;
}): SeoMetadataPayload {
  const locale: AutomateLocale = params.locale === 'en' ? 'en' : 'nl';
  const portfolioMode: SeoPortfolioMode =
    params.portfolioMode === 'cv' ? 'cv' : 'about';

  if (params.view === 'dashboard') {
    return {
      lang: 'en',
      title: 'Analytics Dashboard — Greyson Automation',
      description: 'Internal analytics console for Greyson Automation.',
      keywords: 'Greyson Automation analytics',
      robots: 'noindex, nofollow',
      canonicalUrl: `${ORIGIN}/`,
      ogType: 'website',
      ogUrl: `${ORIGIN}/`,
      ogLocale: 'en_US',
      ogLocaleAlternate: 'nl_NL',
      ogSiteName: 'Greyson Automation',
      ogImage: `${ORIGIN}/og-image-en.png`,
      ogImageAlt: 'Greyson Automation',
      twitterTitle: 'Analytics Dashboard — Greyson Automation',
      twitterDescription: 'Internal analytics console.',
      alternates: [],
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [buildPersonNode('en'), buildWebsiteNode('en')],
      },
    };
  }

  if (params.view === 'portfolio') {
    const isCv = portfolioMode === 'cv';
    const baseUrl = isCv ? 'https://cv.greyson.nl/' : 'https://about.greyson.nl/';
    const title = isCv
      ? `${siteConfig.cvSummary.title} — Software Engineer`
      : siteConfig.siteTitle;
    const description = isCv
      ? 'Curriculum Vitae of Greyson Beimers — Full-Stack Software Engineer (TypeScript, React, Three.js, Python & AI workflow automation) in Amsterdam & Friesland.'
      : siteConfig.description;

    return {
      lang: 'en',
      title,
      description,
      keywords: siteConfig.keywords.join(', '),
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      canonicalUrl: baseUrl,
      ogType: 'profile',
      ogUrl: baseUrl,
      ogLocale: 'en_US',
      ogLocaleAlternate: 'nl_NL',
      ogSiteName: 'Greyson Beimers',
      ogImage: `${ORIGIN}/og-image-en.png`,
      ogImageAlt: 'Greyson Beimers — Software Engineer & AI Automation Specialist',
      twitterTitle: title,
      twitterDescription: description,
      alternates: [],
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          buildPersonNode('en'),
          {
            '@type': 'ProfilePage',
            '@id': `${baseUrl}#profile`,
            url: baseUrl,
            name: title,
            description,
            mainEntity: { '@id': `${ORIGIN}/#person` },
          },
          buildWebsiteNode('en'),
        ],
      },
    };
  }

  if (params.view === 'about') {
    const isNl = locale === 'nl';
    const canonicalUrl = isNl ? `${ORIGIN}/over-mij` : `${ORIGIN}/en/about`;
    const title = isNl
      ? 'Over Greyson Beimers — AI & Custom Tools | Friesland'
      : 'About Greyson Beimers — AI & Custom Tools | Netherlands';
    const description = isNl
      ? 'Maak kennis met Greyson Beimers. Ik help bedrijven in Friesland vastgeroeste processen in 30 min in kaart te brengen en in 1 middag op te lossen.'
      : 'Meet Greyson Beimers. I help SMEs in Friesland and the Netherlands map rusty workflows in 30 minutes and ship practical 1-day custom AI tools.';
    const alternates: SeoAlternateLink[] = [
      { hreflang: 'nl', href: `${ORIGIN}/over-mij` },
      { hreflang: 'en', href: `${ORIGIN}/en/about` },
      { hreflang: 'x-default', href: `${ORIGIN}/over-mij` },
    ];

    return {
      lang: locale,
      title,
      description,
      keywords: isNl
        ? 'Greyson Beimers, AI specialist Friesland, custom software in 1 dag, proces in kaart brengen, Leeuwarden, Sneek, Heerenveen, Drachten'
        : 'Greyson Beimers, AI automation specialist Netherlands, custom 1-day web tools, Friesland SME automation, Leeuwarden',
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      canonicalUrl,
      ogType: 'profile',
      ogUrl: canonicalUrl,
      ogLocale: isNl ? 'nl_NL' : 'en_US',
      ogLocaleAlternate: isNl ? 'en_US' : 'nl_NL',
      ogSiteName: 'Greyson Automation',
      ogImage: isNl ? `${ORIGIN}/og-image.png` : `${ORIGIN}/og-image-en.png`,
      ogImageAlt: isNl
        ? 'Greyson Beimers — AI & Custom Tools in 1 dag voor Friesland'
        : 'Greyson Beimers — AI & Custom Tools in 1 day for the Netherlands',
      twitterTitle: title,
      twitterDescription: description,
      alternates,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          buildPersonNode(locale),
          buildWebsiteNode(locale),
          buildServiceNode(locale),
          {
            '@type': 'AboutPage',
            '@id': `${canonicalUrl}#webpage`,
            url: canonicalUrl,
            name: title,
            description,
            inLanguage: isNl ? 'nl-NL' : 'en-US',
            isPartOf: { '@id': `${ORIGIN}/#website` },
            mainEntity: { '@id': `${ORIGIN}/#person` },
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: isNl ? `${ORIGIN}/` : `${ORIGIN}/en`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: isNl ? 'Over mij' : 'About Me',
                item: canonicalUrl,
              },
            ],
          },
        ],
      },
    };
  }

  // Default: 'automate' (Homepage NL `/` or EN `/en`)
  const isNl = locale === 'nl';
  const canonicalUrl = isNl ? `${ORIGIN}/` : `${ORIGIN}/en`;
  const title = isNl
    ? 'Greyson — AI & Custom Tools in 1 Dag | Friesland'
    : 'Greyson — AI & Custom Tools in 1 Day | Netherlands';
  const description = isNl
    ? 'AI-automatisering en custom webtools in één middag of dag voor bedrijven in Friesland. Breng vastgeroeste processen in kaart en werk efficiënter.'
    : 'Practical AI workflows and custom web tools built in one afternoon or day for SMEs in Friesland and the Netherlands. Zero lock-in contracts.';
  const alternates: SeoAlternateLink[] = [
    { hreflang: 'nl', href: `${ORIGIN}/` },
    { hreflang: 'en', href: `${ORIGIN}/en` },
    { hreflang: 'x-default', href: `${ORIGIN}/` },
  ];

  const faqItems = automateConfig.copy[locale].faq.items;

  return {
    lang: locale,
    title,
    description,
    keywords: isNl
      ? 'AI automatisering Friesland, custom tool laten bouwen, proces automatisering MKB, offertes automatiseren, Excel vervangen web app, Greyson Beimers, Leeuwarden, Sneek, Heerenveen, Drachten'
      : 'AI workflow automation Friesland, custom internal web tool 1 day, replace Excel spreadsheets web app, SME process automation Netherlands, Greyson Beimers',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    canonicalUrl,
    ogType: 'website',
    ogUrl: canonicalUrl,
    ogLocale: isNl ? 'nl_NL' : 'en_US',
    ogLocaleAlternate: isNl ? 'en_US' : 'nl_NL',
    ogSiteName: 'Greyson Automation',
    ogImage: isNl ? `${ORIGIN}/og-image.png` : `${ORIGIN}/og-image-en.png`,
    ogImageAlt: isNl
      ? 'Greyson — AI & Custom Tools in 1 middag of dag voor Friesland'
      : 'Greyson — AI & Custom Tools in 1 afternoon or day',
    twitterTitle: title,
    twitterDescription: isNl
      ? 'Van vastgeroeste Excel-lijsten en handwerk naar een custom AI-tool in één middag of dag voor bedrijven in Friesland.'
      : 'From tangled spreadsheets and manual admin to a custom AI tool in one afternoon or day.',
    alternates,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        buildPersonNode(locale),
        buildWebsiteNode(locale),
        buildServiceNode(locale),
        {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: title,
          description,
          inLanguage: isNl ? 'nl-NL' : 'en-US',
          isPartOf: { '@id': `${ORIGIN}/#website` },
          about: { '@id': `${ORIGIN}/#service` },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: isNl ? `${ORIGIN}/og-image.png` : `${ORIGIN}/og-image-en.png`,
            width: 1200,
            height: 630,
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${canonicalUrl}#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: isNl ? 'Home — AI & Custom Tools' : 'Home — AI & Custom Tools',
              item: canonicalUrl,
            },
          ],
        },
        {
          '@type': 'FAQPage',
          '@id': `${canonicalUrl}#faq`,
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    },
  };
}

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${attrValue}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkTag(rel: string, href: string): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]:not([hreflang])`
  );
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Synchronizes document <head> SEO tags, canonical, hreflang, OpenGraph, Twitter, and JSON-LD
 * cleanly during client-side route or language changes.
 */
export function applyDocumentSeoMetadata(params: {
  view: SeoView;
  portfolioMode?: SeoPortfolioMode;
  locale?: AutomateLocale;
}): void {
  if (typeof document === 'undefined') return;
  const meta = getSeoMetadata(params);

  document.documentElement.lang = meta.lang;
  document.title = meta.title;

  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'keywords', meta.keywords);
  upsertMetaTag('name', 'robots', meta.robots);

  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);
  upsertMetaTag('property', 'og:type', meta.ogType);
  upsertMetaTag('property', 'og:url', meta.ogUrl);
  upsertMetaTag('property', 'og:site_name', meta.ogSiteName);
  upsertMetaTag('property', 'og:locale', meta.ogLocale);
  upsertMetaTag('property', 'og:locale:alternate', meta.ogLocaleAlternate);
  upsertMetaTag('property', 'og:image', meta.ogImage);
  upsertMetaTag('property', 'og:image:alt', meta.ogImageAlt);

  upsertMetaTag('name', 'twitter:title', meta.twitterTitle);
  upsertMetaTag('name', 'twitter:description', meta.twitterDescription);
  upsertMetaTag('name', 'twitter:image', meta.ogImage);
  upsertMetaTag('name', 'twitter:image:alt', meta.ogImageAlt);

  upsertLinkTag('canonical', meta.canonicalUrl);

  // Sync hreflang alternate links
  const existingAlternates = document.head.querySelectorAll(
    'link[rel="alternate"][hreflang]'
  );
  existingAlternates.forEach((node) => node.remove());
  for (const alt of meta.alternates) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', alt.hreflang);
    link.setAttribute('href', alt.href);
    document.head.appendChild(link);
  }

  // Sync JSON-LD structured data block
  let ldScript = document.head.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"]'
  );
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(meta.jsonLd);
}
