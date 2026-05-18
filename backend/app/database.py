from __future__ import annotations

import hashlib
import re
import json
import os
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from html import unescape
from typing import Any
from urllib.parse import unquote, urljoin
from urllib.error import URLError
from urllib.request import Request, urlopen

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


@dataclass(frozen=True)
class Opportunity:
    id: str
    source_id: str
    category: str
    title: str
    summary: str
    url: str
    region: str
    status: str
    deadline: str | None
    score: int
    match_reasons: list[str]
    next_action: str
    metadata: dict[str, Any]
    workflow_status: str
    admin_notes: str
    checklist: list[dict[str, Any]]
    next_review_at: str | None
    decision_updated_at: str | None
    first_seen_at: str
    last_seen_at: str


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
            """
            CREATE TABLE IF NOT EXISTS admin_opportunities (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              source_id text NOT NULL UNIQUE,
              category text NOT NULL,
              title text NOT NULL,
              summary text NOT NULL,
              url text NOT NULL,
              region text NOT NULL,
              status text NOT NULL,
              deadline timestamptz,
              score integer NOT NULL,
              match_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
              next_action text NOT NULL,
              metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
              workflow_status text NOT NULL DEFAULT 'new',
              admin_notes text NOT NULL DEFAULT '',
              checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
              next_review_at timestamptz,
              decision_updated_at timestamptz,
              first_seen_at timestamptz NOT NULL DEFAULT now(),
              last_seen_at timestamptz NOT NULL DEFAULT now()
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_opportunities_score_seen ON admin_opportunities (score DESC, last_seen_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_opportunities_category ON admin_opportunities (category)",
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
            """
            CREATE TABLE IF NOT EXISTS admin_opportunities (
              id text PRIMARY KEY,
              source_id text NOT NULL UNIQUE,
              category text NOT NULL,
              title text NOT NULL,
              summary text NOT NULL,
              url text NOT NULL,
              region text NOT NULL,
              status text NOT NULL,
              deadline text,
              score integer NOT NULL,
              match_reasons text NOT NULL DEFAULT '[]',
              next_action text NOT NULL,
              metadata text NOT NULL DEFAULT '{}',
              workflow_status text NOT NULL DEFAULT 'new',
              admin_notes text NOT NULL DEFAULT '',
              checklist text NOT NULL DEFAULT '[]',
              next_review_at text,
              decision_updated_at text,
              first_seen_at text NOT NULL,
              last_seen_at text NOT NULL
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_admin_opportunities_score_seen ON admin_opportunities (score DESC, last_seen_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_admin_opportunities_category ON admin_opportunities (category)",
        ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
        _ensure_opportunity_workflow_columns(connection, engine.dialect.name)

    return True


def _ensure_opportunity_workflow_columns(connection: Any, dialect_name: str) -> None:
    columns = {
        "workflow_status": "text NOT NULL DEFAULT 'new'",
        "admin_notes": "text NOT NULL DEFAULT ''",
        "checklist": "jsonb NOT NULL DEFAULT '[]'::jsonb" if dialect_name == "postgresql" else "text NOT NULL DEFAULT '[]'",
        "next_review_at": "timestamptz" if dialect_name == "postgresql" else "text",
        "decision_updated_at": "timestamptz" if dialect_name == "postgresql" else "text",
    }

    if dialect_name == "postgresql":
        for name, definition in columns.items():
            connection.execute(
                text(f"ALTER TABLE admin_opportunities ADD COLUMN IF NOT EXISTS {name} {definition}"),
            )
        return

    existing = {
        str(row["name"])
        for row in connection.execute(text("PRAGMA table_info(admin_opportunities)")).mappings()
    }
    for name, definition in columns.items():
        if name not in existing:
            connection.execute(
                text(f"ALTER TABLE admin_opportunities ADD COLUMN {name} {definition}"),
            )


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
            "admin_opportunities": _export_rows(
                "admin_opportunities",
                "score DESC, last_seen_at DESC",
            ),
        },
    }


OPPORTUNITY_PROFILE = {
    "business_name": "František Kalášek",
    "ico": "23628588",
    "base_region": "Daňkovice / Žďár nad Sázavou / Vysočina",
    "activities": [
        "software development",
        "IT consulting",
        "data processing",
        "hosting and web portals",
        "automation",
        "digitalization",
        "marketing and media representation",
        "education and training",
    ],
}


