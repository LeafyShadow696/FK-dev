# AI CloudKit Toolbox

Planned companion tool for Apple Developer / CloudKit workflows on iPhone and web.

## Security

Never commit CloudKit tokens, Apple private keys, JWT secrets, or other credentials. Use local `.env` files ignored by Git and Vercel encrypted environment variables for server-side execution.

The token shared in chat should be treated as compromised and rotated/revoked before use.

## Proposed features

- CloudKit container/environment dashboard
- CKTool command builder
- CloudKit Web Services request builder
- JWT/token diagnostics without exposing secrets to browser JavaScript
- Record/query helpers
- API response viewer and formatter
- Shortcuts-friendly HTTP endpoints for iPhone workflows
- AI assistant for explaining CloudKit errors and generating safe commands
- Exportable cURL / JavaScript / TypeScript snippets
