from typing import AsyncGenerator
import redis.asyncio as aioredis
from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.core.exceptions import AuthenticationException
from app.core.redis import get_redis
from app.core.security import SecurityManager
from app.factories.service_factory import ServiceFactory
from app.modules.users.models import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


async def get_redis_client() -> AsyncGenerator[aioredis.Redis, None]:
    redis = await get_redis()
    try:
        yield redis
    finally:
        await redis.close()


def get_client_ip(request: Request, x_forwarded_for: str | None = Header(None)) -> str:
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def get_services(
    session: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis_client),
) -> ServiceFactory:
    return ServiceFactory(session=session, redis_client=redis)


async def get_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    services: ServiceFactory = Depends(get_services),
) -> User:
    if not auth or not auth.credentials:
        raise AuthenticationException("Authentication required. Missing Bearer token.")

    try:
        payload = SecurityManager.decode_token(auth.credentials)
        if payload.get("type") != "access":
            raise AuthenticationException("Invalid token type. Access token required.")
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationException("Invalid token subject.")
    except AuthenticationException:
        raise
    except Exception:
        raise AuthenticationException("Invalid, expired, or tampered token.")

    user = await services.repos.user_repo.get_with_profile(user_id)
    if not user:
        raise AuthenticationException("User account associated with this token does not exist.")
    if not user.is_active:
        raise AuthenticationException("User account is disabled.")

    return user
