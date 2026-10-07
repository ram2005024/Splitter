from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.common.base_repo import BaseRepository
from app.modules.settlements.models import Settlement


class SettlementRepository(BaseRepository[Settlement]):
    def __init__(self, session: AsyncSession):
        super().__init__(Settlement, session)

    async def get_by_group(self, group_id: str, skip: int = 0, limit: int = 50) -> Sequence[Settlement]:
        stmt = (
            select(Settlement)
            .options(
                selectinload(Settlement.payer),
                selectinload(Settlement.receiver),
            )
            .where(Settlement.group_id == group_id)
            .order_by(Settlement.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_all_group_settlements(self, group_id: str) -> Sequence[Settlement]:
        stmt = (
            select(Settlement)
            .options(
                selectinload(Settlement.payer),
                selectinload(Settlement.receiver),
            )
            .where(Settlement.group_id == group_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
