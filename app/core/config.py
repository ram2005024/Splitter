from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Project Info
    PROJECT_NAME: str = "Splitter - Expense Splitter API"
    PROJECT_DESCRIPTION: str = "A clean, production-ready backend for group expense splitting, settlements, and balances."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security & JWT
    SECRET_KEY: str = "super-secret-splitter-jwt-key-change-in-production-1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 15
    PASSWORD_RESET_CODE_EXPIRE_MINUTES: int = 15

    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://ec2-13-51-194-166.eu-north-1.compute.amazonaws.com",
        "https://ec2-13-51-194-166.eu-north-1.compute.amazonaws.com",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["*"]

    # Database (PostgreSQL with asyncpg)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "splitter_db"
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/splitter_db"
    )

    # Redis (Rate Limiting, Spam Protection, Caching)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Rate Limiting & Security Rules
    RATE_LIMIT_REGISTER_PER_IP: int = 5
    RATE_LIMIT_REGISTER_WINDOW_SECONDS: int = 900  # 15 minutes
    RATE_LIMIT_LOGIN_MAX_FAILED_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_LOCKOUT_SECONDS: int = 600   # 10 minutes lockout

    # Email / Notification Settings (Worker)
    SMTP_HOST: str = "mailpit"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    EMAILS_FROM_EMAIL: str = "noreply@splitter.local"
    EMAILS_FROM_NAME: str = "Splitter App"


settings = Settings()
