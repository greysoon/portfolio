/**
 * Build-time Static Site Prerenderer (`scripts/prerender.mjs`)
 *
 * Compiles `src/entry-server.tsx` via Vite SSR into a temporary folder,
 * renders full semantic HTML + route-specific SEO/OG/Twitter/hreflang/JSON-LD metadata
 * for every public route (`/`, `/over-mij`, `/about`, `/en`, `/en/about`),
 * and writes static `index.html` files inside `dist/` so search engines and AI bots
 * receive complete HTML with HTTP 200 OK without requiring JS execution.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import react from '@vitejs/plugin-react';
import { build as viteBuild } from 'vite';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const ssrTempDir = path.join(rootDir, '.ssr-temp');

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function replaceOrThrow(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Prerender template mismatch for ${label}`);
  }
  return source.replace(pattern, replacement);
}

function buildHeadAdjustedHtml(templateHtml, route, renderedHtml, seo, canonicalOverride) {
  const effectiveCanonical = canonicalOverride || seo.canonicalUrl;
  const effectiveOgUrl = canonicalOverride || seo.ogUrl;

  let html = templateHtml;

  html = replaceOrThrow(
    html,
    /<html lang="[^"]*">/,
    `<html lang="${escapeHtmlAttr(seo.lang)}">`,
    'html lang'
  );

  html = replaceOrThrow(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtmlAttr(seo.description)}" />`,
    'meta description'
  );

  html = replaceOrThrow(
    html,
    /<meta\s+name="keywords"\s+content="[^"]*"\s*\/>/,
    `<meta name="keywords" content="${escapeHtmlAttr(seo.keywords)}" />`,
    'meta keywords'
  );

  html = replaceOrThrow(
    html,
    /<meta name="robots" content="[^"]*" \/>/,
    `<meta name="robots" content="${escapeHtmlAttr(seo.robots)}" />`,
    'meta robots'
  );

  html = replaceOrThrow(
    html,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${escapeHtmlAttr(effectiveCanonical)}" />`,
    'canonical link'
  );

  const alternatesBlock = seo.alternates
    .map(
      (alt) =>
        `    <link rel="alternate" hreflang="${escapeHtmlAttr(alt.hreflang)}" href="${escapeHtmlAttr(alt.href)}" />`
    )
    .join('\n');

  html = replaceOrThrow(
    html,
    /(?:\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>)+/,
    alternatesBlock ? `\n${alternatesBlock}` : '',
    'hreflang links'
  );

  html = replaceOrThrow(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escapeHtmlAttr(seo.title)}" />`,
    'og:title'
  );

  html = replaceOrThrow(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escapeHtmlAttr(seo.description)}" />`,
    'og:description'
  );

  html = replaceOrThrow(
    html,
    /<meta property="og:type" content="[^"]*" \/>/,
    `<meta property="og:type" content="${escapeHtmlAttr(seo.ogType)}" />`,
    'og:type'
  );

  html = replaceOrThrow(
    html,
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${escapeHtmlAttr(effectiveOgUrl)}" />`,
    'og:url'
  );

  html = replaceOrThrow(
    html,
    /<meta property="og:locale" content="[^"]*" \/>/,
    `<meta property="og:locale" content="${escapeHtmlAttr(seo.ogLocale)}" />`,
    'og:locale'
  );

  html = replaceOrThrow(
    html,
    /<meta property="og:locale:alternate" content="[^"]*" \/>/,
    `<meta property="og:locale:alternate" content="${escapeHtmlAttr(seo.ogLocaleAlternate)}" />`,
    'og:locale:alternate'
  );

  html = replaceOrThrow(
    html,
    /<meta property="og:image" content="[^"]*" \/>/,
    `<meta property="og:image" content="${escapeHtmlAttr(seo.ogImage)}" />`,
    'og:image'
  );

  html = replaceOrThrow(
    html,
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image:alt" content="${escapeHtmlAttr(seo.ogImageAlt)}" />`,
    'og:image:alt'
  );

  html = replaceOrThrow(
    html,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${escapeHtmlAttr(seo.twitterTitle)}" />`,
    'twitter:title'
  );

  html = replaceOrThrow(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escapeHtmlAttr(seo.twitterDescription)}" />`,
    'twitter:description'
  );

  html = replaceOrThrow(
    html,
    /<meta name="twitter:image" content="[^"]*" \/>/,
    `<meta name="twitter:image" content="${escapeHtmlAttr(seo.ogImage)}" />`,
    'twitter:image'
  );

  html = replaceOrThrow(
    html,
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:image:alt" content="${escapeHtmlAttr(seo.ogImageAlt)}" />`,
    'twitter:image:alt'
  );

  html = replaceOrThrow(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtmlText(seo.title)}</title>`,
    'title'
  );

  const safeJsonLd = JSON.stringify(seo.jsonLd, null, 2).replace(/<\//g, '<\\/');
  html = replaceOrThrow(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${safeJsonLd}\n    </script>`,
    'JSON-LD'
  );

  html = replaceOrThrow(
    html,
    /<div id="root"><\/div>/,
    `<div id="root" data-prerender-view="${escapeHtmlAttr(route.view)}" data-prerender-lang="${escapeHtmlAttr(route.locale)}">${renderedHtml}</div>`,
    'root container'
  );

  return html;
}

async function run() {
  const baseHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(baseHtmlPath)) {
    throw new Error('dist/index.html not found; run vite build before prerender.');
  }
  const templateHtml = fs.readFileSync(baseHtmlPath, 'utf8');

  fs.rmSync(ssrTempDir, { recursive: true, force: true });

  try {
    await viteBuild({
      configFile: false,
      plugins: [react()],
      logLevel: 'silent',
      build: {
        ssr: path.join(rootDir, 'src/entry-server.tsx'),
        outDir: ssrTempDir,
        emptyOutDir: true,
        rollupOptions: {
          output: {
            entryFileNames: 'entry-server.mjs',
          },
        },
      },
    });

    const serverEntryUrl = pathToFileURL(
      path.join(ssrTempDir, 'entry-server.mjs')
    ).href;
    const { renderRouteToString } = await import(serverEntryUrl);

    const targets = [
      {
        outFile: path.join(distDir, 'index.html'),
        route: { view: 'automate', portfolioMode: 'about', locale: 'nl' },
      },
      {
        outFile: path.join(distDir, 'over-mij', 'index.html'),
        route: { view: 'about', portfolioMode: 'about', locale: 'nl' },
      },
      {
        outFile: path.join(distDir, 'about', 'index.html'),
        route: { view: 'about', portfolioMode: 'about', locale: 'nl' },
        canonicalOverride: 'https://greyson.nl/over-mij',
      },
      {
        outFile: path.join(distDir, 'en', 'index.html'),
        route: { view: 'automate', portfolioMode: 'about', locale: 'en' },
      },
      {
        outFile: path.join(distDir, 'en', 'about', 'index.html'),
        route: { view: 'about', portfolioMode: 'about', locale: 'en' },
      },
    ];

    for (const target of targets) {
      const { html, seo } = renderRouteToString(target.route);
      const finalHtml = buildHeadAdjustedHtml(
        templateHtml,
        target.route,
        html,
        seo,
        target.canonicalOverride
      );
      fs.mkdirSync(path.dirname(target.outFile), { recursive: true });
      fs.writeFileSync(target.outFile, finalHtml, 'utf8');
      const rel = path.relative(rootDir, target.outFile);
      console.log(`Prerendered ${rel} (${(Buffer.byteLength(finalHtml, 'utf8') / 1024).toFixed(2)} kB)`);
    }
  } finally {
    fs.rmSync(ssrTempDir, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
