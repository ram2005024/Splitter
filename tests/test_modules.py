from decimal import Decimal
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import SecurityManager
from app.modules.activities.factory import ActivityModuleFactory
from app.modules.auth.factory import AuthModuleFactory
from app.modules.expenses.factory import ExpenseModuleFactory
from app.modules.groups.factory import GroupModuleFactory
from app.modules.settlements.factory import SettlementModuleFactory
from app.modules.users.factory import UserModuleFactory
from tests.conftest import MockRedis


def test_security_manager_class():
    """Verify that class-related security functions are encapsulated into SecurityManager."""
    # 1. Password hashing & verification
    plain = "SuperSecretPassword123!"
    hashed = SecurityManager.hash_password(plain)
    assert hashed != plain
    assert SecurityManager.verify_password(plain, hashed) is True
    assert SecurityManager.verify_password("WrongPassword!", hashed) is False

    # 2. Token creation and decoding
    token = SecurityManager.create_access_token(subject="user_12345")
    decoded = SecurityManager.decode_token(token)
    assert decoded["sub"] == "user_12345"
    assert decoded["type"] == "access"

    refresh = SecurityManager.create_refresh_token(subject="user_12345")
    decoded_refresh = SecurityManager.decode_token(refresh)
    assert decoded_refresh["sub"] == "user_12345"
    assert decoded_refresh["type"] == "refresh"

    # 3. Numeric OTP generation
    otp = SecurityManager.generate_numeric_otp(6)
    assert len(otp) == 6
    assert otp.isdigit()

    # 4. Group invite code generation
    invite_code = SecurityManager.generate_group_invite_code(8)
    assert len(invite_code) == 8
    assert invite_code.isupper()


@pytest.mark.asyncio
async def test_feature_module_factories(db_session: AsyncSession, mock_redis: MockRedis):
    """Verify each feature module has its own dedicated factory."""
    # Auth Module Factory
    auth_factory = AuthModuleFactory(db_session, mock_redis)
    assert auth_factory.service is not None

    # User Module Factory
    user_factory = UserModuleFactory(db_session)
    assert user_factory.user_repo is not None
    assert user_factory.profile_repo is not None
    assert user_factory.service is not None

    # Activity Module Factory
    activity_factory = ActivityModuleFactory(db_session)
    assert activity_factory.repo is not None
    assert activity_factory.service is not None

    # Group Module Factory
    group_factory = GroupModuleFactory(db_session, activity_repo=activity_factory.repo)
    assert group_factory.group_repo is not None
    assert group_factory.member_repo is not None
    assert group_factory.service is not None

    # Expense Module Factory
    expense_factory = ExpenseModuleFactory(db_session, activity_repo=activity_factory.repo)
    assert expense_factory.expense_repo is not None
    assert expense_factory.split_repo is not None
    assert expense_factory.service is not None

    # Settlement Module Factory
    settlement_factory = SettlementModuleFactory(db_session, activity_repo=activity_factory.repo)
    assert settlement_factory.settlement_repo is not None
    assert settlement_factory.service is not None
