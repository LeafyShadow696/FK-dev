from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

from .settings import get_settings


@dataclass(frozen=True)
class DatabaseStatus:
    configured: bool
    connected: bool
    initialized: bool
    dialect: str | None
    audit_log_count: int | None
    last_audit_event_at: str | None
    error: str | None = None


@dataclass(frozen=True)
class AuditEvent:
    id: str
    event_type: str
    actor: str
    metadata: dict[str, Any]
    created_at: str


@dataclass(frozen=True)
class ProviderSnapshot:
    id: str
    source: str
    status: str
    summary: str
    payload: dict[str, Any]
    created_at: str


@dataclass(frozen=True)
class ContentBlock:
    key: str
    label: str
    area: str
    draft_value: str
    published_value: str
    updated_at: str
    published_at: str | None


@dataclass(frozen=True)
class ContentVersion:
    id: str
    block_key: str
    value: str
    action: str
    actor: str
    created_at: str


@dataclass(frozen=True)
class TelemetrySummary:
    active_sessions: int
    events_15m: int
    events_60m: int
    top_pages: list[dict[str, Any]]
    recent_events: list[dict[str, Any]]


_engine: Engine | None = None


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)

    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    return database_url


def get_engine() -> Engine | None:
    global _engine

    settings = get_settings()

    if not settings.database_url:
        return None

    if _engine is None:
        _engine = create_engine(
            _normalize_database_url(settings.database_url),
            pool_pre_ping=True,
            future=True,
        )

    return _engine


