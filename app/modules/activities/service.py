from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ForbiddenException
from app.modules.activities.repo import ActivityRepository
from app.modules.activities.schemas import ActivityLogResponse
from app.modules.groups.repo import GroupMemberRepository


class ActivityService:
    def __init__(
        self,
        session: AsyncSession,
        activity_repo: ActivityRepository,
        member_repo: GroupMemberRepository,
    ):
        self.session = session
        self.activity_repo = activity_repo
        self.member_repo = member_repo

    async def get_group_activities(
        self,
        group_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ActivityLogResponse]:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise ForbiddenException("You are not a member of this expense group.")

        logs = await self.activity_repo.get_by_group(group_id, skip=skip, limit=limit)
        response_list: List[ActivityLogResponse] = []
        for log in logs:
            response_list.append(
                ActivityLogResponse(
                    id=log.id,
                    group_id=log.group_id,
                    user_id=log.user_id,
                    user_name=log.user.full_name if log.user else "System",
                    action=log.action,
                    details=log.details,
                    created_at=log.created_at,
                )
            )
        return response_list
