from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "fkdev-admin-api"
    public_site_url: str = "https://fkdev.xyz"
    database_url: str | None = None
    vercel_token: str | None = None
    github_token: str | None = None
    render_api_key: str | None = None
    railway_api_token: str | None = None
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    fk_storage_connection: str | None = None
    fk_backend_admin_token: str | None = None
    fk_isds_box_id: str | None = None
    fk_isds_auth_method: str | None = None
    fk_google_drive_folder_id: str | None = None
    fk_google_drive_client_id: str | None = None
    fk_google_drive_client_secret: str | None = None
    fk_google_drive_refresh_token: str | None = None
    fk_google_service_account_json_base64: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
