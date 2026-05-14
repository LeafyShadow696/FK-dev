# GitHub Copilot Instructions

Use `AGENTS.md` in the repository root as the canonical project context. Use
`docs/ai-agent-handoff.md` for recovery, provider, deployment, and validation
details.

Key rules:

- This is the production business landing page for `https://fkdev.xyz`.
- Keep public identity data consistent with `src/data/business.ts`.
- Public content is Czech-first, professional, factual, and conservative.
- Run `npm.cmd run check`, `npm.cmd run build`, and relevant Playwright e2e tests before shipping changes.
- Keep icons monochrome unless a component is explicitly part of the brand or primary CTA.
- `/portal` is a private admin route backed by `/api/admin/[action]`; keep secrets server-side only.
- Python backend work belongs under `backend/`; Render configuration belongs in `render.yaml`.
- Do not commit `.env` files, provider tokens, `.vercel/`, `backend/.venv/`, build output, or local auth/session files.
- Gemini CLI fallback context lives in `GEMINI.md`, `.gemini/settings.json`, and `.geminiignore`.
- Update `AGENTS.md` and related agent files when routes, env vars, architecture, deployment behavior, or conventions change.
