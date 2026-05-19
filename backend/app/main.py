from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator

from .content_quality import check_content_quality
from .database import (
    database_status,
    export_admin_data,
    list_official_drafts,
    list_opportunities,
    list_content_versions,
    list_content_blocks,
    list_audit_events,
    list_provider_snapshots,
    published_content_values,
    record_audit_event,
    record_provider_snapshot,
    record_telemetry_event,
    refresh_opportunities,
    rollback_content_version,
    save_official_draft,
    telemetry_summary,
    update_opportunity_workflow,
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


class TelemetryEventRequest(BaseModel):
    session_id: str = Field(min_length=12, max_length=80)
    event_type: str = Field(min_length=2, max_length=40)
    path: str = Field(min_length=1, max_length=240)
    referrer: str | None = Field(default=None, max_length=240)
    viewport: str | None = Field(default=None, max_length=80)
    metadata: dict[str, Any] = Field(default_factory=dict)


class TelemetryEventResponse(BaseModel):
    stored: bool
    event_id: str | None


class TelemetrySummaryResponse(BaseModel):
    active_sessions: int
    events_15m: int
    events_60m: int
    top_pages: list[dict[str, Any]]
    recent_events: list[dict[str, Any]]


class OpportunityItem(BaseModel):
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


class OpportunitiesResponse(BaseModel):
    opportunities: list[OpportunityItem]


class OpportunitiesRefreshResponse(BaseModel):
    refreshed: bool
    count: int
    opportunities: list[OpportunityItem]


class OpportunityWorkflowRequest(BaseModel):
    workflow_status: str = Field(min_length=2, max_length=40)
    admin_notes: str = Field(default="", max_length=4000)
    checklist: list[dict[str, Any]] = Field(default_factory=list)
    next_review_at: str | None = Field(default=None, max_length=80)


class OpportunityWorkflowResponse(BaseModel):
    stored: bool
    opportunity: OpportunityItem | None


class OfficialDraftItem(BaseModel):
    id: str
    opportunity_id: str | None
    purpose: str
    recipient: str
    subject: str
    body: str
    attachments: list[dict[str, Any]]
    review_status: str
    metadata: dict[str, Any]
    created_at: str
    updated_at: str


class OfficialDraftsResponse(BaseModel):
    drafts: list[OfficialDraftItem]


class OfficialDraftRequest(BaseModel):
    id: str | None = Field(default=None, max_length=80)
    opportunity_id: str | None = Field(default=None, max_length=80)
    purpose: str = Field(min_length=2, max_length=80)
    recipient: str = Field(default="", max_length=240)
    subject: str = Field(min_length=2, max_length=300)
    body: str = Field(min_length=2, max_length=12000)
    attachments: list[dict[str, Any]] = Field(default_factory=list)
    review_status: str = Field(default="draft", max_length=40)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("review_status")
    @classmethod
    def validate_review_status(cls, value: str) -> str:
        normalized = value.strip() or "draft"
        allowed = {
            "draft",
            "ready_for_review",
            "ready_for_isds",
            "sent_manually",
            "archived",
        }

        if normalized not in allowed:
            raise ValueError("Unsupported official draft review status.")

        return normalized


class OfficialDraftResponse(BaseModel):
    stored: bool
    draft: OfficialDraftItem | None
    drafts: list[OfficialDraftItem]


class ContentRollbackRequest(BaseModel):
    version_id: str = Field(min_length=8, max_length=80)


class PublishedContentResponse(BaseModel):
    content: dict[str, str]


class AdminExportResponse(BaseModel):
    generated_at: str
    service: str
    public_site_url: str
    export: dict[str, Any]


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


@app.get("/admin/export", response_model=AdminExportResponse)
def admin_export(
    x_fk_backend_token: str | None = Header(default=None),
) -> AdminExportResponse:
    require_backend_token(x_fk_backend_token)
    settings = get_settings()

    return AdminExportResponse(
        generated_at=datetime.now(UTC).isoformat(),
        service=settings.app_name,
        public_site_url=settings.public_site_url,
        export=export_admin_data(),
    )


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


@app.post("/admin/telemetry", response_model=TelemetryEventResponse)
def save_telemetry_event(
    payload: TelemetryEventRequest,
    x_fk_backend_token: str | None = Header(default=None),
) -> TelemetryEventResponse:
    require_backend_token(x_fk_backend_token)
    event_id = record_telemetry_event(
        session_id=payload.session_id,
        event_type=payload.event_type,
        path=payload.path,
        referrer=payload.referrer,
        viewport=payload.viewport,
        metadata=payload.metadata,
    )

    return TelemetryEventResponse(stored=event_id is not None, event_id=event_id)


@app.get("/admin/telemetry/summary", response_model=TelemetrySummaryResponse)
def admin_telemetry_summary(
    x_fk_backend_token: str | None = Header(default=None),
) -> TelemetrySummaryResponse:
    require_backend_token(x_fk_backend_token)
    summary = telemetry_summary()

    return TelemetrySummaryResponse(**summary.__dict__)


@app.get("/admin/opportunities", response_model=OpportunitiesResponse)
def admin_opportunities(
    limit: int = Query(default=12, ge=1, le=50),
    x_fk_backend_token: str | None = Header(default=None),
) -> OpportunitiesResponse:
    require_backend_token(x_fk_backend_token)
    opportunities = [
        OpportunityItem(**opportunity.__dict__)
        for opportunity in list_opportunities(limit=limit)
    ]

    return OpportunitiesResponse(opportunities=opportunities)


@app.post("/admin/opportunities/refresh", response_model=OpportunitiesRefreshResponse)
def admin_opportunities_refresh(
    x_fk_backend_token: str | None = Header(default=None),
) -> OpportunitiesRefreshResponse:
    require_backend_token(x_fk_backend_token)
    opportunities = [
        OpportunityItem(**opportunity.__dict__)
        for opportunity in refresh_opportunities()
    ]

    return OpportunitiesRefreshResponse(
        refreshed=True,
        count=len(opportunities),
        opportunities=opportunities,
    )


@app.post("/admin/opportunities/{opportunity_id}/workflow", response_model=OpportunityWorkflowResponse)
def admin_opportunity_workflow(
    opportunity_id: str,
    payload: OpportunityWorkflowRequest,
    request: Request,
    x_fk_backend_token: str | None = Header(default=None),
) -> OpportunityWorkflowResponse:
    require_backend_token(x_fk_backend_token)
    opportunity = update_opportunity_workflow(
        opportunity_id=opportunity_id,
        workflow_status=payload.workflow_status,
        admin_notes=payload.admin_notes,
        checklist=payload.checklist,
        next_review_at=payload.next_review_at,
    )

    if opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    record_audit_event(
        "opportunity.workflow_saved",
        actor="admin",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        metadata={
            "opportunity_id": opportunity_id,
            "source_id": opportunity.source_id,
            "workflow_status": opportunity.workflow_status,
        },
    )

    return OpportunityWorkflowResponse(
        stored=True,
        opportunity=OpportunityItem(**opportunity.__dict__),
    )


@app.get("/admin/official-drafts", response_model=OfficialDraftsResponse)
def admin_official_drafts(
    limit: int = Query(default=20, ge=1, le=50),
    x_fk_backend_token: str | None = Header(default=None),
) -> OfficialDraftsResponse:
    require_backend_token(x_fk_backend_token)
    drafts = [
        OfficialDraftItem(**draft.__dict__)
        for draft in list_official_drafts(limit=limit)
    ]

    return OfficialDraftsResponse(drafts=drafts)


@app.post("/admin/official-drafts", response_model=OfficialDraftResponse)
def admin_save_official_draft(
    payload: OfficialDraftRequest,
    request: Request,
    x_fk_backend_token: str | None = Header(default=None),
) -> OfficialDraftResponse:
    require_backend_token(x_fk_backend_token)
    draft = save_official_draft(
        draft_id=payload.id,
        opportunity_id=payload.opportunity_id,
        purpose=payload.purpose,
        recipient=payload.recipient,
        subject=payload.subject,
        body=payload.body,
        attachments=payload.attachments,
        review_status=payload.review_status,
        metadata=payload.metadata,
    )

    if draft is None:
        raise HTTPException(status_code=400, detail="Official draft is invalid.")

    event_type = (
        "official_draft.ready_for_isds"
        if draft.review_status == "ready_for_isds"
        else "official_draft.saved"
    )
    record_audit_event(
        event_type,
        actor="admin",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        metadata={
            "draft_id": draft.id,
            "opportunity_id": draft.opportunity_id,
            "purpose": draft.purpose,
            "review_status": draft.review_status,
        },
    )

    return OfficialDraftResponse(
        stored=True,
        draft=OfficialDraftItem(**draft.__dict__),
        drafts=[
            OfficialDraftItem(**item.__dict__)
            for item in list_official_drafts(limit=20)
        ],
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
            label="Google Drive storage",
            configured=bool(
                settings.fk_google_drive_folder_id
                and (
                    settings.fk_google_drive_refresh_token
                    or settings.fk_google_service_account_json_base64
                )
            ),
        ),
        IntegrationStatus(
            id="isds",
            label="Datová schránka",
            configured=bool(
                settings.fk_isds_box_id
                and settings.fk_isds_auth_method == "bank_identity"
            ),
        ),
        IntegrationStatus(
            id="ai",
            label="AI providers",
            configured=bool(settings.openai_api_key or settings.gemini_api_key),
        ),
    ]