SEED_OPPORTUNITIES: list[dict[str, Any]] = [
    {
        "source_id": "cz-public-procurement-it-web-automation",
        "category": "public_procurement",
        "title": "Veřejné zakázky: weby, portály, automatizace a IT služby",
        "summary": "Sledování NEN a navázaných veřejných zakázek pro poptávky po webech, interních portálech, PWA, automatizaci, digitalizaci a IT konzultacích.",
        "url": "https://portal-vz.cz/nipez/nen-2/",
        "region": "ČR / filtrovat Vysočina a okolní kraje",
        "status": "watching",
        "deadline": None,
        "keywords": ["web", "portál", "PWA", "automatizace", "software", "IT služby", "digitalizace"],
        "next_action": "Jednou denně otevřít výsledky pro klíčová slova a uložit konkrétní zakázky s lhůtou, rozpočtem a kvalifikačními podmínkami.",
    },
    {
        "source_id": "mpsv-market-demand-it-digital",
        "category": "market_signal",
        "title": "Regionální signál poptávky: IT, software a digitalizace",
        "summary": "Otevřená data MPSV o volných místech pomohou sledovat, kde firmy hledají IT/digitální kompetence. Nejde o přímou zakázku, ale o poptávkový signál pro oslovení trhu.",
        "url": "https://data.mpsv.cz/web/data/zamestnanost",
        "region": "Vysočina + ČR trend",
        "status": "watching",
        "deadline": None,
        "keywords": ["programátor", "software", "IT", "správce", "data", "web", "automatizace"],
        "next_action": "Doplnit parser CSV datasetů MPSV a počítat trend podle regionu a klíčových slov.",
    },
    {
        "source_id": "optak-api-digitalization-grants",
        "category": "grant",
        "title": "OP TAK / API: digitalizace, technologie a inovace",
        "summary": "Primární dotační zdroj pro malé a střední podniky v tématech digitalizace, software, IT infrastruktura, automatizace a inovace.",
        "url": "https://apiagentura.gov.cz/",
        "region": "ČR mimo Prahu podle konkrétní výzvy",
        "status": "watching",
        "deadline": None,
        "keywords": ["OP TAK", "Digitální podnik", "technologie", "inovace", "software", "IT infrastruktura"],
        "next_action": "Hlídání nových výzev API a předvyplnění eligibility checklistu podle IČO, sídla, aktivit a de minimis limitů.",
    },
    {
        "source_id": "jdp-grant-portal-business-digital",
        "category": "grant",
        "title": "Jednotný dotační portál: podnikání a digitalizace",
        "summary": "Centrální rozhraní pro příjem žádostí a monitoring vybraných dotačních titulů. Vhodné pro dohledání konkrétních žádostí a auditní stopy.",
        "url": "https://jdp.mf.gov.cz/rispf/Home/About",
        "region": "ČR",
        "status": "watching",
        "deadline": None,
        "keywords": ["dotace", "podnikání", "digitalizace", "žádost", "výzva"],
        "next_action": "Při nalezení vhodné výzvy založit checklist příloh a stav přípravy žádosti.",
    },
    {
        "source_id": "eu-funding-tenders-digital-sme",
        "category": "eu_call",
        "title": "EU Funding & Tenders: digitální služby, tendry a SME výzvy",
        "summary": "Evropský portál pro granty a tendry. Relevantní zejména pro Digital Europe, Single Market Programme, tendry na web/IT služby a konsorciální projekty.",
        "url": "https://commission.europa.eu/funding-tenders/find-calls-tender_en",
        "region": "EU / ČR jako účastník",
        "status": "watching",
        "deadline": None,
        "keywords": ["Digital Europe", "SME", "web", "software", "automation", "IT services"],
        "next_action": "Filtrovat otevřené výzvy podle témat Digital/SME a označit, zda je vhodné jít samostatně nebo jako subdodavatel.",
    },
]

OPPORTUNITY_IMPORT_LIMIT = 8
OPPORTUNITY_FETCH_TIMEOUT_SECONDS = 12
OPPORTUNITY_RESPONSE_LIMIT_BYTES = 8_000_000
MPSV_FULL_DATASET_URL = "https://data.mpsv.cz/od/soubory/volna-mista/volna-mista.json"
API_OP_TAK_CALLS_URL = "https://apiagentura.gov.cz/cs/radce/vsechny-vyzvy/"
NEN_PUBLIC_PROCUREMENT_URL = "https://portal-vz.cz/nipez/nen-2/"
NEN_PUBLIC_PROCUREMENT_LIST_URL = "https://nen.nipez.cz/verejne-zakazky/p%3Avz%3Apage%3D1-3%3Bdns%3Apage%3D3-6%3Bvestnik%3Apage%3D1-2"

MPSV_IT_KEYWORDS = [
    "automatizace",
    "data",
    "datab",
    "digital",
    "hosting",
    "it ",
    "program",
    "python",
    "software",
    "spravce site",
    "správce sítě",
    "technik it",
    "web",
]
MPSV_REGION_KEYWORDS = [
    "bystrice",
    "bystřice",
    "dankovice",
    "daňkovice",
    "havlickuv brod",
    "havlíčkův brod",
    "jihlava",
    "nove mesto",
    "nové město",
    "pelhrimov",
    "pelhřimov",
    "trebic",
    "třebíč",
    "vysocina",
    "vysočina",
    "zdar nad sazavou",
    "žďár nad sázavou",
]
GRANT_KEYWORDS = [
    "aplikace",
    "automatizace",
    "data",
    "digital",
    "digitální",
    "inovační voucher",
    "inovace",
    "poradenství",
    "software",
    "technologie",
    "vysokorychlostní internet",
]
TENDER_KEYWORDS = [
    "automatizace",
    "data",
    "digitalizace",
    "informační systém",
    "it služby",
    "portál",
    "software",
    "web",
]


