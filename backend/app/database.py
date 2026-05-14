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


def upsert_content_block(
    *,
    key: str,
    label: str,
    area: str,
    draft_value: str,
    publish: bool = False,
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
        return get_content_block(normalized_key)

    return ContentBlock(
        key=str(row["key"]),
        label=str(row["label"]),
        area=str(row["area"]),
        draft_value=str(row["draft_value"]),
        published_value=str(row["published_value"]),
        updated_at=str(row["updated_at"]),
        published_at=str(row["published_at"]) if row["published_at"] is not None else None,
    )


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
