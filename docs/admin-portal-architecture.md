# Admin Portal Architecture

## Recommendation

Use the current Vercel deployment for the public landing page and the lightweight
private portal shell. Use a Python backend for real admin operations.

Recommended stack:

- Frontend and public site: Vite React on Vercel
- Admin API: Python FastAPI
- Backend hosting: Render Web Service
- Database: PostgreSQL
- File storage:
  - Vercel Blob for public site assets and simple public downloads
  - S3-compatible private storage such as Cloudflare R2 for larger private files
    and future exports

## Why Python / FastAPI

Python is a good fit for the portal because the planned work is integration-heavy:
provider APIs, scheduled checks, audit logs, import/export jobs, AI-assisted
workflows, and longer-running backend tasks. FastAPI keeps the API explicit,
typed, and easy to test.

## Database

Use PostgreSQL as the default database. It is the safest baseline for:

- audit logs
- admin settings
- integration status snapshots
- job history
- future CRM-like records
- relational data that should remain queryable

The first implemented backend database layer initializes `admin_audit_logs` and
`admin_settings` through the FastAPI service. The read-only `/admin/status`
endpoint reports connection and audit-log readiness. The `/admin/audit` path is
protected by `FK_BACKEND_ADMIN_TOKEN` for both recent-event reads and writes.
The public browser never calls this backend endpoint directly; the Vercel admin
API proxies recent audit events only after a valid admin session.

Provider status history is stored in `admin_provider_snapshots`. The Vercel admin
API writes an aggregated snapshot after authenticated overview reads and returns
the latest snapshots for the portal history section.

Content studio drafts are stored in `admin_content_blocks`. The private portal
can edit selected landing-page copy, compare draft and published text in a live
preview, and store a published snapshot. The public site is not switched to
database-backed content yet; published content blocks are the controlled staging
layer for a future publish workflow.

Published content versions are stored in `admin_content_versions`. The private
portal can compare draft and published text, review recent versions, and roll
back to a selected version. Public pages may hydrate selected copy from the
same-origin `/api/content` proxy, which reads the public FastAPI
`/content/published` endpoint. The React components must keep checked-in
fallback text so the landing page remains stable if the backend is unavailable.

Content publishing has a protected quality gate. The private portal can call
`/admin/content/check` through the Vercel admin API before publishing, and
`POST /admin/content` runs the same check automatically when `publish` is true.
The check blocks very short or oversized copy and unsupported guarantee-style
claims, and returns warnings for spacing, punctuation, or dense text. Draft
saves, successful publishes, blocked publishes, and rollbacks are written to the
audit log.

## Storage

Do not store secret env files in Git.

Use platform environment variables for provider tokens. Use object storage only
for non-secret uploaded files, generated reports, media, and exports. If secret
files need to be retained, store them outside the repository and migrate their
values into encrypted provider env vars.

## Current Secret Handling

The local source file `C:\Users\buldo\Downloads\environment_variables.txt`
is treated as a secret input file. Values from this file may be uploaded to
Vercel as encrypted environment variables, but the file itself must not be
committed or served from the public web.
