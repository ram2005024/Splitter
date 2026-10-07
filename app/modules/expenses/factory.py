from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.expenses.repo import ExpenseRepository, ExpenseSplitRepository
from app.modules.expenses.service import ExpenseService
from app.modules.groups.repo import GroupMemberRepository, GroupRepository


class ExpenseModuleFactory:
    """Factory for instantiating expense module repositories and services."""

    def __init__(self, session: AsyncSession, settlement_repo=None, activity_repo=None):
        self.session = session
        self.settlement_repo = settlement_repo
        self.activity_repo = activity_repo
        self.group_repo = GroupRepository(session)
        self.member_repo = GroupMemberRepository(session)

    @property
    def expense_repo(self) -> ExpenseRepository:
        return ExpenseRepository(self.session)

    @property
    def split_repo(self) -> ExpenseSplitRepository:
        return ExpenseSplitRepository(self.session)

    @property
    def service(self) -> ExpenseService:
        return ExpenseService(
            session=self.session,
            expense_repo=self.expense_repo,
            split_repo=self.split_repo,
            group_repo=self.group_repo,
            member_repo=self.member_repo,
            settlement_repo=self.settlement_repo,
            activity_repo=self.activity_repo,
        )
