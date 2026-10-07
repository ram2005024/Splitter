import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession
from app.factories.repo_factory import RepoFactory
from app.modules.activities.factory import ActivityModuleFactory
from app.modules.activities.service import ActivityService
from app.modules.auth.factory import AuthModuleFactory
from app.modules.auth.service import AuthService
from app.modules.expenses.factory import ExpenseModuleFactory
from app.modules.expenses.service import ExpenseService
from app.modules.groups.factory import GroupModuleFactory
from app.modules.groups.service import GroupService
from app.modules.settlements.factory import SettlementModuleFactory
from app.modules.settlements.service import SettlementService
from app.modules.users.factory import UserModuleFactory
from app.modules.users.service import UserService


class ServiceFactory:
    """Factory for assembling and instantiating application services and feature modules."""

    def __init__(self, session: AsyncSession, redis_client: aioredis.Redis):
        self.session = session
        self.redis = redis_client
        self.repos = RepoFactory(session)

        # Feature Module Factories
        self.auth_module = AuthModuleFactory(session, redis_client)
        self.user_module = UserModuleFactory(session)
        self.activity_module = ActivityModuleFactory(session)
        self.group_module = GroupModuleFactory(session, activity_repo=self.repos.activity_repo)
        self.expense_module = ExpenseModuleFactory(
            session,
            settlement_repo=self.repos.settlement_repo,
            activity_repo=self.repos.activity_repo,
        )
        self.settlement_module = SettlementModuleFactory(
            session,
            expense_repo=self.repos.expense_repo,
            activity_repo=self.repos.activity_repo,
        )

    @property
    def auth_service(self) -> AuthService:
        return self.auth_module.service

    @property
    def user_service(self) -> UserService:
        return self.user_module.service

    @property
    def group_service(self) -> GroupService:
        return self.group_module.service

    @property
    def expense_service(self) -> ExpenseService:
        return self.expense_module.service

    @property
    def settlement_service(self) -> SettlementService:
        return self.settlement_module.service

    @property
    def activity_service(self) -> ActivityService:
        return self.activity_module.service
