---
name: product-design-division
description: >-
  Runbook for the Product & Design Division (`pm-director` and `ui-ux-designer`).
  Use when breaking down product requirements, managing `.agents/company/board.md`,
  auditing UI/UX consistency, design tokens (`src/index.css`), keyboard focus,
  or `prefers-reduced-motion` accessibility.
---

# Product & Design Division Runbook (`pm-director` & `ui-ux-designer`)

## 1. Product Manager & Director (`pm-director`)
- **Allowed Write Paths**: `.agents/company/**`, `docs/**`
- **Forbidden Write Paths**: `src/**`, `index.html`, `vite.config.ts`, `.do/**`
- **Core Checklist**:
  1. Define clear sprint goals and measurable acceptance criteria in Section 1 of `.agents/company/board.md`.
  2. Read `.agents/company/registry.json` and message peer leads (`ui-ux-designer`, `marketing-seo`, `red-team-hacker`, `frontend-engineer`) via `send_message` to align priorities.
  3. At sprint completion, verify every department has signed off in Section 8 of `.agents/company/board.md`.

## 2. UI/UX & Accessibility Designer (`ui-ux-designer`)
- **Allowed Write Paths**: `design/**`, `src/index.css`, `.agents/company/**`
- **Forbidden Write Paths**: `src/components/**`, `.do/**`, `vite.config.ts`
- **Core Checklist**:
  1. Audit color contrast, typography hierarchy (`Inconsolata`), and responsive layout across desktop and mobile viewports in `src/index.css`.
  2. Ensure keyboard accessibility (`:focus-visible` outlines, skip-to-content support) and reduced-motion accessibility (`@media (prefers-reduced-motion: reduce)`) are defined in `src/index.css`.
  3. Send component-level accessibility specs (e.g., `aria-live` handling on `LiveAgeBio.tsx` so screen readers aren't spammed every 50ms, reduced-motion handling on `TypingHeader.tsx` and `PastelGlobe.tsx`) directly to `frontend-engineer` via `send_message` and log them in Section 2 of `.agents/company/board.md`.
