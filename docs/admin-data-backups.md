# Admin data backups

The Render Postgres database `fkdev-admin-db` is currently on a free plan and
is scheduled to expire on `2026-06-13T11:47:53Z`.

## Automated JSON export

The GitHub Actions workflow `.github/workflows/admin-data-export.yml` exports
protected admin data once per day and stores it as a 90-day workflow artifact.
It can also be run manually from GitHub Actions.

The workflow calls:

```text
GET https://fkdev-admin-api.onrender.com/admin/export
```

Required GitHub repository secret:

```text
FK_BACKEND_ADMIN_TOKEN
```

Optional GitHub repository variable:

```text
FK_BACKEND_EXPORT_URL
```

If the optional variable is not set, the workflow uses the production Render
backend URL.

## Export contents

The JSON export includes:

- database readiness metadata
- `admin_audit_logs`
- `admin_provider_snapshots`
- `admin_content_blocks`
- `admin_content_versions`
- `admin_settings`

The export does not include provider API tokens or environment variable values.

## Before expiration

Before `2026-06-13`, verify that at least one successful artifact exists in the
`Admin data export` workflow. Download the latest artifact before changing or
deleting the Render database.

Once the database is upgraded to a durable plan, keep the workflow as a regular
backup or reduce the schedule.