def _stable_source_id(prefix: str, *parts: object) -> str:
    digest = hashlib.sha256("|".join(str(part) for part in parts).encode("utf-8")).hexdigest()
    return f"{prefix}-{digest[:16]}"


def _normalize_search_text(value: object) -> str:
    replacements = str.maketrans(
        {
            "á": "a",
            "č": "c",
            "ď": "d",
            "é": "e",
            "ě": "e",
            "í": "i",
            "ň": "n",
            "ó": "o",
            "ř": "r",
            "š": "s",
            "ť": "t",
            "ú": "u",
            "ů": "u",
            "ý": "y",
            "ž": "z",
        },
    )
    return str(value).lower().translate(replacements)


def _nested_text(value: object) -> str:
    if isinstance(value, dict):
        return " ".join(_nested_text(item) for item in value.values())
    if isinstance(value, list):
        return " ".join(_nested_text(item) for item in value)
    if value is None:
        return ""
    return str(value)


def _field(payload: dict[str, Any], names: list[str]) -> str:
    normalized_names = {_normalize_search_text(name) for name in names}
    for key, value in payload.items():
        if _normalize_search_text(key) in normalized_names and value not in (None, ""):
            return str(value)
    return ""


def _read_url_json(
    url: str,
    *,
    max_bytes: int = OPPORTUNITY_RESPONSE_LIMIT_BYTES,
    timeout: int = OPPORTUNITY_FETCH_TIMEOUT_SECONDS,
) -> object:
    request = Request(url, headers={"User-Agent": "fkdev-opportunity-radar/1.0"})
    with urlopen(request, timeout=timeout) as response:
        raw = response.read(max_bytes + 1)

    if len(raw) > max_bytes:
        raise ValueError(f"Opportunity source response exceeded {max_bytes} bytes")

    text_value = raw.decode("utf-8-sig")
    stripped = text_value.lstrip()
    if not stripped.startswith(("[", "{")) or "Chyba 404" in stripped[:1000]:
        raise ValueError("Opportunity source did not return JSON payload")

    return json.loads(text_value)


def _read_url_text(
    url: str,
    *,
    max_bytes: int = OPPORTUNITY_RESPONSE_LIMIT_BYTES,
    timeout: int = OPPORTUNITY_FETCH_TIMEOUT_SECONDS,
) -> str:
    request = Request(url, headers={"User-Agent": "fkdev-opportunity-radar/1.0"})
    with urlopen(request, timeout=timeout) as response:
        raw = response.read(max_bytes + 1)

    if len(raw) > max_bytes:
        raise ValueError(f"Opportunity source response exceeded {max_bytes} bytes")

    return raw.decode("utf-8", errors="replace")


def _plain_text_from_html(html: str) -> str:
    without_scripts = re.sub(r"(?is)<(script|style).*?</\1>", " ", html)
    without_tags = re.sub(r"(?s)<[^>]+>", " ", without_scripts)
    return re.sub(r"\s+", " ", unescape(without_tags)).strip()


