from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.users.exceptions import UserNotFoundException
from app.modules.users.models import User, UserProfile
from app.modules.users.repo import UserProfileRepository, UserRepository
from app.modules.users.schemas import UserProfileUpdate


class UserService:
    def __init__(
        self,
        session: AsyncSession,
        user_repo: UserRepository,
        profile_repo: UserProfileRepository,
    ):
        self.session = session
        self.user_repo = user_repo
        self.profile_repo = profile_repo

    async def get_user_by_id(self, user_id: str) -> User:
        user = await self.user_repo.get_with_profile(user_id)
        if not user:
            raise UserNotFoundException(user_id)
        return user

    async def update_profile(self, user_id: str, profile_in: UserProfileUpdate) -> UserProfile:
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            profile = UserProfile(user_id=user_id)
            self.session.add(profile)
            await self.session.flush()

        update_data = profile_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(profile, key, value)

        await self.session.commit()
        await self.session.refresh(profile)
        return profile
