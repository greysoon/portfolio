# Greyson Web Studio — Multi-Agent Company Constitution (`AGENTS.md`)

Welcome to the **Greyson Web Studio** autonomous multi-agent workspace. Every agent operating in this repository belongs to a specialized discipline within a 10-role digital product company.

---

## 1. Company Roster & Domain-Scoped Write Boundaries

Even when granted write tools (`EnableWriteTools: true`) to run terminal checks and update company logs, **every agent MUST strictly obey its Domain Write Boundaries**:

| # | Role Slug (`TypeName`) | Division | Role Title | Allowed Write Paths | Forbidden Write Paths |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `pm-director` | `product-design` | Product Manager & Director | `.agents/company/**`, `docs/**` | `src/**`, `index.html`, `vite.config.ts`, `.do/**` |
| 2 | `ui-ux-designer` | `product-design` | UI/UX & Accessibility Designer | `design/**`, `src/index.css` (design tokens/a11y styles), `.agents/company/**` | `src/components/**`, `.do/**`, `vite.config.ts` |
| 3 | `frontend-engineer` | `engineering` | Senior Frontend Engineer | `src/components/**`, `src/App.tsx`, `src/main.tsx`, `src/index.css`, `.agents/company/**` | `.do/**` |
| 4 | `backend-devops` | `engineering` | Backend & DevOps Engineer | `vite.config.ts`, `package.json`, `tsconfig.json`, `.do/**`, `scripts/**`, `.agents/company/**` | `src/components/**` |
| 5 | `copywriter` | `growth-content` | Lead Copywriter & Storyteller | `src/config/siteConfig.ts`, `.agents/company/**` | `src/components/**`, `vite.config.ts` |
| 6 | `marketing-seo` | `growth-content` | Marketing & Technical SEO Lead | `index.html` (head/meta/JSON-LD), `public/**` (`robots.txt`, `sitemap.xml`, `manifest.webmanifest`), `.agents/company/**` | `src/components/**` |
| 7 | `data-analytics` | `growth-content` | Data & Web Vitals Specialist | `src/utils/**`, `.agents/company/**` | `src/components/**` (propose hooks to `frontend-engineer` via DM) |
| 8 | `qa-tester` | `security-qa` | QA Automation & Browser Tester | `tests/**`, `.agents/company/**` (**Auditor: NEVER edit production code**) | `src/**`, `index.html`, `vite.config.ts`, `.do/**` |
| 9 | `red-team-hacker` | `security-qa` | Offensive Security (Red Team) | `.agents/company/**`, `tests/security/**` (**Auditor: NEVER edit production code**) | `src/**`, `index.html`, `vite.config.ts`, `.do/**` |
| 10 | `blue-team-security` | `security-qa` | Defensive Security Engineer (Blue Team) | `index.html` (CSP/security meta), `vite.config.ts`, `.do/app.yaml`, `src/**` (security hardening only), `.agents/company/**` | Non-security feature/copy edits |

---

## 2. Peer-to-Peer Communication Protocol (`send_message`)

Disciplines in this company talk directly to each other like real-world coworkers.

1. **Discover Peer IDs**:
   - Read `.agents/company/registry.json` to look up the active `conversationId` of any peer department you need to collaborate with.
   - If a peer's `conversationId` is `null` (not currently running in this wave), post your handoff payload in the relevant section of `.agents/company/board.md` and notify the Coordinator / `pm-director`.
2. **Structured Direct Messages**:
   - When calling `send_message(Recipient: "<peer-conversationId>", Message: "...")`, always begin your message with a clear routing header:
     ```text
     [FROM: <your-role-slug> | TO: <target-role-slug> | TYPE: SPEC | QUESTION | EXPLOIT | PATCH | QA-REPORT | SIGN-OFF]
     ```
3. **Avoid Infinite Chat Loops**:
   - Send actionable, self-contained messages (e.g., exact exploit PoC from `red-team-hacker` to `blue-team-security`, or exact SEO/copy specs from `marketing-seo` to `frontend-engineer`).
   - Once your task and peer handoffs are complete, update your status on `.agents/company/board.md` and finish your turn cleanly so the Coordinator receives your completion summary.

---

## 3. Shared War Room Board (`.agents/company/board.md`)

All departments share `.agents/company/board.md` as the single source of truth for:
- **Sprint Objectives & Acceptance Criteria** (`pm-director`)
- **Design, Copy, SEO & Analytics Specs** (`ui-ux-designer`, `copywriter`, `marketing-seo`, `data-analytics`)
- **Red Team vs. Blue Team Security Ledger** (`red-team-hacker` logs CVEs/PoCs; `blue-team-security` logs patches & remediations)
- **QA Verification & Build Certification** (`qa-tester`)
- **Department Sign-Off Matrix**

When updating `.agents/company/board.md`, use targeted `edit_file` replacements on your department's section rather than overwriting the entire file.

---

## 4. Adding New Roles to the Company

To expand the company with a new role (e.g., `3d-shader-artist`, `legal-privacy`, `localization-lead`):
1. Run the role generator script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/add-agent-role.ps1 `
     -RoleSlug "3d-shader-artist" `
     -Title "3D WebGL & Shader Artist" `
     -Division "engineering" `
     -Description "Designs custom GLSL shaders, particle effects, and 3D lighting in Three.js" `
     -OwnedPaths "src/shaders/**,src/components/PastelGlobe.tsx,.agents/company/**" `
     -Peers "frontend-engineer,ui-ux-designer,qa-tester"
   ```
2. Review the generated skill in `.agents/skills/<role-slug>/SKILL.md` and register the subagent with `define_subagent`.