def _html_links(html: str, base_url: str) -> list[tuple[str, str]]:
    links: list[tuple[str, str]] = []
    for match in re.finditer(r'(?is)<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html):
        href = urljoin(base_url, unescape(match.group(1)))
        label = _plain_text_from_html(match.group(2))
        if label:
            links.append((label, href))
    return links


def _deadline_from_text(text_value: str) -> str | None:
    matches = re.findall(r"\b\d{1,2}\.\s*\d{1,2}\.\s*\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?", text_value)
    if not matches:
        return None

    parsed = [(_parse_cz_datetime(match), match) for match in matches]
    parsed_dates = [(date_value, match) for date_value, match in parsed if date_value is not None]
    if not parsed_dates:
        return matches[-1]

    return max(parsed_dates, key=lambda item: item[0])[1]


def _initial_redux_state(html: str) -> dict[str, Any]:
    match = re.search(r'<meta name="initialReduxState" content="([^"]+)"', html)
    if not match:
        return {}

    try:
        parsed = json.loads(unquote(unescape(match.group(1))))
    except json.JSONDecodeError:
        return {}

    return parsed if isinstance(parsed, dict) else {}


def _parse_cz_datetime(value: str) -> datetime | None:
    normalized = re.sub(r"\s+", " ", value.strip())
    for fmt in ("%d. %m. %Y %H:%M:%S", "%d. %m. %Y %H:%M", "%d. %m. %Y"):
        try:
            return datetime.strptime(normalized, fmt).replace(tzinfo=UTC)
        except ValueError:
            continue

    return None


def _mpsv_candidate_urls(now: datetime) -> list[str]:
    urls: list[str] = []
    for day_offset in range(4):
        day = (now - timedelta(days=day_offset)).date().isoformat()
        urls.append(
            f"https://data.mpsv.cz/od/soubory/prirustky-volnych-mist/prirustky-volnych-mist-{day}.json",
        )

    if os.getenv("FK_OPPORTUNITY_ENABLE_MPSV_FULL_IMPORT", "").lower() in {"1", "true", "yes"}:
        urls.append(MPSV_FULL_DATASET_URL)

    return urls


def _payload_items(payload: object) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    if not isinstance(payload, dict):
        return []

    for key in ("data", "items", "volnaMista", "volna_mista", "polozky", "results"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]

    return []


def _mpsv_opportunities_from_payload(
    payload: object,
    *,
    source_url: str,
    imported_at: str,
) -> list[dict[str, Any]]:
    opportunities: list[dict[str, Any]] = []

    for item in _payload_items(payload):
        search_text = _normalize_search_text(_nested_text(item))
        matched_it = [keyword for keyword in MPSV_IT_KEYWORDS if _normalize_search_text(keyword) in search_text]
        matched_region = [
            keyword for keyword in MPSV_REGION_KEYWORDS if _normalize_search_text(keyword) in search_text
        ]

        if not matched_it and not matched_region:
            continue

        title = _field(item, ["profese", "nazev", "název", "pracovniPozice", "pracovni_misto", "pozice", "obor"])
        employer = _field(item, ["zamestnavatel", "zaměstnavatel", "firma", "nazevZamestnavatele"])
        location = _field(item, ["obec", "mistoVykonu", "místoVýkonu", "misto_vykonu", "lokalita", "okres", "kraj"])
        deadline = _field(item, ["platnostDo", "platnost_do", "datumExpirace", "datumZmeny"])
        item_url = _field(item, ["url", "odkaz"]) or "https://data.mpsv.cz/web/data/zamestnanost"

        display_title = title or employer or "MPSV signál poptávky po digitálních kompetencích"
        summary_parts = [
            "Otevřená data MPSV zachytila položku odpovídající IT, webu, datům nebo regionu.",
        ]
        if employer:
            summary_parts.append(f"Subjekt: {employer}.")
        if location:
            summary_parts.append(f"Lokalita: {location}.")

        score = 58
        reasons = ["Importovaný signál z otevřených dat MPSV."]
        if matched_it:
            score += 18
            reasons.append("Text odpovídá IT, webu, datům, automatizaci nebo softwaru.")
        if matched_region:
            score += 10
            reasons.append("Text odpovídá Vysočině nebo blízkému regionu.")

        opportunities.append(
            {
                "source_id": _stable_source_id("mpsv", title, employer, location, deadline, item_url),
                "category": "market_signal",
                "title": display_title[:180],
                "summary": " ".join(summary_parts),
                "url": item_url,
                "region": location or "ČR / neupřesněno",
                "status": "imported",
                "deadline": deadline or None,
                "keywords": sorted(set(matched_it + matched_region)),
                "score": min(score, 100),
                "match_reasons": reasons,
                "next_action": "Ověřit firmu/lokalitu a zvážit oslovení s nabídkou webu, automatizace nebo IT podpory.",
                "metadata": {
                    "source_type": "mpsv_import",
                    "raw_source": source_url,
                    "imported_at": imported_at,
                },
            },
        )

        if len(opportunities) >= OPPORTUNITY_IMPORT_LIMIT:
            break

    return opportunities


def _api_grant_opportunities_from_html(
    html: str,
    *,
    source_url: str,
    imported_at: str,
) -> list[dict[str, Any]]:
    closed_marker = re.search(r"(?i)Uzavřené\s+výzvy", html)
    if closed_marker:
        html = html[: closed_marker.start()]

    plain_text = _plain_text_from_html(html)
    opportunities: list[dict[str, Any]] = []

    for title, href in _html_links(html, source_url):
        if len(title) < 12:
            continue

        title_search = _normalize_search_text(title)
        matched = [keyword for keyword in GRANT_KEYWORDS if _normalize_search_text(keyword) in title_search]
        if not matched:
            continue

        title_position = plain_text.find(title)
        context = plain_text[max(0, title_position - 180) : title_position + len(title) + 260] if title_position >= 0 else title
        if not _deadline_from_text(context):
            continue

        context_search = _normalize_search_text(context)
        matched_context = [
            keyword for keyword in GRANT_KEYWORDS if _normalize_search_text(keyword) in context_search
        ]
        keywords = sorted(set(matched + matched_context))
        deadline = _deadline_from_text(context)
        parsed_deadline = _parse_cz_datetime(deadline) if deadline else None
        if parsed_deadline and parsed_deadline < datetime.now(UTC):
            continue
        normalized_deadline = parsed_deadline.isoformat() if parsed_deadline else deadline

        score = 74
        reasons = ["Importovaná dotační výzva z oficiálního přehledu API / OP TAK."]
        if any(_normalize_search_text(keyword) in title_search for keyword in ("digital", "digitální", "software")):
            score += 14
            reasons.append("Název výzvy přímo míří na digitalizaci, software nebo digitální technologie.")
        if deadline:
            score += 6
            reasons.append("Výzva má dohledatelný termín ukončení příjmu.")

        opportunities.append(
            {
                "source_id": _stable_source_id("api-optak", title, href, deadline),
                "category": "grant",
                "title": title[:180],
                "summary": (
                    "Oficiální přehled výzev OP TAK obsahuje titul odpovídající tématům "
                    "digitalizace, technologií, inovací, poradenství nebo softwaru."
                ),
                "url": href,
                "region": "ČR mimo Prahu podle podmínek výzvy",
                "status": "imported",
                "deadline": normalized_deadline,
                "keywords": keywords,
                "score": min(score, 100),
                "match_reasons": reasons,
                "next_action": "Otevřít detail výzvy, ověřit oprávněnost podle IČO, sídla, velikosti podniku, CZ-NACE a požadovaných příloh.",
                "metadata": {
                    "source_type": "api_optak_import",
                    "raw_source": source_url,
                    "imported_at": imported_at,
                    "deadline_label": deadline,
                    "context": context[:600],
                },
            },
        )

        if len(opportunities) >= OPPORTUNITY_IMPORT_LIMIT:
            break

    return opportunities


def import_api_grant_opportunities(now: datetime) -> list[dict[str, Any]]:
    imported_at = now.isoformat()

    try:
        html = _read_url_text(API_OP_TAK_CALLS_URL)
    except (OSError, URLError, TimeoutError, ValueError, UnicodeDecodeError) as error:
        return [
            {
                "source_id": "api-optak-import-status",
                "category": "grant",
                "title": "OP TAK import: přehled výzev API se nepodařilo načíst",
                "summary": "Radar má připravený parser oficiálního přehledu výzev API, ale poslední kontrola nevrátila použitelnou stránku.",
                "url": API_OP_TAK_CALLS_URL,
                "region": "ČR mimo Prahu podle podmínek výzvy",
                "status": "watching",
                "deadline": None,
                "keywords": ["OP TAK", "API", "dotace", "digitalizace"],
                "score": 57,
                "match_reasons": ["Importní adaptér zachoval watch stav a uložil chybu zdroje do metadat."],
                "next_action": "Zkontrolovat dostupnost API webu a případně použít ruční ověření výzev.",
                "metadata": {
                    "source_type": "api_optak_import_status",
                    "raw_source": API_OP_TAK_CALLS_URL,
                    "imported_at": imported_at,
                    "error": str(error)[:220],
                },
            },
        ]

    imported = _api_grant_opportunities_from_html(
        html,
        source_url=API_OP_TAK_CALLS_URL,
        imported_at=imported_at,
    )
    if imported:
        return imported

    return [
        {
            "source_id": "api-optak-import-status",
            "category": "grant",
            "title": "OP TAK import: bez nové digitální shody",
            "summary": "Parser oficiálního přehledu API proběhl, ale v aktuálním HTML nenašel výzvu odpovídající nastaveným digitálním klíčovým slovům.",
            "url": API_OP_TAK_CALLS_URL,
            "region": "ČR mimo Prahu podle podmínek výzvy",
            "status": "watching",
            "deadline": None,
            "keywords": ["OP TAK", "API", "dotace", "digitalizace"],
            "score": 54,
            "match_reasons": ["Zdroj byl dostupný a parser proběhl bez chyby."],
            "next_action": "Rozšířit klíčová slova nebo ručně zkontrolovat nové výzvy v přehledu API.",
            "metadata": {
                "source_type": "api_optak_import_status",
                "raw_source": API_OP_TAK_CALLS_URL,
                "imported_at": imported_at,
            },
        },
    ]


def import_public_procurement_opportunities(now: datetime) -> list[dict[str, Any]]:
    imported_at = now.isoformat()

    try:
        html = _read_url_text(NEN_PUBLIC_PROCUREMENT_LIST_URL)
    except (OSError, URLError, TimeoutError, ValueError, UnicodeDecodeError) as error:
        return [
            _nen_import_status(
                imported_at=imported_at,
                summary=f"Zdroj se nepodařilo načíst: {str(error)[:160]}",
            ),
        ]

    imported = _nen_opportunities_from_html(
        html,
        source_url=NEN_PUBLIC_PROCUREMENT_LIST_URL,
        imported_at=imported_at,
    )
    if imported:
        return imported

    return [
        _nen_import_status(
            imported_at=imported_at,
            summary="Veřejný seznam NEN byl dostupný, ale poslední načtená dávka neobsahovala položku odpovídající IT/web klíčovým slovům.",
        ),
    ]


def _nen_opportunities_from_html(
    html: str,
    *,
    source_url: str,
    imported_at: str,
) -> list[dict[str, Any]]:
    state = _initial_redux_state(html)
    collections = (
        state.get("collectionStore", {})
        .get("collections", {})
        .get("verejne-zakazky-seznam", {})
    )
    records = collections.get("collection", [])
    if not isinstance(records, list):
        return []

    opportunities: list[dict[str, Any]] = []
    for record in records:
        if not isinstance(record, dict):
            continue

        text_value = _normalize_search_text(_nested_text(record))
        matched = [keyword for keyword in TENDER_KEYWORDS if _normalize_search_text(keyword) in text_value]
        if not matched:
            continue

        title = str(record.get("nazev") or record.get("name") or "NEN veřejná zakázka").strip()
        code = str(record.get("kod") or record.get("code") or record.get("id") or "").strip()
        contracting_authority = str(record.get("zadavatelNazev") or record.get("zadavatel") or "").strip()
        deadline = str(record.get("podaniLhuta") or record.get("lhuta") or "").strip() or None
        detail_path = f"/verejne-zakazky/detail-zakazky/{record.get('id')}" if record.get("id") else "/verejne-zakazky"
        url = urljoin("https://nen.nipez.cz", detail_path)

        score = 72
        reasons = ["Importovaná veřejná zakázka z veřejného seznamu NEN."]
        if deadline:
            score += 6
            reasons.append("Zakázka má dohledatelnou lhůtu pro podání.")
        if contracting_authority:
            score += 4
            reasons.append("Záznam obsahuje zadavatele pro rychlé ověření relevance.")

        opportunities.append(
            {
                "source_id": _stable_source_id("nen", code, title, deadline),
                "category": "public_procurement",
                "title": title[:180],
                "summary": (
                    f"NEN záznam odpovídá klíčovým slovům pro IT, software, web nebo digitalizaci."
                    + (f" Zadavatel: {contracting_authority}." if contracting_authority else "")
                ),
                "url": url,
                "region": "ČR / ověřit detail v NEN",
                "status": "imported",
                "deadline": deadline,
                "keywords": sorted(set(matched)),
                "score": min(score, 100),
                "match_reasons": reasons,
                "next_action": "Otevřít detail v NEN, ověřit zadávací dokumentaci, kvalifikaci, lhůtu a zda dává smysl podat nabídku nebo poslat dotaz zadavateli.",
                "metadata": {
                    "source_type": "nen_import",
                    "raw_source": source_url,
                    "imported_at": imported_at,
                    "code": code,
                    "contracting_authority": contracting_authority,
                },
            },
        )

        if len(opportunities) >= OPPORTUNITY_IMPORT_LIMIT:
            break

    return opportunities


def _nen_import_status(*, imported_at: str, summary: str) -> dict[str, Any]:
    return {
        "source_id": "nen-public-procurement-import-status",
        "category": "public_procurement",
        "title": "NEN import: hlídání IT/web zakázek",
        "summary": summary,
        "url": NEN_PUBLIC_PROCUREMENT_LIST_URL,
        "region": "ČR / filtrovat Vysočina a okolní kraje",
        "status": "watching",
        "deadline": None,
        "keywords": ["NEN", "veřejné zakázky", "NIPEZ", "CPV", "IT služby", "software", "web"],
        "score": 61,
        "match_reasons": [
            "NEN je oficiální elektronický nástroj pro zadávání veřejných zakázek.",
            "Parser veřejného seznamu běží konzervativně nad položkami dostupnými v HTML snapshotu.",
        ],
        "next_action": "Zkontrolovat konkrétní NEN položky a průběžně doplnit přesnější CPV/NIPEZ filtr pro software, webové portály a IT služby.",
        "metadata": {
            "source_type": "nen_import_status",
            "raw_source": NEN_PUBLIC_PROCUREMENT_LIST_URL,
            "imported_at": imported_at,
        },
    }


def import_live_opportunities(now: datetime) -> list[dict[str, Any]]:
    imported_at = now.isoformat()
    imported: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []

    for url in _mpsv_candidate_urls(now):
        try:
            payload = _read_url_json(url)
        except (OSError, URLError, TimeoutError, ValueError, json.JSONDecodeError, UnicodeDecodeError) as error:
            failures.append({"url": url, "error": str(error)[:220]})
            continue

        imported.extend(_mpsv_opportunities_from_payload(payload, source_url=url, imported_at=imported_at))
        if imported:
            break

    mpsv_items = imported[:OPPORTUNITY_IMPORT_LIMIT] if imported else [
        {
            "source_id": "mpsv-live-import-status",
            "category": "market_signal",
            "title": "MPSV import: čeká na dostupný denní JSON zdroj",
            "summary": "Radar má připravený importní adaptér, ale poslední kontrolované přírůstkové zdroje nevrátily použitelný JSON. Plný dataset MPSV je kvůli velikosti na hostingu vypnutý, dokud se nezapne FK_OPPORTUNITY_ENABLE_MPSV_FULL_IMPORT.",
            "url": "https://data.mpsv.cz/web/data/zamestnanost",
            "region": "Vysočina + ČR trend",
            "status": "watching",
            "deadline": None,
            "keywords": ["MPSV", "import", "volná místa", "IT", "digitalizace"],
            "score": 55,
            "match_reasons": [
                "Importní adaptér je připravený, ale chrání backend před stahováním velkého datasetu bez výslovného přepínače.",
            ],
            "next_action": "Zapnout FK_OPPORTUNITY_ENABLE_MPSV_FULL_IMPORT jen při dostatečném runtime limitu, nebo doplnit menší veřejný endpoint s přírůstky.",
            "metadata": {
                "source_type": "mpsv_import_status",
                "attempted_sources": failures,
                "imported_at": imported_at,
            },
        },
    ]

    return [
        *mpsv_items,
        *import_api_grant_opportunities(now),
        *import_public_procurement_opportunities(now),
    ]


def _score_opportunity(seed: dict[str, Any]) -> tuple[int, list[str]]:
    keywords = [str(keyword).lower() for keyword in seed.get("keywords", [])]
    reasons: list[str] = []
    score = 35

    if seed["category"] in {"grant", "eu_call"}:
        score += 20
        reasons.append("Relevantní pro financování rozvoje podnikání nebo digitalizace.")

    if seed["category"] == "public_procurement":
        score += 18
        reasons.append("Může přinést přímou poptávku po nabízených službách.")

    if seed["category"] == "market_signal":
        score += 10
        reasons.append("Pomáhá odhalit regionální poptávku po digitálních kompetencích.")

    if any(keyword in {"software", "web", "automatizace", "digitalizace"} for keyword in keywords):
        score += 18
        reasons.append("Shoda s činnostmi: software, webové portály, automatizace a IT konzultace.")

    if "Vysočina" in str(seed.get("region", "")) or "ČR" in str(seed.get("region", "")):
        score += 9
        reasons.append("Geograficky použitelný zdroj pro sídlo Daňkovice / Vysočina.")

    return min(score, 100), reasons


def refresh_opportunities() -> list[Opportunity]:
    engine = get_engine()

    if engine is None:
        return []

    init_database(engine)

    refreshed: list[Opportunity] = []
    refresh_started_at = datetime.now(UTC)
    now = refresh_started_at.isoformat()

    with engine.begin() as connection:
        for seed in [*SEED_OPPORTUNITIES, *import_live_opportunities(refresh_started_at)]:
            score, reasons = (
                (int(seed["score"]), list(seed["match_reasons"]))
                if "score" in seed and "match_reasons" in seed
                else _score_opportunity(seed)
            )
            opportunity_id = str(uuid.uuid4())
            metadata = {
                "profile": OPPORTUNITY_PROFILE,
                "keywords": seed.get("keywords", []),
                "source_type": seed.get("source_type", "curated_watch"),
                **seed.get("metadata", {}),
            }

            if engine.dialect.name == "postgresql":
                statement = text(
                    """
                    INSERT INTO admin_opportunities
                      (id, source_id, category, title, summary, url, region, status, deadline, score, match_reasons, next_action, metadata)
                    VALUES
                      (:id, :source_id, :category, :title, :summary, :url, :region, :status, :deadline, :score, CAST(:match_reasons AS jsonb), :next_action, CAST(:metadata AS jsonb))
                    ON CONFLICT (source_id) DO UPDATE SET
                      category = EXCLUDED.category,
                      title = EXCLUDED.title,
                      summary = EXCLUDED.summary,
                      url = EXCLUDED.url,
                      region = EXCLUDED.region,
                      status = EXCLUDED.status,
                      deadline = EXCLUDED.deadline,
                      score = EXCLUDED.score,
                      match_reasons = EXCLUDED.match_reasons,
                      next_action = EXCLUDED.next_action,
                      metadata = EXCLUDED.metadata,
                      last_seen_at = now()
                    """,
                )
                params: dict[str, Any] = {
                    "id": opportunity_id,
                    "source_id": seed["source_id"],
                    "category": seed["category"],
                    "title": seed["title"],
                    "summary": seed["summary"],
                    "url": seed["url"],
                    "region": seed["region"],
                    "status": seed["status"],
                    "deadline": seed["deadline"],
                    "score": score,
                    "match_reasons": json.dumps(reasons),
                    "next_action": seed["next_action"],
                    "metadata": json.dumps(metadata),
                }
            else:
                statement = text(
                    """
                    INSERT INTO admin_opportunities
                      (id, source_id, category, title, summary, url, region, status, deadline, score, match_reasons, next_action, metadata, first_seen_at, last_seen_at)
                    VALUES
                      (:id, :source_id, :category, :title, :summary, :url, :region, :status, :deadline, :score, :match_reasons, :next_action, :metadata, :first_seen_at, :last_seen_at)
                    ON CONFLICT (source_id) DO UPDATE SET
                      category = excluded.category,
                      title = excluded.title,
                      summary = excluded.summary,
                      url = excluded.url,
                      region = excluded.region,
                      status = excluded.status,
                      deadline = excluded.deadline,
                      score = excluded.score,
                      match_reasons = excluded.match_reasons,
                      next_action = excluded.next_action,
                      metadata = excluded.metadata,
                      last_seen_at = excluded.last_seen_at
                    """,
                )
                params = {
                    "id": opportunity_id,
                    "source_id": seed["source_id"],
                    "category": seed["category"],
                    "title": seed["title"],
                    "summary": seed["summary"],
                    "url": seed["url"],
                    "region": seed["region"],
                    "status": seed["status"],
                    "deadline": seed["deadline"],
                    "score": score,
                    "match_reasons": json.dumps(reasons),
                    "next_action": seed["next_action"],
                    "metadata": json.dumps(metadata),
                    "first_seen_at": now,
                    "last_seen_at": now,
                }

            connection.execute(statement, params)

    refreshed = list_opportunities(limit=20)

    return refreshed


OPPORTUNITY_WORKFLOW_STATUSES = {
    "new",
    "verify",
    "good_fit",
    "not_fit",
    "in_progress",
    "submitted",
}


def _sanitize_checklist(checklist: list[dict[str, Any]]) -> list[dict[str, Any]]:
    sanitized: list[dict[str, Any]] = []

    for item in checklist[:20]:
        label = str(item.get("label", "")).strip()
        if not label:
            continue

        sanitized.append(
            {
                "id": str(item.get("id") or _stable_source_id("check", label))[:80],
                "label": label[:220],
                "done": bool(item.get("done", False)),
            },
        )

    return sanitized


def update_opportunity_workflow(
    *,
    opportunity_id: str,
    workflow_status: str,
    admin_notes: str,
    checklist: list[dict[str, Any]],
    next_review_at: str | None = None,
) -> Opportunity | None:
    engine = get_engine()

    if engine is None:
        return None

    init_database(engine)

    normalized_status = workflow_status if workflow_status in OPPORTUNITY_WORKFLOW_STATUSES else "verify"
    normalized_checklist = _sanitize_checklist(checklist)
    notes = admin_notes.strip()[:4000]
    now = datetime.now(UTC).isoformat()
    parsed_review = _parse_optional_datetime(next_review_at)
    review_value = parsed_review.isoformat() if parsed_review else None

    with engine.begin() as connection:
        if engine.dialect.name == "postgresql":
            result = connection.execute(
                text(
                    """
                    UPDATE admin_opportunities
                    SET workflow_status = :workflow_status,
                        admin_notes = :admin_notes,
                        checklist = CAST(:checklist AS jsonb),
                        next_review_at = :next_review_at,
                        decision_updated_at = now()
                    WHERE id = CAST(:id AS uuid)
                    """,
                ),
                {
                    "id": opportunity_id,
                    "workflow_status": normalized_status,
                    "admin_notes": notes,
                    "checklist": json.dumps(normalized_checklist),
                    "next_review_at": review_value,
                },
            )
        else:
            result = connection.execute(
                text(
                    """
                    UPDATE admin_opportunities
                    SET workflow_status = :workflow_status,
                        admin_notes = :admin_notes,
                        checklist = :checklist,
                        next_review_at = :next_review_at,
                        decision_updated_at = :decision_updated_at
                    WHERE id = :id
                    """,
                ),
                {
                    "id": opportunity_id,
                    "workflow_status": normalized_status,
                    "admin_notes": notes,
                    "checklist": json.dumps(normalized_checklist),
                    "next_review_at": review_value,
                    "decision_updated_at": now,
                },
            )

        if result.rowcount == 0:
            return None

    return get_opportunity(opportunity_id)


def _parse_optional_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    stripped = value.strip()
    if not stripped:
        return None

    try:
        parsed = datetime.fromisoformat(stripped.replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)

    return parsed.astimezone(UTC)


def get_opportunity(opportunity_id: str) -> Opportunity | None:
    opportunities = list_opportunities(limit=50)
    return next((item for item in opportunities if item.id == opportunity_id), None)


def list_opportunities(limit: int = 12) -> list[Opportunity]:
    engine = get_engine()

    if engine is None:
        return []

    init_database(engine)
    safe_limit = max(1, min(limit, 50))

    with engine.connect() as connection:
        rows = connection.execute(
            text(
                """
                SELECT id, source_id, category, title, summary, url, region, status,
                       deadline, score, match_reasons, next_action, metadata,
                       workflow_status, admin_notes, checklist, next_review_at,
                       decision_updated_at, first_seen_at, last_seen_at
                FROM admin_opportunities
                ORDER BY score DESC, last_seen_at DESC
                LIMIT :limit
                """,
            ),
            {"limit": safe_limit},
        ).mappings()

        opportunities: list[Opportunity] = []
        for row in rows:
            match_reasons = _json_value(row["match_reasons"])
            metadata = _json_value(row["metadata"])
            checklist = _json_value(row["checklist"])
            opportunities.append(
                Opportunity(
                    id=str(row["id"]),
                    source_id=str(row["source_id"]),
                    category=str(row["category"]),
                    title=str(row["title"]),
                    summary=str(row["summary"]),
                    url=str(row["url"]),
                    region=str(row["region"]),
                    status=str(row["status"]),
                    deadline=str(row["deadline"]) if row["deadline"] else None,
                    score=int(row["score"]),
                    match_reasons=match_reasons if isinstance(match_reasons, list) else [],
                    next_action=str(row["next_action"]),
                    metadata=metadata if isinstance(metadata, dict) else {},
                    workflow_status=str(row["workflow_status"] or "new"),
                    admin_notes=str(row["admin_notes"] or ""),
                    checklist=checklist if isinstance(checklist, list) else [],
                    next_review_at=str(row["next_review_at"]) if row["next_review_at"] else None,
                    decision_updated_at=str(row["decision_updated_at"]) if row["decision_updated_at"] else None,
                    first_seen_at=str(row["first_seen_at"]),
                    last_seen_at=str(row["last_seen_at"]),
                ),
            )

    return opportunities


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
