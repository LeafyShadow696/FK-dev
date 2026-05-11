# GitHub Copilot Instructions

Use `AGENTS.md` in the repository root as the canonical project context.

Key rules:

- This is the production business landing page for `https://fkdev.xyz`.
- Keep public identity data consistent with `src/data/business.ts`.
- Run `npm.cmd run check`, `npm.cmd run build`, and relevant Playwright e2e tests before shipping changes.
- Keep icons monochrome unless a component is explicitly part of the brand or primary CTA.
- `/portal` is a private admin route backed by `/api/admin/[action]`; keep secrets server-side only.
- Update `AGENTS.md` and related agent files when routes, env vars, architecture, or conventions change.
