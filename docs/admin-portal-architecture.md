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
endpoint reports connection and audit-log readiness. The write path
`/admin/audit` is intentionally protected by `FK_BACKEND_ADMIN_TOKEN`.

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
