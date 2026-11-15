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
// 6. Red Team / Blue Team Security Suite Integration (`SEC-01` .. `SEC-04`)
// ---------------------------------------------------------------------------
check('Security Ledger', 'All Red Team / Blue Team security controls (SEC-01 through SEC-04) pass verification', () => {
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
