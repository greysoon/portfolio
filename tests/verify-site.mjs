/**
 * Greyson Web Studio — End-to-End QA & Release Certification Suite (`qa-tester`)
 *
 * Verifies all Sprint 01 acceptance criteria across:
 * 1. Build Artifacts & Vendor Chunking (`dist/`)
 * 2. Technical SEO, OpenGraph, Twitter Card, Schema.org JSON-LD & Security Meta (`index.html`)
 * 3. Centralized Brand & Geographic Copy Tokens (`src/config/siteConfig.ts`)
 * 4. Privacy-First Telemetry & Zero-Cookie/Zero-Storage Compliance (`src/utils/telemetry.ts`)
 * 5. Accessibility, Reduced Motion & Security Hardening (`App.tsx`, `TypingHeader.tsx`, `LiveAgeBio.tsx`, `PastelGlobe.tsx`, `index.css`)
 * 6. Red/Blue Team Security Ledger Verification (`SEC-01` through `SEC-04`)
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runSecurityAuditChecks } from './security/red-team-audit.mjs';

const rootDir = process.cwd();
const checks = [];

function check(category, name, fn) {
  try {
    fn();
    checks.push({ category, name, status: 'PASS' });
  } catch (err) {
    checks.push({
      category,
      name,
      status: 'FAIL',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ---------------------------------------------------------------------------
// 1. Build Outputs & Bundle Chunking (`dist/`)
// ---------------------------------------------------------------------------
const distDir = path.join(rootDir, 'dist');
const distAssetsDir = path.join(distDir, 'assets');

check('Build', 'dist/ directory and core static files exist (index.html, robots.txt, sitemap.xml, manifest.webmanifest)', () => {
  for (const file of ['index.html', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest']) {
    const fullPath = path.join(distDir, file);
    assert.ok(fs.existsSync(fullPath), `Missing build output: dist/${file}`);
    assert.ok(fs.statSync(fullPath).size > 0, `Empty build output: dist/${file}`);
  }
});

check('Build', 'dist/assets/ contains split JS chunks (three, antd, vendor, index) and CSS bundle with zero sourcemaps', () => {
  assert.ok(fs.existsSync(distAssetsDir), 'Missing dist/assets directory');
  const assetFiles = fs.readdirSync(distAssetsDir);

  assert.ok(assetFiles.some((f) => /^three-.*\.js$/.test(f)), 'Missing three-*.js chunk');
  assert.ok(assetFiles.some((f) => /^antd-.*\.js$/.test(f)), 'Missing antd-*.js chunk');
  assert.ok(assetFiles.some((f) => /^vendor-.*\.js$/.test(f)), 'Missing vendor-*.js chunk');
  assert.ok(assetFiles.some((f) => /^index-.*\.js$/.test(f)), 'Missing index-*.js entry chunk');
  assert.ok(assetFiles.some((f) => /^index-.*\.css$/.test(f)), 'Missing index-*.css stylesheet');
  assert.ok(!assetFiles.some((f) => f.endsWith('.map')), 'Production sourcemaps (.map) must not be emitted');
});

// ---------------------------------------------------------------------------
// 2. Technical SEO, Structured Data & CSP/Referrer Meta (`index.html`)
// ---------------------------------------------------------------------------
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

check('SEO & Security Meta', 'index.html contains canonical URL (https://greyson.nl/), OpenGraph, and Twitter Card metadata', () => {
  assert.ok(indexHtml.includes('<link rel="canonical" href="https://greyson.nl/" />'), 'Missing canonical link');
  assert.ok(indexHtml.includes('property="og:title"'), 'Missing og:title');
  assert.ok(indexHtml.includes('property="og:description"'), 'Missing og:description');
  assert.ok(indexHtml.includes('property="og:type" content="website"'), 'Missing og:type');
  assert.ok(indexHtml.includes('property="og:url" content="https://greyson.nl/"'), 'Missing og:url');
  assert.ok(indexHtml.includes('name="twitter:card"'), 'Missing twitter:card');
  assert.ok(indexHtml.includes('name="twitter:title"'), 'Missing twitter:title');
  assert.ok(indexHtml.includes('name="twitter:description"'), 'Missing twitter:description');
});

check('SEO & Security Meta', 'index.html embeds valid Schema.org Person + WebSite JSON-LD', () => {
  const match = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match && match[1], 'Missing application/ld+json script block');
  const parsed = JSON.parse(match[1]);
  assert.equal(parsed['@context'], 'https://schema.org');
  assert.ok(Array.isArray(parsed['@graph']), 'JSON-LD @graph must be an array');
  const types = parsed['@graph'].map((node) => node['@type']);
  assert.ok(types.includes('Person'), 'JSON-LD missing Person entity');
  assert.ok(types.includes('WebSite'), 'JSON-LD missing WebSite entity');
});

check('SEO & Security Meta', 'index.html enforces Content-Security-Policy and strict-origin-when-cross-origin referrer meta', () => {
  assert.ok(indexHtml.includes('http-equiv="Content-Security-Policy"'), 'Missing CSP meta tag');
  assert.ok(indexHtml.includes("default-src 'self'"), "Missing default-src 'self' in CSP");
  assert.ok(indexHtml.includes("object-src 'none'"), "Missing object-src 'none' in CSP");
  assert.ok(
    indexHtml.includes('<meta name="referrer" content="strict-origin-when-cross-origin" />'),
    'Missing referrer meta tag'
  );
});

// ---------------------------------------------------------------------------
// 3. Copy & Brand Tokens (`src/config/siteConfig.ts`)
// ---------------------------------------------------------------------------
const siteConfigSrc = fs.readFileSync(path.join(rootDir, 'src/config/siteConfig.ts'), 'utf8');

check('Copywriting', 'src/config/siteConfig.ts defines siteTitle, tagline, description, siteUrl, keywords, location.city & location.country', () => {
  for (const token of [
    'siteTitle:',
    'tagline:',
    'description:',
    "siteUrl: 'https://greyson.nl'",
    'keywords:',
    "city: 'Amsterdam'",
    "country: 'Netherlands'",
  ]) {
    assert.ok(siteConfigSrc.includes(token), `Missing token in siteConfig.ts: ${token}`);
  }
});

// ---------------------------------------------------------------------------
// 4. Privacy-First Telemetry (`src/utils/telemetry.ts`)
// ---------------------------------------------------------------------------
const telemetrySrc = fs.readFileSync(path.join(rootDir, 'src/utils/telemetry.ts'), 'utf8');

check('Telemetry', 'src/utils/telemetry.ts exports initTelemetry & trackInteraction with zero cookie/storage access and PII scrubbing', () => {
  assert.ok(telemetrySrc.includes('export function initTelemetry'), 'Missing export initTelemetry');
  assert.ok(telemetrySrc.includes('export function trackInteraction'), 'Missing export trackInteraction');
  assert.ok(telemetrySrc.includes('[REDACTED_PII]'), 'Missing PII redaction token');

  // Strip comments and ensure executable code never accesses document.cookie, localStorage, or sessionStorage
  const codeOnly = telemetrySrc
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.ok(!codeOnly.includes('document.cookie'), 'telemetry.ts must not touch document.cookie');
  assert.ok(!codeOnly.includes('localStorage'), 'telemetry.ts must not touch localStorage');
  assert.ok(!codeOnly.includes('sessionStorage'), 'telemetry.ts must not touch sessionStorage');
});

// ---------------------------------------------------------------------------
// 5. Accessibility, Reduced-Motion & Component Security Hardening
// ---------------------------------------------------------------------------
const appSrc = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
const typingHeaderSrc = fs.readFileSync(path.join(rootDir, 'src/components/TypingHeader.tsx'), 'utf8');
const liveAgeBioSrc = fs.readFileSync(path.join(rootDir, 'src/components/LiveAgeBio.tsx'), 'utf8');
const pastelGlobeSrc = fs.readFileSync(path.join(rootDir, 'src/components/PastelGlobe.tsx'), 'utf8');
const indexCssSrc = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf8');

check('Accessibility & UX', 'src/App.tsx renders .skip-link, main#main[tabIndex=-1], and initializes telemetry', () => {
  assert.ok(appSrc.includes('className="skip-link"'), 'Missing .skip-link in App.tsx');
  assert.ok(appSrc.includes('href="#main"'), 'Skip link must target #main');
  assert.ok(appSrc.includes('tabIndex={-1}'), 'main landmark must have tabIndex={-1}');
  assert.ok(appSrc.includes('initTelemetry()'), 'App.tsx must call initTelemetry()');
});

check('Accessibility & Security', 'src/components/TypingHeader.tsx clamps stepDenominator to [1, 10] (SEC-01) and respects prefers-reduced-motion', () => {
  assert.ok(typingHeaderSrc.includes('Number.isFinite'), 'Missing Number.isFinite check in TypingHeader.tsx');
  assert.ok(
    typingHeaderSrc.includes('parsed >= 1 && parsed <= 10'),
    'Missing [1, 10] bounds check in TypingHeader.tsx'
  );
  assert.ok(
    typingHeaderSrc.includes('prefers-reduced-motion: reduce'),
    'Missing prefers-reduced-motion support in TypingHeader.tsx'
  );
  assert.ok(typingHeaderSrc.includes('className="sr-only"'), 'Missing .sr-only text in TypingHeader.tsx');
});

check('Accessibility & UX', 'src/components/LiveAgeBio.tsx isolates 50ms ticker from screen readers (sr-only + aria-live="off")', () => {
  assert.ok(liveAgeBioSrc.includes('className="sr-only"'), 'Missing static .sr-only age in LiveAgeBio.tsx');
  assert.ok(liveAgeBioSrc.includes('aria-live="off"'), 'Missing aria-live="off" on .age-ticker');
  assert.ok(liveAgeBioSrc.includes('aria-hidden="true"'), 'Missing aria-hidden="true" on .age-ticker');
});

check('Accessibility & WebGL Hygiene', 'src/components/PastelGlobe.tsx provides .globe-fallback, prefers-reduced-motion, keyboard rotation & disposal', () => {
  assert.ok(pastelGlobeSrc.includes('className="globe-fallback"'), 'Missing .globe-fallback in PastelGlobe.tsx');
  assert.ok(
    pastelGlobeSrc.includes('prefers-reduced-motion: reduce'),
    'Missing prefers-reduced-motion check in PastelGlobe.tsx'
  );
  assert.ok(pastelGlobeSrc.includes('scene.traverse'), 'Missing scene.traverse disposal in PastelGlobe.tsx');
  assert.ok(pastelGlobeSrc.includes('geometry.dispose()'), 'Missing geometry.dispose() in PastelGlobe.tsx');
  assert.ok(pastelGlobeSrc.includes('material.dispose()'), 'Missing material.dispose() in PastelGlobe.tsx');
});

check('Accessibility & Styling', 'src/index.css defines :focus-visible, .skip-link, .sr-only, .globe-fallback, and reduced-motion/mobile media queries', () => {
  for (const selector of [
    ':focus-visible',
    '.skip-link',
    '.sr-only',
    '.globe-fallback',
    'prefers-reduced-motion: reduce',
    'max-width: 640px',
  ]) {
    assert.ok(indexCssSrc.includes(selector), `Missing CSS rule in src/index.css: ${selector}`);
  }
});

// ---------------------------------------------------------------------------
// 6. Automate Friesland Microsite (`automate.greyson.nl`)
// ---------------------------------------------------------------------------
check('Automate Copy & Config', 'src/config/automateConfig.ts exists and defines automate.greyson.nl, grey.beimers@gmail.com, Friesland, and NL/EN copy', () => {
  const automateConfigPath = path.join(rootDir, 'src/config/automateConfig.ts');
  assert.ok(fs.existsSync(automateConfigPath), 'Missing src/config/automateConfig.ts');
  const src = fs.readFileSync(automateConfigPath, 'utf8');
  assert.ok(src.includes('automate.greyson.nl'), 'Missing automate.greyson.nl in automateConfig.ts');
  assert.ok(src.includes('grey.beimers@gmail.com'), 'Missing grey.beimers@gmail.com in automateConfig.ts');
  assert.ok(src.includes('Friesland'), 'Missing Friesland in automateConfig.ts');
  assert.ok(src.includes("export type AutomateLocale = 'nl' | 'en'"), 'Missing AutomateLocale type export');
});

check('Automate Component', 'src/components/AutomatePage.tsx exists, uses encodeURIComponent, enforces maxLength, and links mailto:grey.beimers@gmail.com', () => {
  const automatePagePath = path.join(rootDir, 'src/components/AutomatePage.tsx');
  assert.ok(fs.existsSync(automatePagePath), 'Missing src/components/AutomatePage.tsx');
  const src = fs.readFileSync(automatePagePath, 'utf8');
  assert.ok(src.includes('encodeURIComponent'), 'Missing encodeURIComponent in AutomatePage.tsx');
  assert.ok(src.includes('maxLength'), 'Missing maxLength bounds in AutomatePage.tsx');
  assert.ok(src.includes('mailto:grey.beimers@gmail.com'), 'Missing mailto:grey.beimers@gmail.com in AutomatePage.tsx');
  assert.ok(!src.includes('dangerouslySetInnerHTML'), 'Unsafe dangerouslySetInnerHTML found in AutomatePage.tsx');
});

check('Automate Styling & Routing', 'src/styles/automate.css, App.tsx routing, ContactSection.tsx link, .do/app.yaml domain & sitemap.xml are configured', () => {
  const automateCssPath = path.join(rootDir, 'src/styles/automate.css');
  assert.ok(fs.existsSync(automateCssPath), 'Missing src/styles/automate.css');
  const automateCss = fs.readFileSync(automateCssPath, 'utf8');
  assert.ok(automateCss.includes('.automate-scroll-root'), 'Missing .automate-scroll-root in automate.css');

  assert.ok(appSrc.includes('AutomatePage'), 'src/App.tsx must import/render AutomatePage');
  assert.ok(appSrc.includes("startsWith('automate.')"), 'src/App.tsx must detect automate.* hostname');

  const contactSectionSrc = fs.readFileSync(
    path.join(rootDir, 'src/components/ContactSection.tsx'),
    'utf8'
  );
  assert.ok(
    contactSectionSrc.includes('automation.greyson.nl') ||
      contactSectionSrc.includes('automate.greyson.nl'),
    'src/components/ContactSection.tsx must link to automation.greyson.nl or automate.greyson.nl'
  );

  const appYamlPath = path.join(rootDir, '.do/app.yaml');
  assert.ok(fs.existsSync(appYamlPath), 'Missing .do/app.yaml');
  const appYaml = fs.readFileSync(appYamlPath, 'utf8');
  assert.ok(appYaml.includes('domain: automate.greyson.nl'), 'Missing domain: automate.greyson.nl in .do/app.yaml');

  const distSitemap = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
  assert.ok(
    distSitemap.includes('https://automate.greyson.nl/'),
    'dist/sitemap.xml must include https://automate.greyson.nl/'
  );
});

// ---------------------------------------------------------------------------
// 7. Sprint 03 — Light + Red Theme, Subdomain Routing & PostHog Dashboard
// ---------------------------------------------------------------------------
check('Light + Red Theme', 'index.css, siteConfig.ts, index.html, App.tsx & PastelGlobe.tsx implement Light Background + Signature Red palette', () => {
  assert.ok(indexCssSrc.includes('--bg-base: #f7f5f2'), 'Missing light --bg-base token in index.css');
  assert.ok(indexCssSrc.includes('--pastel-red: #d94f48'), 'Missing signature red --pastel-red token in index.css');
  assert.ok(siteConfigSrc.includes("bgBase: '#F7F5F2'"), 'Missing bgBase #F7F5F2 in siteConfig.ts');
  assert.ok(siteConfigSrc.includes("primaryPastelRed: '#D94F48'"), 'Missing primaryPastelRed #D94F48 in siteConfig.ts');
  assert.ok(indexHtml.includes('content="#F7F5F2"'), 'Missing light theme-color #F7F5F2 in index.html');
  assert.ok(appSrc.includes('theme.defaultAlgorithm'), 'App.tsx must use Ant Design light theme.defaultAlgorithm');
  assert.ok(pastelGlobeSrc.includes('#EFECE6'), 'PastelGlobe.tsx ocean sphere must use warm light stone #EFECE6');
});

check('Subdomain Routing & CV', 'App.tsx routes greyson.nl/automation to automate, /over-mij to AboutMePage, about/cv to portfolio+CV, /dashboard to AnalyticsDashboard & DO app manifests isolate domains', () => {
  assert.ok(appSrc.includes('resolveViewFromLocation'), 'Missing resolveViewFromLocation in App.tsx');
  assert.ok(appSrc.includes("host.startsWith('dashboard.')"), 'App.tsx must route dashboard.*');
  assert.ok(appSrc.includes("host.startsWith('about.')"), 'App.tsx must route about.*');
  assert.ok(appSrc.includes("host.startsWith('cv.')"), 'App.tsx must route cv.*');
  assert.ok(appSrc.includes("host.startsWith('automation.')"), 'App.tsx must route automation.*');
  assert.ok(appSrc.includes("return { view: 'automate', portfolioMode: 'about' }"), 'App.tsx default route must be automate');
  assert.ok(appSrc.includes('initPostHogBridge()'), 'App.tsx must call initPostHogBridge()');

  const contactSectionSrc = fs.readFileSync(
    path.join(rootDir, 'src/components/ContactSection.tsx'),
    'utf8'
  );
  assert.ok(contactSectionSrc.includes('cv-card'), 'ContactSection.tsx must render .cv-card for cv.greyson.nl');
  assert.ok(siteConfigSrc.includes('cvSummary:'), 'siteConfig.ts must define cvSummary');

  const appYaml = fs.readFileSync(path.join(rootDir, '.do/app.yaml'), 'utf8');
  for (const domain of [
    'domain: greyson.nl',
    'domain: www.greyson.nl',
    'domain: automation.greyson.nl',
    'domain: automate.greyson.nl',
  ]) {
    assert.ok(appYaml.includes(domain), `Missing ${domain} in .do/app.yaml`);
  }
  assert.ok(
    !appYaml.includes('about.greyson.nl') && !appYaml.includes('cv.greyson.nl'),
    '.do/app.yaml must not claim about.greyson.nl or cv.greyson.nl (moved to .do/cv-about-app.yaml)'
  );

  const cvAboutYamlPath = path.join(rootDir, '.do/cv-about-app.yaml');
  assert.ok(fs.existsSync(cvAboutYamlPath), 'Missing .do/cv-about-app.yaml');
  const cvAboutYaml = fs.readFileSync(cvAboutYamlPath, 'utf8');
  assert.ok(
    cvAboutYaml.includes('name: greyson-cv-about'),
    'Missing name: greyson-cv-about in .do/cv-about-app.yaml'
  );
  for (const domain of ['domain: cv.greyson.nl', 'domain: about.greyson.nl']) {
    assert.ok(cvAboutYaml.includes(domain), `Missing ${domain} in .do/cv-about-app.yaml`);
  }

  const distSitemap = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
  for (const url of [
    'https://greyson.nl/',
    'https://greyson.nl/over-mij',
    'https://automation.greyson.nl/',
    'https://automate.greyson.nl/',
    'https://about.greyson.nl/',
    'https://cv.greyson.nl/',
  ]) {
    assert.ok(distSitemap.includes(url), `Missing ${url} in dist/sitemap.xml`);
  }
});

// ---------------------------------------------------------------------------
// 8. Sprint 04 — Clear Sections, Internal About Me Page & Free CV/About App Split
// ---------------------------------------------------------------------------
check('Clear Sections & About Me Page', 'AutomatePage uses numbered sections without external about/cv links; AboutMePage renders /over-mij cleanly', () => {
  const automatePageSrc = fs.readFileSync(path.join(rootDir, 'src/components/AutomatePage.tsx'), 'utf8');
  const aboutMePath = path.join(rootDir, 'src/components/AboutMePage.tsx');
  const automateConfigSrc = fs.readFileSync(path.join(rootDir, 'src/config/automateConfig.ts'), 'utf8');
  const dashboardSrc = fs.readFileSync(path.join(rootDir, 'src/components/AnalyticsDashboard.tsx'), 'utf8');
  const automateCss = fs.readFileSync(path.join(rootDir, 'src/styles/automate.css'), 'utf8');

  assert.ok(fs.existsSync(aboutMePath), 'Missing src/components/AboutMePage.tsx');
  const aboutMeSrc = fs.readFileSync(aboutMePath, 'utf8');

  for (const sectionId of [
    'id="diensten"',
    'id="automate-usecases"',
    'id="werkwijze"',
    'id="over-mij"',
    'id="automate-contact"',
  ]) {
    assert.ok(automatePageSrc.includes(sectionId), `Missing ${sectionId} in AutomatePage.tsx`);
  }

  for (const [label, src] of [
    ['AutomatePage.tsx', automatePageSrc],
    ['AboutMePage.tsx', aboutMeSrc],
    ['automateConfig.ts', automateConfigSrc],
    ['AnalyticsDashboard.tsx', dashboardSrc],
  ]) {
    assert.ok(
      !src.includes('about.greyson.nl') && !src.includes('cv.greyson.nl'),
      `${label} must not link to about.greyson.nl or cv.greyson.nl`
    );
  }

  assert.ok(automateConfigSrc.includes("aboutPath: '/over-mij'"), "automateConfig.ts must define aboutPath: '/over-mij'");
  assert.ok(appSrc.includes('AboutMePage'), 'App.tsx must import/render AboutMePage');
  assert.ok(appSrc.includes("'/over-mij'"), "App.tsx must route '/over-mij'");

  assert.ok(aboutMeSrc.includes('id="about-contact"'), 'Missing id="about-contact" in AboutMePage.tsx');
  assert.ok(aboutMeSrc.includes('mailto:grey.beimers@gmail.com'), 'Missing mailto:grey.beimers@gmail.com in AboutMePage.tsx');
  assert.ok(aboutMeSrc.includes('rel="noopener noreferrer"'), 'Missing rel="noopener noreferrer" on external links in AboutMePage.tsx');
  assert.ok(aboutMeSrc.includes('encodeURIComponent'), 'Missing encodeURIComponent in AboutMePage.tsx');
  assert.ok(aboutMeSrc.includes('maxLength'), 'Missing maxLength bounds in AboutMePage.tsx');

  for (const cls of ['.automate-steps-grid', '.automate-about-grid']) {
    assert.ok(automateCss.includes(cls), `Missing CSS selector in src/styles/automate.css: ${cls}`);
  }
});

check('PostHog & Dashboard', 'posthogClient.ts, AnalyticsDashboard.tsx & automate.css provide SHA-256 auth, live PostHog client & dashboard UI', () => {
  const posthogPath = path.join(rootDir, 'src/utils/posthogClient.ts');
  const dashboardPath = path.join(rootDir, 'src/components/AnalyticsDashboard.tsx');
  const automateCss = fs.readFileSync(path.join(rootDir, 'src/styles/automate.css'), 'utf8');

  assert.ok(fs.existsSync(posthogPath), 'Missing src/utils/posthogClient.ts');
  assert.ok(fs.existsSync(dashboardPath), 'Missing src/components/AnalyticsDashboard.tsx');

  const posthogSrc = fs.readFileSync(posthogPath, 'utf8');
  const dashboardSrc = fs.readFileSync(dashboardPath, 'utf8');

  for (const fn of [
    'export async function verifyOwnerPassphrase',
    'export function initPostHogBridge',
    'export function capturePostHogEvent',
    'export async function fetchPostHogAnalytics',
    'export async function verifyPostHogPersonalKey',
    'export function getLocalVisitorAnalytics',
  ]) {
    assert.ok(posthogSrc.includes(fn), `Missing export in posthogClient.ts: ${fn}`);
  }

  assert.ok(dashboardSrc.includes('verifyOwnerPassphrase'), 'AnalyticsDashboard must integrate verifyOwnerPassphrase');
  assert.ok(dashboardSrc.includes('verifyPostHogPersonalKey'), 'AnalyticsDashboard must integrate verifyPostHogPersonalKey');
  assert.ok(dashboardSrc.includes('Who Is Visiting'), 'AnalyticsDashboard must render Who Is Visiting table');
  assert.ok(dashboardSrc.includes('What They Do'), 'AnalyticsDashboard must render What They Do stream');

  for (const cls of ['.dashboard-root', '.dashboard-login-card', '.dashboard-kpi-grid', '.cv-card']) {
    assert.ok(automateCss.includes(cls), `Missing CSS selector in src/styles/automate.css: ${cls}`);
  }
});

// ---------------------------------------------------------------------------
// 9. Red Team / Blue Team Security Suite Integration (`SEC-01` .. `SEC-08`)
// ---------------------------------------------------------------------------
check('Security Ledger', 'All Red Team / Blue Team security controls (SEC-01 through SEC-08) pass verification', () => {
  const secResults = runSecurityAuditChecks();
  for (const item of secResults) {
    assert.ok(item.remediated, `Security check ${item.id} failed: ${item.title}`);
  }
});

// ---------------------------------------------------------------------------
// Summary Output
// ---------------------------------------------------------------------------
console.table(checks);
const failed = checks.filter((c) => c.status !== 'PASS');
if (failed.length > 0) {
  console.error(`QA verification failed (${failed.length}/${checks.length} checks failed).`);
  process.exit(1);
}
console.log(`All ${checks.length}/${checks.length} QA & Release Certification checks PASSED.`);
