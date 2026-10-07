from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.activities.repo import ActivityRepository
from app.modules.expenses.repo import ExpenseRepository, ExpenseSplitRepository
from app.modules.groups.repo import GroupMemberRepository, GroupRepository
from app.modules.settlements.repo import SettlementRepository
from app.modules.users.repo import UserProfileRepository, UserRepository


class RepoFactory:
    """Factory for instantiating database repositories with an active AsyncSession."""

    def __init__(self, session: AsyncSession):
        self.session = session

    @property
    def user_repo(self) -> UserRepository:
        return UserRepository(self.session)

    @property
    def profile_repo(self) -> UserProfileRepository:
        return UserProfileRepository(self.session)

    @property
    def group_repo(self) -> GroupRepository:
        return GroupRepository(self.session)

    @property
    def member_repo(self) -> GroupMemberRepository:
        return GroupMemberRepository(self.session)

    @property
    def expense_repo(self) -> ExpenseRepository:
        return ExpenseRepository(self.session)

    @property
    def split_repo(self) -> ExpenseSplitRepository:
        return ExpenseSplitRepository(self.session)

    @property
    def settlement_repo(self) -> SettlementRepository:
        return SettlementRepository(self.session)

    @property
    def activity_repo(self) -> ActivityRepository:
        return ActivityRepository(self.session)
