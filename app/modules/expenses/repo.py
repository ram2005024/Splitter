from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.common.base_repo import BaseRepository
from app.modules.expenses.models import Expense, ExpenseSplit


class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self, session: AsyncSession):
        super().__init__(Expense, session)

    async def get_by_id_with_details(self, expense_id: str) -> Optional[Expense]:
        stmt = (
            select(Expense)
            .options(
                selectinload(Expense.payer),
                selectinload(Expense.splits).selectinload(ExpenseSplit.user),
            )
            .where(Expense.id == expense_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_group(self, group_id: str, skip: int = 0, limit: int = 50) -> Sequence[Expense]:
        stmt = (
            select(Expense)
            .options(
                selectinload(Expense.payer),
                selectinload(Expense.splits).selectinload(ExpenseSplit.user),
            )
            .where(Expense.group_id == group_id)
            .order_by(Expense.date.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_all_group_expenses(self, group_id: str) -> Sequence[Expense]:
        stmt = (
            select(Expense)
            .options(
                selectinload(Expense.payer),
                selectinload(Expense.splits).selectinload(ExpenseSplit.user),
            )
            .where(Expense.group_id == group_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()


class ExpenseSplitRepository(BaseRepository[ExpenseSplit]):
    def __init__(self, session: AsyncSession):
        super().__init__(ExpenseSplit, session)

    async def get_splits_by_expense(self, expense_id: str) -> Sequence[ExpenseSplit]:
        stmt = (
            select(ExpenseSplit)
            .options(selectinload(ExpenseSplit.user))
            .where(ExpenseSplit.expense_id == expense_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
