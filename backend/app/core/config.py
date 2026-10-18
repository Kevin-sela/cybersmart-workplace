from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    database_url: str = "sqlite:///./cybersmart.db"
    jwt_secret: str = "development-only-secret-change-this-before-deployment-32chars"
    jwt_algorithm: Literal["HS256"] = "HS256"
    access_token_minutes: int = Field(default=15, ge=1, le=60)
    refresh_token_days: int = Field(default=7, ge=1, le=30)
    cors_origins: str = "http://localhost:3000"
    cookie_secure: bool = False
    auto_create_sqlite: bool = True
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/api/v1/auth/google/callback"
    frontend_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def production_secrets(self) -> "Settings":
        if self.environment == "production" and self.jwt_secret.startswith("development-only"):
            raise ValueError("Set a private JWT_SECRET before starting in production.")
        if self.environment == "production" and len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET must have at least 32 characters.")
        if self.environment == "production" and not self.cookie_secure:
            raise ValueError("Set COOKIE_SECURE=true when running behind HTTPS in production.")
        if self.environment == "production" and (not self.google_redirect_uri.startswith("https://") or not self.frontend_origin.startswith("https://")):
            raise ValueError("Google OAuth and frontend URLs must use HTTPS in production.")
        return self

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.google_client_id.strip() and self.google_client_secret.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
