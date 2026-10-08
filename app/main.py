from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.api.v1.api_router import api_v1_router
from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.redis import close_redis
from pydantic import BaseModel, Field
from app.core.responses import APIResponse, success_response

# Import all models so Base.metadata knows about all tables
from app.modules.users.models import User, UserProfile  # noqa: F401
from app.modules.groups.models import Group, GroupMember  # noqa: F401
from app.modules.expenses.models import Expense, ExpenseSplit  # noqa: F401
from app.modules.settlements.models import Settlement  # noqa: F401
from app.modules.activities.models import ActivityLog  # noqa: F401

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger("splitter")


class HealthCheckData(BaseModel):
    status: str = Field(description="Service status", examples=["healthy"])
    version: str = Field(description="Application version", examples=["1.0.0"])
    environment: str = Field(description="Running environment", examples=["development"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Splitter API application...")
    try:
        from app.modules.common.base_model import TimeStampedModel  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(TimeStampedModel.metadata.create_all)
        logger.info("Database schemas verified.")
    except Exception as exc:
        logger.warning(f"Database schema auto-creation notice: {exc}")
    yield
    logger.info("Shutting down Splitter API application...")
    try:
        await close_redis()
    except Exception as exc:
        logger.warning(f"Error closing Redis: {exc}")
    try:
        await engine.dispose()
    except Exception as exc:
        logger.warning(f"Error disposing engine: {exc}")
    logger.info("Connections closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.state.debug = settings.DEBUG

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


@app.get(
    "/health",
    response_model=APIResponse[HealthCheckData],
    tags=["Health"],
    summary="Health check endpoint",
)
async def health_check():
    """System health check and runtime environment inspection."""
    return success_response(
        data={"status": "healthy", "version": settings.VERSION, "environment": settings.ENVIRONMENT},
        message="Splitter API is operational",
    )


app.include_router(api_v1_router, prefix=settings.API_V1_STR)
