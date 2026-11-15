/**
 * Greyson Web Studio — Security Audit Verification Suite (`red-team-hacker` / `security-qa`)
 * Verifies remediation status of SEC-01 through SEC-06 across source and configuration files.
 */
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function readIfExists(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

export function runSecurityAuditChecks() {
  const indexHtml = readIfExists('index.html');
  const viteConfig = readIfExists('vite.config.ts');
  const typingHeader = readIfExists('src/components/TypingHeader.tsx');
  const contactSection = readIfExists('src/components/ContactSection.tsx');
  const pastelGlobe = readIfExists('src/components/PastelGlobe.tsx');
  const automateConfig = readIfExists('src/config/automateConfig.ts');
  const automatePage = readIfExists('src/components/AutomatePage.tsx');
  const appYaml = readIfExists('.do/app.yaml');

  const submitTelemetryMatch = automatePage.match(
    /trackInteraction\(\s*'automate_inquiry_submit'\s*,\s*\{([\s\S]*?)\}\s*\)/
  );
  const submitTelemetryPayload = submitTelemetryMatch ? submitTelemetryMatch[1] : '';
  const hasZeroPiiSubmitTelemetry =
    Boolean(submitTelemetryMatch) &&
    !/\b(cleanName|cleanCompany|cleanContact|cleanMessage|name|company|contact|message|email|subject|body)\b/.test(
      submitTelemetryPayload
    );

  const maxLengthCount = (automatePage.match(/maxLength=\{/g) || []).length;

  const results = [
    {
      id: 'SEC-01',
      title: 'Bounded localStorage stepDenominator parsing in TypingHeader.tsx ([1, 10])',
      remediated:
        typingHeader.includes('Number.isFinite') &&
        ((typingHeader.includes('parsed >= 1') && typingHeader.includes('parsed <= 10')) ||
          (typingHeader.includes('Math.min') && typingHeader.includes('Math.max'))),
    },
    {
      id: 'SEC-02',
      title: 'Content-Security-Policy and Referrer-Policy meta tags in index.html',
      remediated:
        indexHtml.includes('Content-Security-Policy') &&
        indexHtml.includes("default-src 'self'") &&
        indexHtml.includes("object-src 'none'") &&
        indexHtml.includes('strict-origin-when-cross-origin'),
    },
    {
      id: 'SEC-03',
      title: 'HTTP Security Headers in vite.config.ts (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)',
      remediated:
        viteConfig.includes('X-Content-Type-Options') &&
        viteConfig.includes('nosniff') &&
        viteConfig.includes('X-Frame-Options') &&
        viteConfig.includes('Permissions-Policy'),
    },
    {
      id: 'SEC-04',
      title: 'External link tabnabbing protection, sourcemaps disabled & Three.js scene disposal',
      remediated:
        contactSection.includes('rel="noopener noreferrer"') &&
        viteConfig.includes('sourcemap: false') &&
        pastelGlobe.includes('scene.traverse') &&
        pastelGlobe.includes('geometry.dispose()'),
    },
    {
      id: 'SEC-05',
      title: 'AutomatePage.tsx safe rendering, encodeURIComponent mailto:, maxLength bounds & zero-PII telemetry',
      remediated:
        Boolean(automatePage) &&
        !automatePage.includes('dangerouslySetInnerHTML') &&
        !/\beval\s*\(/.test(automatePage) &&
        !automatePage.includes('.innerHTML') &&
        automatePage.includes('encodeURIComponent') &&
        automatePage.includes('mailto:grey.beimers@gmail.com') &&
        maxLengthCount >= 4 &&
        hasZeroPiiSubmitTelemetry,
    },
    {
      id: 'SEC-06',
      title: 'CSP form-action mailto:, automateConfig.ts domain/contact integrity & .do/app.yaml domain routing',
      remediated:
        indexHtml.includes("form-action 'self' mailto:") &&
        automateConfig.includes('automate.greyson.nl') &&
        automateConfig.includes('grey.beimers@gmail.com') &&
        automateConfig.includes('Friesland') &&
        appYaml.includes('domain: automate.greyson.nl'),
    },
  ];

  return results;
}

const results = runSecurityAuditChecks();
console.table(results);
const failed = results.filter((r) => !r.remediated);
if (failed.length > 0) {
  console.error(`Security audit failed: ${failed.map((f) => f.id).join(', ')}`);
  process.exit(1);
}
console.log(
  `All ${results[0].id} through ${results[results.length - 1].id} security checks PASSED (${results.length}/${results.length}).`
);
