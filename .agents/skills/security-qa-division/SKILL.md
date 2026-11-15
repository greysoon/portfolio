---
name: security-qa-division
description: >-
  Runbook for the Security & Quality Division (`red-team-hacker`, `blue-team-security`,
  and `qa-tester`). Use when running offensive security audits, penetration testing,
  DOM/localStorage fuzzing, CSP & header hardening, dependency vulnerability checks,
  and automated QA build/runtime verification.
---

# Security & Quality Division Runbook (`red-team-hacker`, `blue-team-security`, `qa-tester`)

## 1. Offensive Security / Red Team (`red-team-hacker`)
- **Allowed Write Paths**: `.agents/company/**`, `tests/security/**` (**Auditor: NEVER edit production code**)
- **Forbidden Write Paths**: `src/**`, `index.html`, `vite.config.ts`, `.do/**`
- **Core Checklist**:
  1. Perform an offensive recon and code/config security audit:
     - **Client Storage Manipulation / Logic Bugs**: Inspect `TypingHeader.tsx` where `window.localStorage.getItem('stepDenominator')` is converted via `Number(...)` without upper/lower/finite/positive bounds (e.g. negative values or `NaN`/`0`/tiny fractions like `0.00001` causing `steps[stepIndex].ms / denominator` to become `18,000,000ms` = 5-hour UI lockup/DoS!).
     - **Missing Content Security Policy (CSP) & Security Headers**: Inspect `index.html` and `.do/app.yaml` for missing CSP, `Referrer-Policy`, `X-Content-Type-Options`, and framing protections.
     - **Supply Chain & Dependency Audit**: Run `npm audit` to identify any vulnerable packages.
     - **External Resource & Link Hygiene**: Verify external links (`ContactSection.tsx`) and Google Fonts preconnects.
  2. Record every finding with a `Vuln ID` (`SEC-01`, `SEC-02`, ...), Severity, and exact Proof-of-Concept (PoC) in Section 4 of `.agents/company/board.md`.
  3. Send a direct `EXPLOIT` alert via `send_message` to `blue-team-security` (and `frontend-engineer` / `backend-devops`).
  4. In Wave 3, re-verify `blue-team-security`'s patches and mark verified items as `CLOSED` on `.agents/company/board.md`.

## 2. Defensive Security Engineer / Blue Team (`blue-team-security`)
- **Allowed Write Paths**: `index.html`, `vite.config.ts`, `.do/app.yaml`, `src/**` (security fixes only), `.agents/company/**`
- **Core Checklist**:
  1. Read `red-team-hacker`'s findings in Section 4 of `.agents/company/board.md` and incoming `send_message` DMs.
  2. Implement defensive remediations:
     - Harden `TypingHeader.tsx` `localStorage` parsing (`Number.isFinite`, clamping `denominator` strictly to `[1, 10]`) so tampered `localStorage` can never freeze the intro animation.
     - Add a strict, production-safe Content Security Policy (`<meta http-equiv="Content-Security-Policy" ...>`) and `<meta name="referrer" content="strict-origin-when-cross-origin" />` in `index.html` (allowing self, inline styles used by Antd, and `https://fonts.googleapis.com` / `https://fonts.gstatic.com`).
     - Add security headers in `vite.config.ts` (`server.headers` / `preview.headers`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).
  3. Update the Blue Team Remediation column in Section 4 of `.agents/company/board.md` and DM `red-team-hacker` and `qa-tester` via `send_message` for re-verification.

## 3. QA Automation & Browser Tester (`qa-tester`)
- **Allowed Write Paths**: `tests/**`, `.agents/company/**` (**Auditor: NEVER edit production code**)
- **Forbidden Write Paths**: `src/**`, `index.html`, `vite.config.ts`, `.do/**`
- **Core Checklist**:
  1. Write a clean verification script/test suite in `tests/verify-site.mjs` (Node.js structural, security, SEO, and build output assertions) and execute `npm run build` + `node tests/verify-site.mjs`.
  2. Verify all TypeScript types compile (`tsc -b`), `dist/` artifacts exist (`index.html`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, JS/CSS chunks), CSP and SEO tags are present, and `TypingHeader.tsx` clamps `stepDenominator`.
  3. Log full QA results in Section 6 and sign off in Section 8 of `.agents/company/board.md`, then DM `pm-director`.
