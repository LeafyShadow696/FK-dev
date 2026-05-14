@AGENTS.md
@docs/ai-agent-handoff.md

# Claude Code Notes

Treat `AGENTS.md` as the canonical source of truth and
`docs/ai-agent-handoff.md` as the operational recovery guide.

This is the production business landing page for `https://fkdev.xyz`, with a
private `/portal` admin route, Vercel serverless admin API, and Python/FastAPI
backend on Render. Backend database status is exposed through `/admin/status`;
protected audit writes use `/admin/audit` with `FK_BACKEND_ADMIN_TOKEN`.
Content studio uses protected `/admin/content` backend endpoints for private
draft/live-preview content blocks; public pages remain backed by checked-in
React/data files until a publish workflow is approved.

Keep responses concise, prefer concrete file references, do not expose secrets,
and do not change production behavior without running the checks listed in
`AGENTS.md`.
