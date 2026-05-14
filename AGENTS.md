# Agent Instructions for fkdev.xyz

## Source of Truth

This file is the canonical project knowledge base for all AI agents working in
this repository. Read it first, then read `docs/ai-agent-handoff.md` for the
operational handoff, restore procedure, provider map, and safety rules.

Agent-specific entrypoints:

- `GEMINI.md` - Gemini CLI project context.
- `CLAUDE.md` - Claude Code project context.
- `GROK.md` - Grok project context.
- `.github/copilot-instructions.md` - GitHub Copilot repository guidance.

When architecture, routes, env vars, deployment behavior, brand data, or testing
expectations change, update this file and the related agent files in the same
commit.

## Project Summary

This repository contains the production business landing page for
**František Kalášek / TopBot PwnZ™**.

Canonical production domain: `https://fkdev.xyz`  
Secondary domain behavior: `https://www.fkdev.xyz` redirects to `https://fkdev.xyz`  
AI-readable public summary: `https://fkdev.xyz/llms.txt`  
Sitemap: `https://fkdev.xyz/sitemap.xml`  
Robots policy: `https://fkdev.xyz/robots.txt`

The site presents practical services around web applications, PWA solutions,
automation, API integrations, cloud/self-hosted systems, data workflows, hosting
support, and technology consulting. It is a public business identity site, not a
demo app.

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
- Vercel serverless admin API under `api/admin/[action].ts`
- Python FastAPI backend under `backend/`, deployed on Render
- Render Postgres for future persistent admin data

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

Python backend sanity check:

```powershell
cd backend
.\.venv\Scripts\python.exe -m compileall app
```

If `.venv` does not exist:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m compileall app
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
- `api/admin/[action].ts` - Vercel serverless admin API for login, session, logout, overview, and provider status.
- `backend/` - Python FastAPI admin API intended for Render.
- `docs/admin-portal-architecture.md` - backend, database, storage, and secret-handling plan.
- `docs/ai-agent-handoff.md` - full AI-agent handoff and disaster-recovery guide.
- `render.yaml` - Render Blueprint for the Python admin API and Render Postgres.
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

Do not invent client references, certifications, opening hours, pricing, or legal
claims. If changing public identity data, update `src/data/business.ts`,
`public/frantisek-kalasek.vcf`, SEO metadata, README, sitemap/robots if relevant,
and tests.

## Design and UX Rules

- Default color mode is dark.
- Theme toggle supports `dark`, `light`, and `system`.
- Persisted theme preference is optional and depends on consent preferences.
- Icons should be simple monochrome line icons unless they are part of a primary CTA or brand asset.
- Brand name/signature uses a professional handwriting-style font with a light, monogram-adjacent feel.
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

When editing logos, preserve transparent backgrounds where expected. Avoid
reintroducing dark or white rectangular image backgrounds around the mark.

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

When adding major public pages, add them to routing, sitemap, tests, and AI
summary. Private/admin routes should not be added to the sitemap and should be
disallowed in `robots.txt`.

## Admin Portal

The `/portal` route is the private admin entrypoint. It currently provides:

- admin login UI
- Vercel serverless API under `/api/admin/[action]`
- HttpOnly cookie session
- environment readiness checks
- integration status placeholders for Vercel, GitHub, Render, Railway, database, storage, and AI
- live provider summaries for Vercel deployments and GitHub repository/commit state
- Python/FastAPI backend integration summary
- Render backend health visibility through `RENDER_BACKEND_URL`

Required server-side env vars before production admin login can work:

- `FK_ADMIN_ACCESS_KEY` - long private admin login key, minimum 16 characters.
- `FK_ADMIN_SESSION_SECRET` - long random HMAC secret, minimum 32 characters.

Provider integration env vars:

- `VERCEL_API_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_API_KEY`
- `GITHUB_TOKEN`
- `GITHUB_API_KEY`
- `RENDER_API_KEY`
- `RAILWAY_API_TOKEN`
- `RAILWAY_API_KEY`
- `DATABASE_URL`
- `FK_STORAGE_CONNECTION`
- `RENDER_BACKEND_URL` - currently `https://fkdev-admin-api.onrender.com`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `TAILNET_UNIQUE_ID`
- `TAILSCALE_API_KEY`
- `TAILSCALE_AUTH_TOKEN`
- `TAILSCALE_LOGIN_ID`
- `TAILSCALE_LOGIN_SECRET`

