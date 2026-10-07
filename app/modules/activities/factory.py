from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.activities.repo import ActivityRepository
from app.modules.activities.service import ActivityService
from app.modules.groups.repo import GroupMemberRepository


class ActivityModuleFactory:
    """Factory for instantiating activity module repository and service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    @property
    def repo(self) -> ActivityRepository:
        return ActivityRepository(self.session)

    @property
    def service(self) -> ActivityService:
        return ActivityService(
            session=self.session,
            activity_repo=self.repo,
            member_repo=GroupMemberRepository(self.session),
        )
