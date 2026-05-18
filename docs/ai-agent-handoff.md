# AI Agent Handoff

This document gives Codex, Gemini CLI, Claude, Grok, GitHub Copilot, and future
agents enough project context to recover, verify, and continue work safely.

## Non-Negotiable Rules

- Do not commit secrets, provider tokens, local auth files, `.env` files, or
  personal session artifacts.
- Do not add `/portal` to public sitemap files.
- Do not expose admin/provider data without a verified server-side session.
- Keep public Czech copy accurate, natural, and conservative.
- Keep `src/data/business.ts` as the canonical public identity source.
- Run checks before pushing production-impacting changes.
- Update `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `GROK.md`, and
  `.github/copilot-instructions.md` when project operating rules change.

## Project Identity

- Project: production business landing page for `fkdev.xyz`
- Public brand: `František Kalášek / TopBot PwnZ™`
- Canonical URL: `https://fkdev.xyz`
- GitHub repository: `LeafyShadow696/FK-dev`
- Public AI summary: `https://fkdev.xyz/llms.txt`
- Private admin route: `https://fkdev.xyz/portal`

The site is Czech-first. It presents practical development services: web apps,
PWA solutions, automation, API integrations, cloud/self-hosted systems, data
workflows, hosting support, and technology consulting.

## Architecture

Frontend:

- Vite, React 18, TypeScript, Tailwind CSS
- Wouter routing
- Framer Motion
- Three.js hero background through `@react-three/fiber` and `@react-three/drei`
- Vercel Analytics and Speed Insights

Admin and backend:

- `/portal` is the private admin portal UI.
- `api/admin/[action].ts` is the Vercel serverless admin API.
- `backend/` contains the Python FastAPI backend.
- `render.yaml` describes the Render backend and Render Postgres.
- Render backend URL: `https://fkdev-admin-api.onrender.com`
- Render backend service: `fkdev-admin-api`
- Render Postgres: `fkdev-admin-db`
- `backend/app/database.py` initializes PostgreSQL tables and reports database status.
- `/admin/status` is a read-only backend status endpoint.
- `/admin/audit` is a protected backend read/write endpoint and requires `FK_BACKEND_ADMIN_TOKEN`.
- `/admin/export` is a protected JSON backup endpoint and requires `FK_BACKEND_ADMIN_TOKEN`.
- `/admin/telemetry` and `/admin/telemetry/summary` store and expose anonymous consent-based live traffic aggregates for `/portal`.
- `/admin/opportunities` and `/admin/opportunities/refresh` maintain the Opportunity Radar for grants, tenders, market-demand watch sources, guarded MPSV live-import signals, API / OP TAK grant imports, and NEN procurement import status.
- The Vercel admin API includes recent audit events in `/api/admin/overview`
  only for authenticated admin sessions.
- `/api/admin/overview` also includes read-only `operations` for Vercel domains
  and GitHub Actions workflow runs. Provider tokens must stay server-side.
- Authenticated `/api/admin/overview` loads store provider snapshots through the
  protected FastAPI `/admin/provider-snapshots` endpoint and returns recent
  `providerSnapshots` for the portal history view.
- Audit logs and provider snapshots are filtered/limited in the portal UI after
  server-side loading.
- Content studio uses protected FastAPI `/admin/content` endpoints and
  `admin_content_blocks` in PostgreSQL for private draft editing, live preview,
  and published content snapshots. Version history and rollback use
  `admin_content_versions` and `/admin/content/rollback`.
- Content publishing is protected by `/admin/content/check` and the same
  automatic check inside `POST /admin/content` when `publish` is true. It blocks
  unsupported guarantee-style claims and invalid lengths, returns readability
  warnings, and records audit events for draft saves, publishes, blocked
  publishes, and rollbacks.
- Selected public copy can hydrate from `/api/content`, which proxies public
  FastAPI `/content/published`. Public React components must keep checked-in
  fallback text so the landing page remains stable without backend content.

The current backend is intentionally small. Future admin work should keep the
public landing page fast and stable while moving real admin operations into
Python/FastAPI with PostgreSQL and external storage.

## Files To Read First

Start with:

- `AGENTS.md`
- `GEMINI.md` if using Gemini CLI
- `src/data/business.ts`
- `src/App.tsx`
- `src/pages/`
- `src/data/services.ts`
- `src/data/adminPortal.ts`
- `api/admin/[action].ts`
- `backend/app/main.py`
- `backend/app/database.py`
- `tests/e2e/smoke.spec.ts`
- `render.yaml`
- `vercel.json`
- `docs/admin-data-backups.md`

## Local Setup

