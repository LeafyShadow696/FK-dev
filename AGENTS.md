# Agent Instructions for fkdev.xyz

## Project Summary

This repository contains the production business landing page for **František Kalášek / TopBot PwnZ™**.

Canonical production domain: `https://fkdev.xyz`  
Secondary domain behavior: `https://www.fkdev.xyz` redirects to `https://fkdev.xyz`  
AI-readable public summary: `https://fkdev.xyz/llms.txt`  
Sitemap: `https://fkdev.xyz/sitemap.xml`  
Robots policy: `https://fkdev.xyz/robots.txt`

The site presents practical services around web applications, PWA solutions, automation, API integrations, cloud/self-hosted systems, data workflows, hosting support, and technology consulting. It is a public business identity site, not a demo app.

## Current Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- Wouter client-side routing
- Framer Motion
- Three.js via `@react-three/fiber` and `@react-three/drei`
- Vercel Analytics and Speed Insights
- Playwright e2e tests
- Production deployment on Vercel

## Important Commands

Use Windows PowerShell compatible commands in this repository.

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run test:e2e
```

For local production-like verification:

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173'; npm.cmd run test:e2e
```

For production e2e:

```powershell
$env:PLAYWRIGHT_BASE_URL='https://fkdev.xyz'; npm.cmd run test:e2e
```

Production deploy uses Vercel:

```powershell
npx.cmd --yes vercel@latest deploy --prod
```

## Repository Map

- `src/App.tsx` - app shell, routes, analytics, JSON-LD, consent provider.
- `src/main.tsx` - React entrypoint.
- `src/pages/` - routed pages:
  - `/`
  - `/sluzby`
  - `/spoluprace`
  - `/priklady`
  - `/kontakt`
  - `/portal` - private admin portal entrypoint
  - legal/privacy/cookies/terms pages
- `api/admin/[action].ts` - Vercel serverless admin API for login, session, logout, and overview.
- `src/components/layout/` - header, footer, map, theme toggle.
- `src/components/sections/` - landing page and content sections.
- `src/components/privacy/ConsentProvider.tsx` - cookie/consent state.
- `src/components/three/` - lazy-loaded Three.js hero background.
- `src/data/business.ts` - canonical public business identity and contact data.
- `src/data/adminPortal.ts` - admin portal integration labels and principles.
- `src/data/services.ts` - service content model.
- `src/utils/seo.ts` - runtime SEO metadata.
- `src/utils/structuredData.ts` - schema.org structured data.
- `public/brand/` - production logo and business profile image exports.
- `public/llms.txt` - public AI-readable site summary.
- `tests/e2e/smoke.spec.ts` - production smoke coverage.

## Public Business Facts

Keep these consistent across code, metadata, vCard, README, sitemap, and AI docs:

- Legal name: `František Kalášek`
- Brand: `TopBot PwnZ™`
- Domain: `fkdev.xyz`
- URL: `https://fkdev.xyz`
- Business ID: `23628588`
- Email: `FandaKalasek@icloud.com`
- Phone: `+420 722 426 195`
- Contact address: `Javorek 54, 592 03 Javorek, Česko`
- Registered office: `Daňkovice 9, 592 03 Daňkovice, Česko`
- Motto: `Bridge the gap, create the world.`

Do not invent client references, certifications, opening hours, pricing, or legal claims. If changing public identity data, update `src/data/business.ts`, `public/frantisek-kalasek.vcf`, SEO metadata, README, sitemap/robots if relevant, and tests.

## Design and UX Rules

- Default color mode is dark.
- Theme toggle supports `dark`, `light`, and `system`.
- Persisted theme preference is optional and depends on consent preferences.
- Icons should be simple monochrome line icons unless they are part of a primary CTA or brand asset.
- Brand name/signature uses the handwriting-style `Playwrite CZ` font with a light, monogram-adjacent feel.
- The signature gradient should remain subtle and slow, animated from orange through midnight blue to deep purple, with reduced-motion support.
- The site should feel minimal, professional, Apple-native-like, and easy to scan.
- Do not add marketing hero fluff or large generic landing page sections.
- Do not put logos inside the Three.js hero background.
- Avoid visible text that explains UI mechanics; the interface should be self-evident.
- Maintain mobile readability and no horizontal overflow.

## Brand Assets

Primary web mark assets:

- `/brand/fk-mark-light-transparent.png`
- `/brand/fk-mark-dark-transparent.png`

