---
name: growth-content-division
description: >-
  Runbook for the Growth, Content & Data Division (`copywriter`, `marketing-seo`,
  and `data-analytics`). Use when crafting brand copy (`siteConfig.ts`), technical
  SEO metadata, OpenGraph/Twitter tags, Schema.org JSON-LD (`index.html`),
  `robots.txt`, `sitemap.xml`, or privacy-first Web Vitals telemetry (`src/utils/`).
---

# Growth, Content & Data Division Runbook (`copywriter`, `marketing-seo`, `data-analytics`)

## 1. Lead Copywriter & Storyteller (`copywriter`)
- **Allowed Write Paths**: `src/config/siteConfig.ts`, `.agents/company/**`
- **Forbidden Write Paths**: `src/components/**`, `vite.config.ts`
- **Core Checklist**:
  1. Audit `src/config/siteConfig.ts` and brand messaging across the site.
  2. Enrich `siteConfig.ts` with well-structured SEO/brand metadata fields (e.g., `tagline`, `description`, `siteUrl`, `keywords`) while preserving all existing properties (`headerText`, `birthDate`, `role`, `email`, `linkedinUrl`, `location`, `colors`) so existing components remain 100% compatible.
  3. Send copy & tagline updates directly to `marketing-seo` and `frontend-engineer` via `send_message`, and log in Section 3.1 of `.agents/company/board.md`.

## 2. Marketing & Technical SEO Lead (`marketing-seo`)
- **Allowed Write Paths**: `index.html`, `public/**` (`robots.txt`, `sitemap.xml`, `manifest.webmanifest`), `.agents/company/**`
- **Forbidden Write Paths**: `src/components/**`
- **Core Checklist**:
  1. Upgrade `index.html` `<head>` with:
     - Canonical URL (`https://greyson.nl/`)
     - Rich meta description & keywords aligned with `copywriter`
     - OpenGraph (`og:title`, `og:description`, `og:type`, `og:url`, `og:locale`) and Twitter Card tags
     - Schema.org `Person` structured data (`application/ld+json`) for Greyson Beimers
  2. Create `public/robots.txt`, `public/sitemap.xml`, and `public/manifest.webmanifest`.
  3. Coordinate with `blue-team-security` so `index.html` edits (SEO + CSP) do not conflict, and log deliverables in Section 3.2 of `.agents/company/board.md`.

## 3. Data & Web Vitals Specialist (`data-analytics`)
- **Allowed Write Paths**: `src/utils/**`, `.agents/company/**`
- **Forbidden Write Paths**: `src/components/**`
- **Core Checklist**:
  1. Create a lightweight, zero-dependency, privacy-first telemetry & Web Vitals utility at `src/utils/telemetry.ts` (measuring page load/FCP/LCP via `PerformanceObserver` and exposing safe interaction tracking helpers without cookies or PII).
  2. Message `frontend-engineer` and `marketing-seo` via `send_message` with integration instructions and log in Section 3.3 of `.agents/company/board.md`.
