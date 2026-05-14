@AGENTS.md
@docs/ai-agent-handoff.md

# Grok Notes

Use `AGENTS.md` as the canonical project knowledge base and
`docs/ai-agent-handoff.md` for recovery, provider, and validation details.

This project is a production business landing page for `fkdev.xyz`. Public copy
is Czech-first and must remain accurate, practical, and consistent with
`src/data/business.ts`.

Do not commit secrets, do not expose `/portal` data without a verified
server-side session, and run the required checks before shipping changes.
