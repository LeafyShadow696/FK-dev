from fastapi import FastAPI
from pydantic import BaseModel

from .settings import get_settings


class HealthResponse(BaseModel):
    status: str
    service: str
    public_site_url: str


class IntegrationStatus(BaseModel):
    id: str
    label: str
    configured: bool


app = FastAPI(
    title="fkdev.xyz Admin API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()

    return HealthResponse(
        status="ok",
        service=settings.app_name,
        public_site_url=settings.public_site_url,
    )


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
