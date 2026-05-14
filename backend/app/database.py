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
