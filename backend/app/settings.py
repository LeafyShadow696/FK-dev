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


@lru_cache
def get_settings() -> Settings:
    return Settings()