def init_database(engine: Engine | None = None) -> bool:
    engine = engine or get_engine()

    if engine is None:
        return False

    dialect = engine.dialect.name

    if dialect == "postgresql":
        statements = [
            "CREATE EXTENSION IF NOT EXISTS pgcrypto",
            """
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              event_type text NOT NULL,
              actor text NOT NULL DEFAULT 'system',
              ip_address text,
              user_agent text,
              metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
              created_at timestamptz NOT NULL DEFAULT now()
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs (created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_event_type ON admin_audit_logs (event_type)",
            """
            CREATE TABLE IF NOT EXISTS admin_settings (
              key text PRIMARY KEY,
              value jsonb NOT NULL,
              updated_at timestamptz NOT NULL DEFAULT now()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS admin_provider_snapshots (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              source text NOT NULL,
              status text NOT NULL,
              summary text NOT NULL,
              payload jsonb NOT NULL DEFAULT '{}'::jsonb,
              created_at timestamptz NOT NULL DEFAULT now()
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_provider_snapshots_created_at ON admin_provider_snapshots (created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_provider_snapshots_source ON admin_provider_snapshots (source)",
            """
            CREATE TABLE IF NOT EXISTS admin_content_blocks (
              key text PRIMARY KEY,
              label text NOT NULL,
              area text NOT NULL,
              draft_value text NOT NULL,
              published_value text NOT NULL DEFAULT '',
              updated_at timestamptz NOT NULL DEFAULT now(),
              published_at timestamptz
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_content_blocks_area ON admin_content_blocks (area)",
            """
            CREATE TABLE IF NOT EXISTS admin_content_versions (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              block_key text NOT NULL,
              value text NOT NULL,
              action text NOT NULL,
              actor text NOT NULL DEFAULT 'admin',
              created_at timestamptz NOT NULL DEFAULT now()
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_content_versions_block_key ON admin_content_versions (block_key, created_at DESC)",
            """
            CREATE TABLE IF NOT EXISTS admin_telemetry_events (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              session_id text NOT NULL,
              event_type text NOT NULL,
              path text NOT NULL,
              referrer text,
              viewport text,
              metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
              created_at timestamptz NOT NULL DEFAULT now()
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_telemetry_events_created_at ON admin_telemetry_events (created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_telemetry_events_session_created ON admin_telemetry_events (session_id, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_telemetry_events_path_created ON admin_telemetry_events (path, created_at DESC)",
        ]
    else:
        statements = [
            """
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
              id text PRIMARY KEY,
              event_type text NOT NULL,
              actor text NOT NULL DEFAULT 'system',
              ip_address text,
              user_agent text,
              metadata text NOT NULL DEFAULT '{}',
              created_at text NOT NULL
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs (created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_event_type ON admin_audit_logs (event_type)",
            """
            CREATE TABLE IF NOT EXISTS admin_settings (
              key text PRIMARY KEY,
              value text NOT NULL,
              updated_at text NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS admin_provider_snapshots (
              id text PRIMARY KEY,
              source text NOT NULL,
              status text NOT NULL,
              summary text NOT NULL,
              payload text NOT NULL DEFAULT '{}',
              created_at text NOT NULL
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_provider_snapshots_created_at ON admin_provider_snapshots (created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_provider_snapshots_source ON admin_provider_snapshots (source)",
            """
            CREATE TABLE IF NOT EXISTS admin_content_blocks (
              key text PRIMARY KEY,
              label text NOT NULL,
              area text NOT NULL,
              draft_value text NOT NULL,
              published_value text NOT NULL DEFAULT '',
              updated_at text NOT NULL,
              published_at text
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_content_blocks_area ON admin_content_blocks (area)",
            """
            CREATE TABLE IF NOT EXISTS admin_content_versions (
              id text PRIMARY KEY,
              block_key text NOT NULL,
              value text NOT NULL,
              action text NOT NULL,
              actor text NOT NULL DEFAULT 'admin',
              created_at text NOT NULL
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_content_versions_block_key ON admin_content_versions (block_key, created_at DESC)",
            """
            CREATE TABLE IF NOT EXISTS admin_telemetry_events (
              id text PRIMARY KEY,
              session_id text NOT NULL,
              event_type text NOT NULL,
              path text NOT NULL,
              referrer text,
              viewport text,
              metadata text NOT NULL DEFAULT '{}',
              created_at text NOT NULL
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_telemetry_events_created_at ON admin_telemetry_events (created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_telemetry_events_session_created ON admin_telemetry_events (session_id, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_telemetry_events_path_created ON admin_telemetry_events (path, created_at DESC)",
        ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

    return True


def database_status() -> DatabaseStatus:
    engine = get_engine()

    if engine is None:
        return DatabaseStatus(
            configured=False,
            connected=False,
            initialized=False,
            dialect=None,
            audit_log_count=None,
            last_audit_event_at=None,
        )

    try:
        init_database(engine)
        with engine.connect() as connection:
            audit_log_count = connection.execute(
                text("SELECT COUNT(*) FROM admin_audit_logs"),
            ).scalar_one()
            last_audit_event_at = connection.execute(
                text("SELECT MAX(created_at) FROM admin_audit_logs"),
            ).scalar_one_or_none()

        return DatabaseStatus(
            configured=True,
            connected=True,
            initialized=True,
            dialect=engine.dialect.name,
            audit_log_count=int(audit_log_count),
            last_audit_event_at=str(last_audit_event_at)
            if last_audit_event_at is not None
            else None,
        )
    except SQLAlchemyError as exc:
        return DatabaseStatus(
            configured=True,
            connected=False,
            initialized=False,
            dialect=engine.dialect.name,
            audit_log_count=None,
            last_audit_event_at=None,
            error=exc.__class__.__name__,
        )


def record_audit_event(
    event_type: str,
    *,
    actor: str = "system",
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> str | None:
    engine = get_engine()

    if engine is None:
        return None

    init_database(engine)

    event_id = str(uuid.uuid4())
    payload = metadata or {}

    if engine.dialect.name == "postgresql":
        statement = text(
            """
            INSERT INTO admin_audit_logs
              (id, event_type, actor, ip_address, user_agent, metadata)
            VALUES
              (:id, :event_type, :actor, :ip_address, :user_agent, CAST(:metadata AS jsonb))
            """,
        )
        params: dict[str, Any] = {
            "id": event_id,
            "event_type": event_type,
            "actor": actor,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "metadata": json.dumps(payload),
        }
    else:
        statement = text(
            """
            INSERT INTO admin_audit_logs
              (id, event_type, actor, ip_address, user_agent, metadata, created_at)
            VALUES
              (:id, :event_type, :actor, :ip_address, :user_agent, :metadata, :created_at)
            """,
        )
        params = {
            "id": event_id,
            "event_type": event_type,
            "actor": actor,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "metadata": json.dumps(payload),
            "created_at": datetime.now(UTC).isoformat(),
        }

    with engine.begin() as connection:
        connection.execute(statement, params)

    return event_id


def list_audit_events(limit: int = 10) -> list[AuditEvent]:
    engine = get_engine()

    if engine is None:
        return []

    init_database(engine)

    safe_limit = max(1, min(limit, 50))

    with engine.connect() as connection:
        rows = connection.execute(
            text(
                """
                SELECT id, event_type, actor, metadata, created_at
                FROM admin_audit_logs
                ORDER BY created_at DESC
                LIMIT :limit
                """,
            ),
            {"limit": safe_limit},
        ).mappings()

        events: list[AuditEvent] = []
        for row in rows:
            metadata = row["metadata"]

            if isinstance(metadata, str):
                try:
                    parsed_metadata = json.loads(metadata)
                except json.JSONDecodeError:
                    parsed_metadata = {}
            elif isinstance(metadata, dict):
                parsed_metadata = metadata
            else:
                parsed_metadata = {}

            events.append(
                AuditEvent(
                    id=str(row["id"]),
                    event_type=str(row["event_type"]),
                    actor=str(row["actor"]),
                    metadata=parsed_metadata,
                    created_at=str(row["created_at"]),
                ),
            )

    return events


def record_provider_snapshot(
    *,
    source: str,
    status: str,
    summary: str,
    payload: dict[str, Any] | None = None,
) -> str | None:
    engine = get_engine()

    if engine is None:
        return None

    init_database(engine)

    snapshot_id = str(uuid.uuid4())
    body = payload or {}

    if engine.dialect.name == "postgresql":
        statement = text(
            """
            INSERT INTO admin_provider_snapshots
              (id, source, status, summary, payload)
            VALUES
              (:id, :source, :status, :summary, CAST(:payload AS jsonb))
            """,
        )
        params: dict[str, Any] = {
            "id": snapshot_id,
            "source": source,
            "status": status,
            "summary": summary,
            "payload": json.dumps(body),
        }
    else:
        statement = text(
            """
            INSERT INTO admin_provider_snapshots
              (id, source, status, summary, payload, created_at)
            VALUES
              (:id, :source, :status, :summary, :payload, :created_at)
            """,
        )
        params = {
            "id": snapshot_id,
            "source": source,
            "status": status,
            "summary": summary,
            "payload": json.dumps(body),
            "created_at": datetime.now(UTC).isoformat(),
        }

    with engine.begin() as connection:
        connection.execute(statement, params)

    return snapshot_id


def list_provider_snapshots(limit: int = 10) -> list[ProviderSnapshot]:
    engine = get_engine()

    if engine is None:
        return []

    init_database(engine)

    safe_limit = max(1, min(limit, 50))

    with engine.connect() as connection:
        rows = connection.execute(
            text(
                """
                SELECT id, source, status, summary, payload, created_at
                FROM admin_provider_snapshots
                ORDER BY created_at DESC
                LIMIT :limit
                """,
            ),
            {"limit": safe_limit},
        ).mappings()

        snapshots: list[ProviderSnapshot] = []
        for row in rows:
            payload = row["payload"]

            if isinstance(payload, str):
                try:
                    parsed_payload = json.loads(payload)
                except json.JSONDecodeError:
                    parsed_payload = {}
            elif isinstance(payload, dict):
                parsed_payload = payload
            else:
                parsed_payload = {}

            snapshots.append(
                ProviderSnapshot(
                    id=str(row["id"]),
                    source=str(row["source"]),
                    status=str(row["status"]),
                    summary=str(row["summary"]),
                    payload=parsed_payload,
                    created_at=str(row["created_at"]),
                ),
            )

    return snapshots


def _json_value(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value

    return value


def _export_rows(table: str, order_by: str | None = None) -> list[dict[str, Any]]:
    engine = get_engine()

    if engine is None:
        return []

    init_database(engine)

    statement = f"SELECT * FROM {table}"

    if order_by:
        statement = f"{statement} ORDER BY {order_by}"

    with engine.connect() as connection:
        rows = connection.execute(text(statement)).mappings()

        return [
            {key: _json_value(value) for key, value in row.items()}
            for row in rows
        ]


def export_admin_data() -> dict[str, Any]:
    status = database_status()

    return {
        "database": status.__dict__,
        "tables": {
            "admin_audit_logs": _export_rows(
                "admin_audit_logs",
                "created_at DESC",
            ),
            "admin_provider_snapshots": _export_rows(
                "admin_provider_snapshots",
                "created_at DESC",
            ),
            "admin_content_blocks": _export_rows(
                "admin_content_blocks",
                "updated_at DESC",
            ),
            "admin_content_versions": _export_rows(
                "admin_content_versions",
                "created_at DESC",
            ),
            "admin_settings": _export_rows("admin_settings", "updated_at DESC"),
            "admin_telemetry_events": _export_rows(
                "admin_telemetry_events",
                "created_at DESC",
            ),
        },
    }


def record_telemetry_event(
    *,
    session_id: str,
    event_type: str,
    path: str,
    referrer: str | None = None,
    viewport: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> str | None:
    engine = get_engine()

    if engine is None:
        return None

    init_database(engine)

    event_id = str(uuid.uuid4())
    payload = metadata or {}

    if engine.dialect.name == "postgresql":
        statement = text(
            """
            INSERT INTO admin_telemetry_events
              (id, session_id, event_type, path, referrer, viewport, metadata)
            VALUES
              (:id, :session_id, :event_type, :path, :referrer, :viewport, CAST(:metadata AS jsonb))
            """,
        )
        params: dict[str, Any] = {
            "id": event_id,
            "session_id": session_id,
            "event_type": event_type,
            "path": path,
            "referrer": referrer,
            "viewport": viewport,
            "metadata": json.dumps(payload),
        }
    else:
        statement = text(
            """
            INSERT INTO admin_telemetry_events
              (id, session_id, event_type, path, referrer, viewport, metadata, created_at)
            VALUES
              (:id, :session_id, :event_type, :path, :referrer, :viewport, :metadata, :created_at)
            """,
        )
        params = {
            "id": event_id,
            "session_id": session_id,
            "event_type": event_type,
            "path": path,
            "referrer": referrer,
            "viewport": viewport,
            "metadata": json.dumps(payload),
            "created_at": datetime.now(UTC).isoformat(),
        }

    with engine.begin() as connection:
        connection.execute(statement, params)

    return event_id


def telemetry_summary() -> TelemetrySummary:
    engine = get_engine()

    if engine is None:
        return TelemetrySummary(
            active_sessions=0,
            events_15m=0,
            events_60m=0,
            top_pages=[],
            recent_events=[],
        )

    init_database(engine)

    if engine.dialect.name == "postgresql":
        active_sessions_statement = text(
            """
            SELECT COUNT(DISTINCT session_id)
            FROM admin_telemetry_events
            WHERE created_at >= now() - interval '5 minutes'
            """,
        )
        events_15m_statement = text(
            """
            SELECT COUNT(*)
            FROM admin_telemetry_events
            WHERE created_at >= now() - interval '15 minutes'
            """,
        )
        events_60m_statement = text(
            """
            SELECT COUNT(*)
            FROM admin_telemetry_events
            WHERE created_at >= now() - interval '60 minutes'
            """,
        )
        top_pages_statement = text(
            """
            SELECT path, COUNT(*) AS visits, MAX(created_at) AS last_seen_at
            FROM admin_telemetry_events
            WHERE created_at >= now() - interval '60 minutes'
            GROUP BY path
            ORDER BY visits DESC, last_seen_at DESC
            LIMIT 8
            """,
        )
        recent_events_statement = text(
            """
            SELECT event_type, path, referrer, viewport, created_at
            FROM admin_telemetry_events
            ORDER BY created_at DESC
            LIMIT 12
            """,
        )
    else:
        active_sessions_statement = text(
            """
            SELECT COUNT(DISTINCT session_id)
            FROM admin_telemetry_events
            WHERE created_at >= datetime('now', '-5 minutes')
            """,
        )
        events_15m_statement = text(
            """
            SELECT COUNT(*)
            FROM admin_telemetry_events
            WHERE created_at >= datetime('now', '-15 minutes')
            """,
        )
        events_60m_statement = text(
            """
            SELECT COUNT(*)
            FROM admin_telemetry_events
            WHERE created_at >= datetime('now', '-60 minutes')
            """,
        )
        top_pages_statement = text(
            """
            SELECT path, COUNT(*) AS visits, MAX(created_at) AS last_seen_at
            FROM admin_telemetry_events
            WHERE created_at >= datetime('now', '-60 minutes')
            GROUP BY path
            ORDER BY visits DESC, last_seen_at DESC
            LIMIT 8
            """,
        )
        recent_events_statement = text(
            """
            SELECT event_type, path, referrer, viewport, created_at
            FROM admin_telemetry_events
            ORDER BY created_at DESC
            LIMIT 12
            """,
        )

    with engine.connect() as connection:
        active_sessions = connection.execute(active_sessions_statement).scalar_one()
        events_15m = connection.execute(events_15m_statement).scalar_one()
        events_60m = connection.execute(events_60m_statement).scalar_one()
        top_pages = [
            {
                "path": str(row["path"]),
                "visits": int(row["visits"]),
                "last_seen_at": str(row["last_seen_at"]),
            }
            for row in connection.execute(top_pages_statement).mappings()
        ]
        recent_events = [
            {
                "event_type": str(row["event_type"]),
                "path": str(row["path"]),
                "referrer": str(row["referrer"]) if row["referrer"] else None,
                "viewport": str(row["viewport"]) if row["viewport"] else None,
                "created_at": str(row["created_at"]),
            }
            for row in connection.execute(recent_events_statement).mappings()
        ]

    return TelemetrySummary(
        active_sessions=int(active_sessions),
        events_15m=int(events_15m),
        events_60m=int(events_60m),
        top_pages=top_pages,
        recent_events=recent_events,
    )


def upsert_content_block(
    *,
    key: str,
    label: str,
    area: str,
    draft_value: str,
    publish: bool = False,
    version_action: str = "publish",
) -> ContentBlock | None:
    engine = get_engine()

    if engine is None:
        return None

    init_database(engine)

    normalized_key = key.strip()
    normalized_label = label.strip()
    normalized_area = area.strip()

    if not normalized_key or not normalized_label or not normalized_area:
        return None

    now = datetime.now(UTC).isoformat()

    if engine.dialect.name == "postgresql":
        statement = text(
            """
            INSERT INTO admin_content_blocks
              (key, label, area, draft_value, published_value, updated_at, published_at)
            VALUES
              (:key, :label, :area, :draft_value, :published_value, now(), :published_at)
            ON CONFLICT (key) DO UPDATE SET
              label = EXCLUDED.label,
              area = EXCLUDED.area,
              draft_value = EXCLUDED.draft_value,
              published_value = CASE
                WHEN :publish THEN EXCLUDED.draft_value
                ELSE admin_content_blocks.published_value
              END,
              updated_at = now(),
              published_at = CASE
                WHEN :publish THEN now()
                ELSE admin_content_blocks.published_at
              END
            RETURNING key, label, area, draft_value, published_value, updated_at, published_at
            """,
        )
        params: dict[str, Any] = {
            "key": normalized_key,
            "label": normalized_label,
            "area": normalized_area,
            "draft_value": draft_value,
            "published_value": draft_value if publish else "",
            "published_at": now if publish else None,
            "publish": publish,
        }
    else:
        existing = get_content_block(normalized_key)
        published_value = draft_value if publish else existing.published_value if existing else ""
        published_at = now if publish else existing.published_at if existing else None
        statement = text(
            """
            INSERT INTO admin_content_blocks
              (key, label, area, draft_value, published_value, updated_at, published_at)
            VALUES
              (:key, :label, :area, :draft_value, :published_value, :updated_at, :published_at)
            ON CONFLICT (key) DO UPDATE SET
              label = :label,
              area = :area,
              draft_value = :draft_value,
              published_value = :published_value,
              updated_at = :updated_at,
              published_at = :published_at
            """,
        )
        params = {
            "key": normalized_key,
            "label": normalized_label,
            "area": normalized_area,
            "draft_value": draft_value,
            "published_value": published_value,
            "updated_at": now,
            "published_at": published_at,
        }

    with engine.begin() as connection:
        result = connection.execute(statement, params)
        row = result.mappings().first() if result.returns_rows else None

    if row is None:
        block = get_content_block(normalized_key)
    else:
        block = ContentBlock(
            key=str(row["key"]),
            label=str(row["label"]),
            area=str(row["area"]),
            draft_value=str(row["draft_value"]),
            published_value=str(row["published_value"]),
            updated_at=str(row["updated_at"]),
            published_at=str(row["published_at"]) if row["published_at"] is not None else None,
        )

    if publish and block is not None:
        record_content_version(
            block_key=block.key,
            value=block.published_value,
            action=version_action,
        )

    return block


def record_content_version(
    *,
    block_key: str,
    value: str,
    action: str,
    actor: str = "admin",
) -> str | None:
    engine = get_engine()

    if engine is None:
        return None

    init_database(engine)

    version_id = str(uuid.uuid4())

    if engine.dialect.name == "postgresql":
        statement = text(
            """
            INSERT INTO admin_content_versions
              (id, block_key, value, action, actor)
            VALUES
              (:id, :block_key, :value, :action, :actor)
            """,
        )
        params: dict[str, Any] = {
            "id": version_id,
            "block_key": block_key,
            "value": value,
            "action": action,
            "actor": actor,
        }
    else:
        statement = text(
            """
            INSERT INTO admin_content_versions
              (id, block_key, value, action, actor, created_at)
            VALUES
              (:id, :block_key, :value, :action, :actor, :created_at)
            """,
        )
        params = {
            "id": version_id,
            "block_key": block_key,
            "value": value,
            "action": action,
            "actor": actor,
            "created_at": datetime.now(UTC).isoformat(),
        }

    with engine.begin() as connection:
        connection.execute(statement, params)

    return version_id


def list_content_versions(
    *,
    key: str | None = None,
    limit: int = 20,
) -> list[ContentVersion]:
    engine = get_engine()

    if engine is None:
        return []

    init_database(engine)
    safe_limit = max(1, min(limit, 50))

    if key:
        statement = text(
            """
            SELECT id, block_key, value, action, actor, created_at
            FROM admin_content_versions
            WHERE block_key = :key
            ORDER BY created_at DESC
            LIMIT :limit
            """,
        )
        params: dict[str, Any] = {"key": key, "limit": safe_limit}
    else:
        statement = text(
            """
            SELECT id, block_key, value, action, actor, created_at
            FROM admin_content_versions
            ORDER BY created_at DESC
            LIMIT :limit
            """,
        )
        params = {"limit": safe_limit}

    with engine.connect() as connection:
        rows = connection.execute(statement, params).mappings()

        return [
            ContentVersion(
                id=str(row["id"]),
                block_key=str(row["block_key"]),
                value=str(row["value"]),
                action=str(row["action"]),
                actor=str(row["actor"]),
                created_at=str(row["created_at"]),
            )
            for row in rows
        ]


def rollback_content_version(version_id: str) -> ContentBlock | None:
    engine = get_engine()

    if engine is None:
        return None

    init_database(engine)

    with engine.connect() as connection:
        version = connection.execute(
            text(
                """
                SELECT id, block_key, value
                FROM admin_content_versions
                WHERE id = :id
                """,
            ),
            {"id": version_id},
        ).mappings().first()

    if version is None:
        return None

    existing = get_content_block(str(version["block_key"]))

    if existing is None:
        return None

    rolled_back = upsert_content_block(
        key=existing.key,
        label=existing.label,
        area=existing.area,
        draft_value=str(version["value"]),
        publish=True,
        version_action="rollback",
    )

    return rolled_back


def published_content_values() -> dict[str, str]:
    return {
        block.key: block.published_value
        for block in list_content_blocks()
        if block.published_value
    }


def get_content_block(key: str) -> ContentBlock | None:
    blocks = list_content_blocks()

    return next((block for block in blocks if block.key == key), None)


def list_content_blocks() -> list[ContentBlock]:
    engine = get_engine()

    if engine is None:
        return []

    init_database(engine)

    with engine.connect() as connection:
        rows = connection.execute(
            text(
                """
                SELECT key, label, area, draft_value, published_value, updated_at, published_at
                FROM admin_content_blocks
                ORDER BY area ASC, key ASC
                """,
            ),
        ).mappings()

        return [
            ContentBlock(
                key=str(row["key"]),
                label=str(row["label"]),
                area=str(row["area"]),
                draft_value=str(row["draft_value"]),
                published_value=str(row["published_value"]),
                updated_at=str(row["updated_at"]),
                published_at=str(row["published_at"]) if row["published_at"] is not None else None,
            )
            for row in rows
        ]
