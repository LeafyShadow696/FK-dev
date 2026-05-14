from typing import Any

from fastapi import FastAPI, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field

from .content_quality import check_content_quality
from .database import (
    database_status,
    list_content_versions,
    list_content_blocks,
    list_audit_events,
    list_provider_snapshots,
    published_content_values,
    record_audit_event,
    record_provider_snapshot,
    rollback_content_version,
    upsert_content_block,
)
from .settings import get_settings


class HealthResponse(BaseModel):
    status: str
    service: str
    public_site_url: str


class IntegrationStatus(BaseModel):
    id: str
    label: str
    configured: bool


class DatabaseStatusResponse(BaseModel):
    configured: bool
    connected: bool
    initialized: bool
    dialect: str | None
    audit_log_count: int | None
    last_audit_event_at: str | None
    error: str | None = None


class AdminStatusResponse(BaseModel):
    status: str
    service: str
    public_site_url: str
    database: DatabaseStatusResponse


class AuditEventRequest(BaseModel):
    event_type: str
    actor: str = "system"
    metadata: dict[str, Any] = Field(default_factory=dict)


class AuditEventResponse(BaseModel):
    stored: bool
    event_id: str | None


class AuditEventItem(BaseModel):
    id: str
    event_type: str
    actor: str
    metadata: dict[str, Any]
    created_at: str


class AuditEventsResponse(BaseModel):
    events: list[AuditEventItem]


class ProviderSnapshotRequest(BaseModel):
    source: str
    status: str
    summary: str
    payload: dict[str, Any] = Field(default_factory=dict)


class ProviderSnapshotResponse(BaseModel):
    stored: bool
    snapshot_id: str | None


class ProviderSnapshotItem(BaseModel):
    id: str
    source: str
    status: str
    summary: str
    payload: dict[str, Any]
    created_at: str


class ProviderSnapshotsResponse(BaseModel):
    snapshots: list[ProviderSnapshotItem]


class ContentBlockRequest(BaseModel):
    key: str = Field(min_length=2, max_length=80)
    label: str = Field(min_length=2, max_length=120)
    area: str = Field(min_length=2, max_length=80)
    draft_value: str = Field(min_length=1, max_length=4000)
    publish: bool = False


class ContentBlockItem(BaseModel):
    key: str
    label: str
    area: str
    draft_value: str
    published_value: str
    updated_at: str
    published_at: str | None


class ContentVersionItem(BaseModel):
    id: str
    block_key: str
    value: str
    action: str
    actor: str
    created_at: str


class ContentBlocksResponse(BaseModel):
    blocks: list[ContentBlockItem]
    versions: list[ContentVersionItem] = Field(default_factory=list)


class ContentQualityIssueResponse(BaseModel):
    severity: str
    code: str
    message: str


class ContentQualityResponse(BaseModel):
    status: str
    issues: list[ContentQualityIssueResponse]


class ContentCheckRequest(BaseModel):
    value: str = Field(min_length=1, max_length=4000)


class ContentBlockResponse(BaseModel):
    stored: bool
    block: ContentBlockItem | None
    versions: list[ContentVersionItem] = Field(default_factory=list)
    quality: ContentQualityResponse | None = None


class ContentRollbackRequest(BaseModel):
    version_id: str = Field(min_length=8, max_length=80)


class PublishedContentResponse(BaseModel):
    content: dict[str, str]