Keep `/portal` private. Do not expose dashboard data without a verified
server-side session. Do not add provider tokens to frontend code. Do not add
`/portal` to the public sitemap.

The Python/FastAPI backend is deployed on Render as `fkdev-admin-api` at
`https://fkdev-admin-api.onrender.com`. Render Postgres is `fkdev-admin-db`.
PostgreSQL is intended for persistent data and audit logs, and object storage is
intended for non-secret uploaded files. Treat env files as secret inputs only; do
not commit or serve them.

## Provider and Deployment Snapshot

Current production assumptions:

- GitHub repository: `LeafyShadow696/FK-dev`
- Vercel production domain: `https://fkdev.xyz`
- Vercel project id: `prj_5rwIhFXRqZ0Q0i0tiVGuSPUMVhGn`
- Vercel team/org id: `team_Q7P5ptcXkEL5SBpsQ2edIgr3`
- Render workspace: `FKdev`
- Render backend service: `fkdev-admin-api`
- Render backend URL: `https://fkdev-admin-api.onrender.com`
- Render Postgres: `fkdev-admin-db`

Provider state can drift. Verify live state before making domain, deployment,
database, or billing-affecting changes.

## Secret Policy

Never commit secrets, API keys, tokens, private credentials, local auth files, or
personal session artifacts.

Known local secret backups may exist outside the repository:

- `C:\Users\buldo\.codex\secrets\fkdev-admin-portal.txt`
- `C:\Users\buldo\.codex\secrets\fkdev-environment_variables.txt`
- Original input file may exist at `C:\Users\buldo\Downloads\environment_variables.txt`

These files are not part of GitHub recovery and must remain outside the repo.
Provider env vars should be restored through Vercel/Render/Railway/GitHub
dashboards or CLIs, never by committing secrets.

Ignored local artifacts include `.env*`, `.vercel/`, `backend/.venv/`,
`node_modules/`, `dist/`, Playwright reports, and test results.

## Disaster Recovery

GitHub should contain all source files, public assets, tests, docs, and provider
configuration templates needed to rebuild the project. GitHub must not contain
private secret values.

Fresh Windows recovery flow:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects
git clone https://github.com/LeafyShadow696/FK-dev.git
cd FK-dev
npm.cmd ci
npm.cmd run check
npm.cmd run build
```

Backend recovery:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m compileall app
```

Production verification after restoring provider env vars:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev
$env:PLAYWRIGHT_BASE_URL='https://fkdev.xyz'; npm.cmd run test:e2e
```

## Gemini CLI Fallback

Gemini CLI is the intended local fallback if Codex/OpenAI is unavailable.

Verified local baseline as of 2026-05-14:

- Gemini CLI version: `0.42.0`
- Authentication: user-level `GEMINI_API_KEY`
- Project launch directory: `C:\Users\buldo\Documents\GitHubProjects\FK-dev`
- Headless verification works with `gemini.cmd --skip-trust -p "..."`

Project-specific Gemini context is stored in:

- `GEMINI.md`
- `.gemini/settings.json`
- `.geminiignore`
- `docs/ai-agent-handoff.md`
- this `AGENTS.md`

Gemini should be launched from the repository root:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev
gemini
```

For a non-interactive project sanity check:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev
gemini -p "Read GEMINI.md and AGENTS.md. Reply with the project name, canonical domain, and the commands required before deployment."
```

Gemini authentication must use user-level or session-level environment variables,
for example `GEMINI_API_KEY`, not a committed file. Do not create a repository
`.env` for Gemini.

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

The project is deployed on Vercel. Current production alias should be
`https://fkdev.xyz`.

Vercel creates deployment URLs under `.vercel.app`; these are expected for
deployment internals and previews. Do not treat them as canonical production URLs.

If changing Vercel domain behavior, verify:

- `https://fkdev.xyz/` returns `200`
- `https://www.fkdev.xyz/` returns a permanent redirect to `https://fkdev.xyz/`
- `https://fkdev.xyz/llms.txt` returns `200 text/plain`

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
- Scan for accidental secrets before pushing.
- Update `AGENTS.md` and related agent instruction files when architecture, routes, env vars, deployment behavior, or conventions change.
- After deployment, summarize exact commit, production URL, and verification results.
