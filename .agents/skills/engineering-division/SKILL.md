---
name: engineering-division
description: >-
  Runbook for the Engineering Division (`frontend-engineer` and `backend-devops`).
  Use when implementing React 18 components, Three.js WebGL scenes (`PastelGlobe.tsx`),
  accessibility/UX improvements, Vite build chunking (`vite.config.ts`), or
  DigitalOcean deployment configuration (`.do/app.yaml`).
---

# Engineering Division Runbook (`frontend-engineer` & `backend-devops`)

## 1. Senior Frontend Engineer (`frontend-engineer`)
- **Allowed Write Paths**: `src/components/**`, `src/App.tsx`, `src/main.tsx`, `src/index.css`, `.agents/company/**`
- **Forbidden Write Paths**: `.do/**`
- **Core Checklist**:
  1. Read specs from `ui-ux-designer`, `copywriter`, `marketing-seo`, `data-analytics`, and `blue-team-security` in `.agents/company/board.md` and incoming `send_message` DMs.
  2. Implement component improvements cleanly:
     - `TypingHeader.tsx`: Support `prefers-reduced-motion` (skip/accelerate intro when requested) and ensure safe bounds on `localStorage.getItem('stepDenominator')` in coordination with `blue-team-security`.
     - `LiveAgeBio.tsx`: Prevent screen-reader chattiness on the 50ms ticker (`aria-live="off"` or polite static label on the rapidly ticking span).
     - `PastelGlobe.tsx`: Add graceful WebGL context fallback (in case WebGL is disabled/unavailable in headless or restricted browsers) and respect `prefers-reduced-motion`.
     - Wire up telemetry helpers from `src/utils/telemetry.ts` (created by `data-analytics`).
  3. Message `qa-tester` and `ui-ux-designer` via `send_message` once changes are complete, and log all modified files in Section 5.1 of `.agents/company/board.md`.

## 2. Backend & DevOps Engineer (`backend-devops`)
- **Allowed Write Paths**: `vite.config.ts`, `package.json`, `tsconfig.json`, `.do/**`, `scripts/**`, `.agents/company/**`
- **Forbidden Write Paths**: `src/components/**`
- **Core Checklist**:
  1. Optimize `vite.config.ts` build configuration (e.g., manual vendor chunking for `three` and `antd` so the initial bundle stays fast and cache-friendly).
  2. Coordinate with `blue-team-security` on `.do/app.yaml` and `vite.config.ts` security headers / build settings.
  3. Verify `npm run build` succeeds and report bundle sizes in Section 5.2 of `.agents/company/board.md`.