app = FastAPI(
    title="fkdev.xyz Admin API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)


@app.on_event("startup")
def startup() -> None:
    database_status()


def require_backend_token(x_fk_backend_token: str | None) -> None:
    settings = get_settings()

    if not settings.fk_backend_admin_token:
        raise HTTPException(
            status_code=503,
            detail="Backend admin token is not configured.",
        )

    if x_fk_backend_token != settings.fk_backend_admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized.")


def quality_response(value: str) -> ContentQualityResponse:
    quality = check_content_quality(value)

    return ContentQualityResponse(
        status=quality.status,
        issues=[
            ContentQualityIssueResponse(**issue.__dict__)
            for issue in quality.issues
        ],
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()

    return HealthResponse(
        status="ok",
        service=settings.app_name,
        public_site_url=settings.public_site_url,
    )


@app.get("/admin/status", response_model=AdminStatusResponse)
def admin_status() -> AdminStatusResponse:
    settings = get_settings()
    status = database_status()

    return AdminStatusResponse(
        status="ok" if status.connected or not status.configured else "degraded",
        service=settings.app_name,
        public_site_url=settings.public_site_url,
        database=DatabaseStatusResponse(**status.__dict__),
    )


@app.post("/admin/audit", response_model=AuditEventResponse)
def create_audit_event(
    payload: AuditEventRequest,
    request: Request,
    x_fk_backend_token: str | None = Header(default=None),
) -> AuditEventResponse:
    require_backend_token(x_fk_backend_token)

    event_id = record_audit_event(
        payload.event_type,
        actor=payload.actor,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        metadata=payload.metadata,
    )

    return AuditEventResponse(stored=bool(event_id), event_id=event_id)


@app.get("/admin/audit", response_model=AuditEventsResponse)
def audit_events(
    limit: int = Query(default=10, ge=1, le=50),
    x_fk_backend_token: str | None = Header(default=None),
) -> AuditEventsResponse:
    require_backend_token(x_fk_backend_token)
    events = [
        AuditEventItem(**event.__dict__) for event in list_audit_events(limit=limit)
    ]

    return AuditEventsResponse(events=events)


@app.post("/admin/provider-snapshots", response_model=ProviderSnapshotResponse)
def create_provider_snapshot(
    payload: ProviderSnapshotRequest,
    x_fk_backend_token: str | None = Header(default=None),
) -> ProviderSnapshotResponse:
    require_backend_token(x_fk_backend_token)

    snapshot_id = record_provider_snapshot(
        source=payload.source,
        status=payload.status,
        summary=payload.summary,
        payload=payload.payload,
    )

    return ProviderSnapshotResponse(
        stored=bool(snapshot_id),
        snapshot_id=snapshot_id,
    )


@app.get("/admin/provider-snapshots", response_model=ProviderSnapshotsResponse)
def provider_snapshots(
    limit: int = Query(default=10, ge=1, le=50),
    x_fk_backend_token: str | None = Header(default=None),
) -> ProviderSnapshotsResponse:
    require_backend_token(x_fk_backend_token)
    snapshots = [
        ProviderSnapshotItem(**snapshot.__dict__)
        for snapshot in list_provider_snapshots(limit=limit)
    ]

    return ProviderSnapshotsResponse(snapshots=snapshots)


@app.get("/admin/content", response_model=ContentBlocksResponse)
def content_blocks(
    x_fk_backend_token: str | None = Header(default=None),
) -> ContentBlocksResponse:
    require_backend_token(x_fk_backend_token)
    blocks = [ContentBlockItem(**block.__dict__) for block in list_content_blocks()]
    versions = [
        ContentVersionItem(**version.__dict__)
        for version in list_content_versions(limit=30)
    ]

    return ContentBlocksResponse(blocks=blocks, versions=versions)


@app.post("/admin/content", response_model=ContentBlockResponse)
def save_content_block(
    payload: ContentBlockRequest,
    request: Request,
    x_fk_backend_token: str | None = Header(default=None),
) -> ContentBlockResponse:
    require_backend_token(x_fk_backend_token)
    quality = quality_response(payload.draft_value)

    if payload.publish and quality.status == "blocked":
        record_audit_event(
            "content.publish_blocked",
            actor="admin",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={
                "key": payload.key,
                "label": payload.label,
                "quality": quality.model_dump(),
            },
        )
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Text neprošel kontrolou před publikací.",
                "quality": quality.model_dump(),
            },
        )

    block = upsert_content_block(
        key=payload.key,
        label=payload.label,
        area=payload.area,
        draft_value=payload.draft_value,
        publish=payload.publish,
    )
    record_audit_event(
        "content.published" if payload.publish else "content.draft_saved",
        actor="admin",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        metadata={
            "key": payload.key,
            "label": payload.label,
            "area": payload.area,
            "quality": quality.model_dump(),
        },
    )

    return ContentBlockResponse(
        stored=block is not None,
        block=ContentBlockItem(**block.__dict__) if block else None,
        versions=[
            ContentVersionItem(**version.__dict__)
            for version in list_content_versions(limit=30)
        ],
        quality=quality,
    )


@app.post("/admin/content/rollback", response_model=ContentBlockResponse)
def rollback_content_block(
    payload: ContentRollbackRequest,
    request: Request,
    x_fk_backend_token: str | None = Header(default=None),
) -> ContentBlockResponse:
    require_backend_token(x_fk_backend_token)
    block = rollback_content_version(payload.version_id)
    record_audit_event(
        "content.rollback",
        actor="admin",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        metadata={
            "version_id": payload.version_id,
            "key": block.key if block else None,
            "restored": block is not None,
        },
    )

    return ContentBlockResponse(
        stored=block is not None,
        block=ContentBlockItem(**block.__dict__) if block else None,
        versions=[
            ContentVersionItem(**version.__dict__)
            for version in list_content_versions(limit=30)
        ],
    )


@app.post("/admin/content/check", response_model=ContentQualityResponse)
def check_content_block(
    payload: ContentCheckRequest,
    x_fk_backend_token: str | None = Header(default=None),
) -> ContentQualityResponse:
    require_backend_token(x_fk_backend_token)

    return quality_response(payload.value)


@app.get("/content/published", response_model=PublishedContentResponse)
def published_content() -> PublishedContentResponse:
    return PublishedContentResponse(content=published_content_values())


@app.get("/integrations", response_model=list[IntegrationStatus])
def integrations() -> list[IntegrationStatus]:
    settings = get_settings()

    return [
        IntegrationStatus(
            id="vercel",
            label="Vercel",
            configured=bool(settings.vercel_token),
        ),
        IntegrationStatus(
            id="github",
            label="GitHub",
            configured=bool(settings.github_token),
        ),
        IntegrationStatus(
            id="render",
            label="Render",
            configured=bool(settings.render_api_key),
        ),
        IntegrationStatus(
            id="railway",
            label="Railway",
            configured=bool(settings.railway_api_token),
        ),
        IntegrationStatus(
            id="database",
            label="PostgreSQL",
            configured=bool(settings.database_url),
        ),
        IntegrationStatus(
            id="storage",
            label="Cloud storage",
            configured=bool(settings.fk_storage_connection),
        ),
        IntegrationStatus(
            id="ai",
            label="AI providers",
            configured=bool(settings.openai_api_key or settings.gemini_api_key),
        ),
    ]
