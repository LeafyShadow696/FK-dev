# fkdev.xyz Admin API

Python backend scaffold for the private admin portal.

Recommended runtime:

- Python 3.12+
- FastAPI
- Uvicorn
- PostgreSQL for persistent data and audit logs
- External object storage for private files and exports

Current backend endpoints:

- `GET /health` - lightweight service health.
- `GET /integrations` - configured provider summary.
- `GET /admin/status` - read-only database and audit-log readiness.
- `GET /admin/audit` - protected recent audit event read; requires `FK_BACKEND_ADMIN_TOKEN`.
- `POST /admin/audit` - protected audit event write; requires `FK_BACKEND_ADMIN_TOKEN`.
- `GET /admin/content` - protected content block read for the private portal.
- `POST /admin/content` - protected draft/published content block write for Content studio.
- `POST /admin/content/check` - protected content quality check used before publishing.
- `POST /admin/content/rollback` - protected rollback to a stored published content version.
- `GET /content/published` - public read-only published content values for safe frontend hydration.
- `GET /admin/provider-snapshots` - protected provider snapshot history read.
- `POST /admin/provider-snapshots` - protected provider snapshot write.
- `GET /admin/export` - protected JSON export of admin database tables for backups.

Content publishing is guarded by the same quality check used by
`/admin/content/check`. It blocks unsupported guarantee-style claims and invalid
lengths, returns warnings for readability issues, and records audit events for
draft saves, publishes, blocked publishes, and rollbacks.

Local run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Render start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Do not commit `.env` files or provider tokens. Use platform environment variables.

Backup note: Render Postgres is currently on a free plan. See
`docs/admin-data-backups.md` for the scheduled export workflow and the current
database expiry date.
