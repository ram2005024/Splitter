from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.activities.models import ActivityLog
from app.modules.common.base_repo import BaseRepository


class ActivityRepository(BaseRepository[ActivityLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(ActivityLog, session)

    async def get_by_group(self, group_id: str, skip: int = 0, limit: int = 50) -> Sequence[ActivityLog]:
        stmt = (
            select(ActivityLog)
            .options(selectinload(ActivityLog.user))
            .where(ActivityLog.group_id == group_id)
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def log_activity(
        self,
        group_id: str,
        user_id: Optional[str],
        action: str,
        details: Optional[dict] = None,
    ) -> ActivityLog:
        activity = ActivityLog(
            group_id=group_id,
            user_id=user_id,
            action=action,
            details=details or {},
        )
        self.session.add(activity)
        await self.session.flush()
        return activity
