from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.common.base_repo import BaseRepository
from app.modules.users.models import User, UserProfile


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.profile))
            .where(User.email == email.lower())
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_with_profile(self, user_id: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def mark_verified(self, user_id: str) -> Optional[User]:
        user = await self.get_by_id(user_id)
        if user:
            user.is_verified = True
            await self.session.flush()
            await self.session.refresh(user)
        return user

    async def update_password(self, user_id: str, hashed_password: str) -> Optional[User]:
        user = await self.get_by_id(user_id)
        if user:
            user.hashed_password = hashed_password
            await self.session.flush()
            await self.session.refresh(user)
        return user


class UserProfileRepository(BaseRepository[UserProfile]):
    def __init__(self, session: AsyncSession):
        super().__init__(UserProfile, session)

    async def get_by_user_id(self, user_id: str) -> Optional[UserProfile]:
        stmt = select(UserProfile).where(UserProfile.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()
