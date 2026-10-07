import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.factories.repo_factory import RepoFactory
from app.factories.service_factory import ServiceFactory
from app.modules.auth.schemas import UserRegisterRequest
from app.modules.users.schemas import UserProfileUpdate
from tests.conftest import MockRedis


@pytest.mark.asyncio
async def test_repo_and_service_factory(db_session: AsyncSession, mock_redis: MockRedis):
    repo_factory = RepoFactory(db_session)
    assert repo_factory.user_repo is not None
    assert repo_factory.group_repo is not None
    assert repo_factory.expense_repo is not None
    assert repo_factory.settlement_repo is not None
    assert repo_factory.activity_repo is not None

    service_factory = ServiceFactory(session=db_session, redis_client=mock_redis)
    assert service_factory.auth_service is not None
    assert service_factory.user_service is not None
    assert service_factory.group_service is not None
    assert service_factory.expense_service is not None
    assert service_factory.settlement_service is not None
    assert service_factory.activity_service is not None


@pytest.mark.asyncio
async def test_user_profile_service(db_session: AsyncSession, mock_redis: MockRedis):
    service_factory = ServiceFactory(session=db_session, redis_client=mock_redis)

    # Register user via AuthService
    user = await service_factory.auth_service.register(
        UserRegisterRequest(
            email="service_test@example.com",
            first_name="Service",
            last_name="Tester",
            password1="Password123!",
            password2="Password123!",
        ),
        client_ip="127.0.0.1",
    )
    assert user.id is not None
    assert user.profile is not None

    # Update profile via UserService
    updated_profile = await service_factory.user_service.update_profile(
        user_id=user.id,
        profile_in=UserProfileUpdate(
            phone_number="+1234567890",
            bio="Software engineer splitting bills",
            default_currency="EUR",
            payment_handle="tester@upi",
        ),
    )
    assert updated_profile.phone_number == "+1234567890"
    assert updated_profile.bio == "Software engineer splitting bills"
    assert updated_profile.default_currency == "EUR"
    assert updated_profile.payment_handle == "tester@upi"
