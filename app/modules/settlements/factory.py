from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.groups.repo import GroupMemberRepository, GroupRepository
from app.modules.settlements.repo import SettlementRepository
from app.modules.settlements.service import SettlementService


class SettlementModuleFactory:
    """Factory for instantiating settlement module repositories and services."""

    def __init__(self, session: AsyncSession, expense_repo=None, activity_repo=None):
        self.session = session
        self.expense_repo = expense_repo
        self.activity_repo = activity_repo
        self.group_repo = GroupRepository(session)
        self.member_repo = GroupMemberRepository(session)

    @property
    def settlement_repo(self) -> SettlementRepository:
        return SettlementRepository(self.session)

    @property
    def service(self) -> SettlementService:
        return SettlementService(
            session=self.session,
            settlement_repo=self.settlement_repo,
            expense_repo=self.expense_repo,
            group_repo=self.group_repo,
            member_repo=self.member_repo,
            activity_repo=self.activity_repo,
        )
