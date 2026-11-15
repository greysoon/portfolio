/**
 * Greyson Web Studio — Security Audit Verification Suite (`red-team-hacker`)
 * Verifies remediation status of SEC-01 through SEC-04 across source and configuration files.
 */
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

export function runSecurityAuditChecks() {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const viteConfig = fs.readFileSync(path.join(rootDir, 'vite.config.ts'), 'utf8');
  const typingHeader = fs.readFileSync(
    path.join(rootDir, 'src/components/TypingHeader.tsx'),
    'utf8'
  );
  const contactSection = fs.readFileSync(
    path.join(rootDir, 'src/components/ContactSection.tsx'),
    'utf8'
  );
  const pastelGlobe = fs.readFileSync(
    path.join(rootDir, 'src/components/PastelGlobe.tsx'),
    'utf8'
  );

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
console.log('All SEC-01 through SEC-04 security checks PASSED (4/4).');
