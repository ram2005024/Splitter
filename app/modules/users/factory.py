from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.users.repo import UserProfileRepository, UserRepository
from app.modules.users.service import UserService


class UserModuleFactory:
    """Factory for instantiating user module repositories and services."""

    def __init__(self, session: AsyncSession):
        self.session = session

    @property
    def user_repo(self) -> UserRepository:
        return UserRepository(self.session)

    @property
    def profile_repo(self) -> UserProfileRepository:
        return UserProfileRepository(self.session)

    @property
    def service(self) -> UserService:
        return UserService(
            session=self.session,
            user_repo=self.user_repo,
            profile_repo=self.profile_repo,
        )
