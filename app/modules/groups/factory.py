from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.groups.repo import GroupMemberRepository, GroupRepository
from app.modules.groups.service import GroupService
from app.modules.users.repo import UserRepository


class GroupModuleFactory:
    """Factory for instantiating group module repositories and services."""

    def __init__(self, session: AsyncSession, activity_repo=None):
        self.session = session
        self.activity_repo = activity_repo
        self.user_repo = UserRepository(session)

    @property
    def group_repo(self) -> GroupRepository:
        return GroupRepository(self.session)

    @property
    def member_repo(self) -> GroupMemberRepository:
        return GroupMemberRepository(self.session)

    @property
    def service(self) -> GroupService:
        return GroupService(
            session=self.session,
            group_repo=self.group_repo,
            member_repo=self.member_repo,
            user_repo=self.user_repo,
            activity_repo=self.activity_repo,
        )
