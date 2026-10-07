from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.common.base_repo import BaseRepository
from app.modules.groups.models import Group, GroupMember, MemberRole
from app.modules.users.models import User


class GroupRepository(BaseRepository[Group]):
    def __init__(self, session: AsyncSession):
        super().__init__(Group, session)

    async def get_by_invite_code(self, invite_code: str) -> Optional[Group]:
        stmt = (
            select(Group)
            .options(
                selectinload(Group.members).selectinload(GroupMember.user),
            )
            .where(Group.invite_code == invite_code.upper())
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_with_members(self, group_id: str) -> Optional[Group]:
        stmt = (
            select(Group)
            .options(
                selectinload(Group.members).selectinload(GroupMember.user),
            )
            .where(Group.id == group_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_user_groups(self, user_id: str) -> Sequence[Group]:
        stmt = (
            select(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .options(
                selectinload(Group.members).selectinload(GroupMember.user),
            )
            .where(GroupMember.user_id == user_id)
            .order_by(Group.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()


class GroupMemberRepository(BaseRepository[GroupMember]):
    def __init__(self, session: AsyncSession):
        super().__init__(GroupMember, session)

    async def get_membership(self, group_id: str, user_id: str) -> Optional[GroupMember]:
        stmt = (
            select(GroupMember)
            .options(selectinload(GroupMember.user))
            .where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_group_members(self, group_id: str) -> Sequence[GroupMember]:
        stmt = (
            select(GroupMember)
            .options(selectinload(GroupMember.user).selectinload(User.profile))
            .where(GroupMember.group_id == group_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def is_member(self, group_id: str, user_id: str) -> bool:
        stmt = select(GroupMember.id).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalars().first() is not None

    async def is_admin(self, group_id: str, user_id: str) -> bool:
        stmt = select(GroupMember.id).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.role == MemberRole.ADMIN,
        )
        result = await self.session.execute(stmt)
        return result.scalars().first() is not None