Business profile exports:

- `/brand/fk-business-logo-google-720.png`
- `/brand/fk-business-logo-google-720-white.png`
- `/brand/fk-business-logo-apple-1024.png`
- `/brand/fk-business-logo-apple-1024-dark.png`

vCard image:

- `/brand/fk-vcard-logo.png`

When editing logos, preserve transparent backgrounds where expected. Avoid reintroducing dark or white rectangular image backgrounds around the mark.

## Content Rules

- Public copy is Czech-first.
- Use correct Czech diacritics, punctuation, and natural word order.
- Keep copy practical, specific, and truthful.
- Prefer clear outcomes over vague claims.
- Avoid exaggerated promises such as guaranteed leads, guaranteed rankings, or unsupported performance claims.
- Legal/privacy/cookie pages must stay factual and conservative.
- The public site does not use a custom contact form; contact is direct e-mail, phone, map links, and vCard.

## SEO and AI Discovery

Canonical URL is `https://fkdev.xyz`.

Maintain:

- canonical link
- Open Graph metadata
- Twitter card metadata
- schema.org JSON-LD
- `public/sitemap.xml`
- `public/robots.txt`
- `public/llms.txt`
- vCard file

When adding major public pages, add them to routing, sitemap, tests, and AI summary. Private/admin routes should not be added to the sitemap and should be disallowed in `robots.txt`.

## Testing Expectations

For UI/content/asset changes:

1. Run `npm.cmd run check`.
2. Run `npm.cmd run build`.
3. Run e2e locally against preview when behavior or routing changed.
4. Run production e2e after deployment.
5. For visual changes, verify mobile and desktop states, especially header, hero, contact card, logos, theme toggle, and no horizontal overflow.

The e2e suite intentionally checks:

- routes
- contact actions
- vCard
- map links
- mobile navigation
- logo asset rendering
- theme persistence and default dark mode
- cookie preferences
- SEO metadata
- AI summary
- manifest/icons

Update tests when changing expected behavior.

## Deployment Notes

The project is deployed on Vercel. Current production alias should be `https://fkdev.xyz`.

Vercel creates deployment URLs under `.vercel.app`; these are expected for deployment internals and previews. Do not treat them as canonical production URLs.

If changing Vercel domain behavior, verify:

- `https://fkdev.xyz/` returns `200`
- `https://www.fkdev.xyz/` returns a permanent redirect to `https://fkdev.xyz/`
- `https://fkdev.xyz/llms.txt` returns `200 text/plain`

## Admin Portal

The `/portal` route is the private admin entrypoint. It currently provides:

- admin login UI
- Vercel serverless API under `/api/admin/[action]`
- HttpOnly cookie session
- environment readiness checks
- integration status placeholders for Vercel, GitHub, Render, Railway, database, and cloud storage

Required server-side env vars before production admin login can work:

- `FK_ADMIN_ACCESS_KEY` - long private admin login key, minimum 16 characters.
- `FK_ADMIN_SESSION_SECRET` - long random HMAC secret, minimum 32 characters.

Future provider integration env vars:

- `VERCEL_API_TOKEN`
- `GITHUB_TOKEN`
- `RENDER_API_KEY`
- `RAILWAY_API_TOKEN`
- `DATABASE_URL`
- `FK_STORAGE_CONNECTION`

Keep this route private. Do not expose dashboard data without a verified server-side session. Do not add provider tokens to frontend code. Do not add `/portal` to the public sitemap.

Do not commit secrets, API keys, tokens, private credentials, or personal session artifacts.

## Coding Conventions

- Follow existing React/TypeScript/Tailwind patterns.
- Keep changes scoped.
- Prefer existing helpers and components over new abstractions.
- Use `src/data/business.ts` for public identity data.
- Use `src/data/services.ts` for service content.
- Keep icons from `lucide-react`.
- Use CSS/Tailwind for presentational changes.
- Use lazy loading for heavy visual modules where appropriate.
- Do not hand-roll major backend/auth/database architecture inside the static site without an approved plan.

## Agent Workflow

- Read the relevant files before editing.
- Do not revert unrelated user changes.
- Keep git history intentional.
- Run checks before committing.
- Update `AGENTS.md` and related agent instruction files when architecture, routes, env vars, deployment behavior, or conventions change.
- After deployment, summarize exact commit, production URL, and verification results.
