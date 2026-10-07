from typing import AsyncGenerator, Dict, Optional
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.dependencies import get_db, get_redis_client
from app.core.celery_app import celery_app
from app.core.database import Base
from app.main import app

# Import models so Base.metadata knows about all tables for SQLite test DB
from app.modules.users.models import User, UserProfile  # noqa: F401
from app.modules.groups.models import Group, GroupMember  # noqa: F401
from app.modules.expenses.models import Expense, ExpenseSplit  # noqa: F401
from app.modules.settlements.models import Settlement  # noqa: F401
from app.modules.activities.models import ActivityLog  # noqa: F401

# Execute Celery tasks in-memory during testing for instantaneous speed
celery_app.conf.update(
    task_always_eager=True,
    task_eager_propagates=True,
    broker_url="memory://",
    result_backend="rpc://",
)

# Test SQLite Async Database
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    future=True,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class MockRedis:
    """In-memory async Redis mock for reliable unit/integration testing."""

    def __init__(self):
        self.store: Dict[str, str] = {}
        self.ttls: Dict[str, int] = {}

    async def get(self, key: str) -> Optional[str]:
        return self.store.get(key)

    async def set(self, key: str, value: str) -> bool:
        self.store[key] = str(value)
        return True

    async def setex(self, key: str, time: int, value: str) -> bool:
        self.store[key] = str(value)
        self.ttls[key] = time
        return True

    async def incr(self, key: str) -> int:
        val = int(self.store.get(key, 0)) + 1
        self.store[key] = str(val)
        return val

    async def expire(self, key: str, time: int) -> bool:
        self.ttls[key] = time
        return True

    async def ttl(self, key: str) -> int:
        return self.ttls.get(key, 300)

    async def delete(self, *keys: str) -> int:
        count = 0
        for k in keys:
            if k in self.store:
                del self.store[k]
                self.ttls.pop(k, None)
                count += 1
        return count

    async def exists(self, *keys: str) -> int:
        return sum(1 for k in keys if k in self.store)

    async def close(self):
        pass


mock_redis_instance = MockRedis()


@pytest_asyncio.fixture(autouse=True)
async def init_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    async def override_get_redis():
        yield mock_redis_instance

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis_client] = override_get_redis

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def mock_redis() -> MockRedis:
    mock_redis_instance.store.clear()
    mock_redis_instance.ttls.clear()
    return mock_redis_instance
