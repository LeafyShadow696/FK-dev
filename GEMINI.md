@./AGENTS.md
@./docs/ai-agent-handoff.md

# Gemini CLI Project Context

You are operating in the `fkdev.xyz` production business landing page repository.
Read `AGENTS.md` first and treat it as the source of truth. This file exists so
Gemini CLI can recover the project context quickly if Codex/OpenAI is unavailable.

## Operating Rules

- Use Windows PowerShell commands.
- Keep public content Czech-first and factually conservative.
- Never print, commit, or move secrets into the repository.
- Keep `/portal` private and server-session protected.
- Do not deploy without running the checks listed in `AGENTS.md`.
- When changing project architecture, routes, env vars, deployment behavior, or
  conventions, update `AGENTS.md`, this file, `CLAUDE.md`, `GROK.md`, and
  `.github/copilot-instructions.md`.

## Start Here

Read these files before editing:

- `src/data/business.ts`
- `src/App.tsx`
- `src/pages/`
- `src/data/services.ts`
- `src/data/adminPortal.ts`
- `api/admin/[action].ts`
- `backend/app/main.py`
- `tests/e2e/smoke.spec.ts`
- `render.yaml`

## Recovery

If local files are missing, restore from:

```powershell
git clone https://github.com/LeafyShadow696/FK-dev.git
```

Then run:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run build
```

Secrets must be restored only through user environment variables or provider
dashboards, never from committed files.
