import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.auth.service import AuthService
from app.modules.users.factory import UserModuleFactory


class AuthModuleFactory:
    """Factory for instantiating auth module service."""

    def __init__(self, session: AsyncSession, redis: aioredis.Redis):
        self.session = session
        self.redis = redis
        self.user_factory = UserModuleFactory(session)

    @property
    def service(self) -> AuthService:
        return AuthService(
            session=self.session,
            user_repo=self.user_factory.user_repo,
            profile_repo=self.user_factory.profile_repo,
            redis=self.redis,
        )
