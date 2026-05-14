@AGENTS.md
@docs/ai-agent-handoff.md

# Grok Notes

Use `AGENTS.md` as the canonical project knowledge base and
`docs/ai-agent-handoff.md` for recovery, provider, and validation details.

This project is a production business landing page for `fkdev.xyz`. Public copy
is Czech-first and must remain accurate, practical, and consistent with
`src/data/business.ts`.

Do not commit secrets, do not expose `/portal` data without a verified
server-side session, keep protected backend writes behind `FK_BACKEND_ADMIN_TOKEN`,
and run the required checks before shipping changes. Content studio stores
private draft/live-preview content blocks through protected `/admin/content`
backend endpoints. Published version history and rollback use
`/admin/content/rollback`. Selected public copy can hydrate through `/api/content`,
but public components must keep checked-in fallback text.