Windows PowerShell baseline:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev
npm.cmd ci
npm.cmd run check
npm.cmd run build
```

Local preview and e2e:

```powershell
npm.cmd run preview -- --host 127.0.0.1 --port 4173
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173'; npm.cmd run test:e2e
```

Python backend:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m compileall app
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Production Verification

Production site:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev
$env:PLAYWRIGHT_BASE_URL='https://fkdev.xyz'; npm.cmd run test:e2e
```

Backend health:

```powershell
Invoke-RestMethod -Uri 'https://fkdev-admin-api.onrender.com/health'
Invoke-RestMethod -Uri 'https://fkdev-admin-api.onrender.com/admin/status'
```

Public AI summary:

```powershell
Invoke-WebRequest -Uri 'https://fkdev.xyz/llms.txt' -MaximumRedirection 1
```

## Deployments

Vercel production deploy:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev
npx.cmd --yes vercel@latest deploy --prod
```

Production domain expectations:

- `https://fkdev.xyz/` is canonical.
- `https://www.fkdev.xyz/` redirects permanently to `https://fkdev.xyz/`.
- `.vercel.app` deployment URLs are valid preview/internal URLs, not canonical
  public production identity.

Render:

- `render.yaml` is the source template for backend and Postgres infrastructure.
- Live Render/API state can drift; verify before changing billing, region,
  service names, env vars, or database settings.

## Secrets and Environment Variables

Never commit secret values.

Secret values may exist locally outside the repository:

- `C:\Users\buldo\.codex\secrets\fkdev-admin-portal.txt`
- `C:\Users\buldo\.codex\secrets\fkdev-environment_variables.txt`
- `C:\Users\buldo\Downloads\environment_variables.txt`

Representative env var names:

- `FK_ADMIN_ACCESS_KEY`
- `FK_ADMIN_SESSION_SECRET`
- `FK_BACKEND_ADMIN_TOKEN`
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
- `RENDER_BACKEND_URL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `TAILNET_UNIQUE_ID`
- `TAILSCALE_API_KEY`
- `TAILSCALE_AUTH_TOKEN`
- `TAILSCALE_LOGIN_ID`
- `TAILSCALE_LOGIN_SECRET`

Use provider dashboards/CLIs to restore these values. Do not place them in
tracked repo files.

## Disaster Recovery From GitHub

If local files are deleted:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects
git clone https://github.com/LeafyShadow696/FK-dev.git
cd FK-dev
npm.cmd ci
npm.cmd run check
npm.cmd run build
```

Then restore provider env vars from secure storage or provider dashboards and run:

```powershell
$env:PLAYWRIGHT_BASE_URL='https://fkdev.xyz'; npm.cmd run test:e2e
```

GitHub must contain source, tests, docs, public assets, and provider templates.
GitHub must not contain private token values.

## Gemini CLI Fallback

Gemini CLI should be installed from the official package:

```powershell
npm.cmd install -g @google/gemini-cli
```

Verified local baseline as of 2026-05-14:

- Gemini CLI version: `0.42.0`
- Authentication: user-level `GEMINI_API_KEY`
- API access: verified with a headless prompt from the repository root
- Headless trust mode: use `--skip-trust` for non-interactive checks

Run from the repo root:

```powershell
cd C:\Users\buldo\Documents\GitHubProjects\FK-dev
gemini
```

Non-interactive check:

```powershell
gemini.cmd --skip-trust -p "Read GEMINI.md and AGENTS.md. Summarize this project, its canonical domain, and the checks required before deployment."
```

Project Gemini configuration:

- `GEMINI.md` imports `AGENTS.md`.
- `.gemini/settings.json` tells Gemini to load both `GEMINI.md` and
  `AGENTS.md`, enables checkpointing, and disables usage statistics for this
  project.
- `.geminiignore` keeps build output, dependencies, local provider state, virtual
  environments, and env files out of Gemini context.

Gemini authentication should use `GEMINI_API_KEY` from the user environment or a
temporary shell session. Do not write the API key into this repository.

## Before Committing

Run:

```powershell
npm.cmd run check
npm.cmd run build
```

For backend-affecting changes:

```powershell
cd backend
.\.venv\Scripts\python.exe -m compileall app
```

For routing, UI, SEO, cookie, asset, contact, or portal changes, also run
Playwright e2e against local preview or production as appropriate.

Before the Render Postgres free database expiry on `2026-06-13T11:47:53Z`,
verify the `Admin data export` GitHub Actions workflow has produced a recent
artifact. The workflow requires the repository secret `FK_BACKEND_ADMIN_TOKEN`.

Scan for accidental secrets before push with a local scanner or with a focused
`rg` pattern that looks for real assigned values. If the scan finds a real
secret, remove it before committing. Placeholder env var names without values
are acceptable in documentation.
