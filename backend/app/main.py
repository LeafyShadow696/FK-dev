from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field

from .database import database_status, init_database, record_audit_event
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


app = FastAPI(
    title="fkdev.xyz Admin API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)


@app.on_event("startup")
def startup() -> None:
    database_status()


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
    settings = get_settings()

    if not settings.fk_backend_admin_token:
        raise HTTPException(
            status_code=503,
            detail="Backend admin token is not configured.",
        )

    if x_fk_backend_token != settings.fk_backend_admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized.")

    event_id = record_audit_event(
        payload.event_type,
        actor=payload.actor,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        metadata=payload.metadata,
    )

    return AuditEventResponse(stored=bool(event_id), event_id=event_id)


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
