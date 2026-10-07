from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.exceptions import RateLimitException


class RedisLimiter:
    """Manages Redis rate limiting, OTP storage, and lockout protection."""

    @staticmethod
    async def check_registration_spam(redis: aioredis.Redis, identifier: str) -> None:
        """Prevent spamming register requests using a fixed-window counter in Redis."""
        key = f"rate_limit:register:{identifier}"
        try:
            current_count = await redis.incr(key)
            if current_count == 1:
                await redis.expire(key, settings.RATE_LIMIT_REGISTER_WINDOW_SECONDS)
            
            if current_count > settings.RATE_LIMIT_REGISTER_PER_IP:
                ttl = await redis.ttl(key)
                raise RateLimitException(
                    message=f"Too many registration requests. Please wait {ttl} seconds before trying again."
                )
        except aioredis.RedisError:
            # If Redis is temporarily down in test environments without Redis running, allow or log
            pass

    @staticmethod
    async def check_login_lockout(redis: aioredis.Redis, email: str) -> None:
        """Check if user is temporarily locked out due to multiple failed attempts."""
        lock_key = f"lockout:login:{email.lower()}"
        try:
            is_locked = await redis.get(lock_key)
            if is_locked:
                ttl = await redis.ttl(lock_key)
                raise RateLimitException(
                    message=f"Account temporarily locked due to repeated failed login attempts. Try again in {ttl} seconds."
                )
        except aioredis.RedisError:
            pass

    @staticmethod
    async def record_failed_login(redis: aioredis.Redis, email: str) -> int:
        """Increment failed attempts and apply lockout if threshold reached."""
        key = f"attempts:login:{email.lower()}"
        lock_key = f"lockout:login:{email.lower()}"
        try:
            attempts = await redis.incr(key)
            if attempts == 1:
                await redis.expire(key, settings.RATE_LIMIT_LOGIN_LOCKOUT_SECONDS)
            
            if attempts >= settings.RATE_LIMIT_LOGIN_MAX_FAILED_ATTEMPTS:
                await redis.setex(lock_key, settings.RATE_LIMIT_LOGIN_LOCKOUT_SECONDS, "locked")
                await redis.delete(key)
            return attempts
        except aioredis.RedisError:
            return 0

    @staticmethod
    async def clear_login_attempts(redis: aioredis.Redis, email: str) -> None:
        """Clear failed attempts upon successful login."""
        key = f"attempts:login:{email.lower()}"
        lock_key = f"lockout:login:{email.lower()}"
        try:
            await redis.delete(key, lock_key)
        except aioredis.RedisError:
            pass

    # OTP and Token Management in Redis
    @staticmethod
    async def store_verification_code(
        redis: aioredis.Redis,
        email: str,
        code: str,
        expire_minutes: int = settings.VERIFICATION_CODE_EXPIRE_MINUTES,
    ) -> None:
        key = f"verify_code:{email.lower()}"
        await redis.setex(key, expire_minutes * 60, code)

    @staticmethod
    async def get_verification_code(redis: aioredis.Redis, email: str) -> Optional[str]:
        key = f"verify_code:{email.lower()}"
        val = await redis.get(key)
        return val.decode("utf-8") if isinstance(val, bytes) else val

    @staticmethod
    async def delete_verification_code(redis: aioredis.Redis, email: str) -> None:
        key = f"verify_code:{email.lower()}"
        await redis.delete(key)

    @staticmethod
    async def store_password_reset_code(
        redis: aioredis.Redis,
        email: str,
        code: str,
        expire_minutes: int = settings.PASSWORD_RESET_CODE_EXPIRE_MINUTES,
    ) -> None:
        key = f"pwd_reset_code:{email.lower()}"
        await redis.setex(key, expire_minutes * 60, code)

    @staticmethod
    async def get_password_reset_code(redis: aioredis.Redis, email: str) -> Optional[str]:
        key = f"pwd_reset_code:{email.lower()}"
        val = await redis.get(key)
        return val.decode("utf-8") if isinstance(val, bytes) else val

    @staticmethod
    async def delete_password_reset_code(redis: aioredis.Redis, email: str) -> None:
        key = f"pwd_reset_code:{email.lower()}"
        await redis.delete(key)

    @staticmethod
    async def revoke_token(redis: aioredis.Redis, jti: str, ttl_seconds: int = 86400 * 7) -> None:
        """Blacklist a refresh token by its JTI in Redis until expiration."""
        key = f"revoked_token:{jti}"
        try:
            await redis.setex(key, max(ttl_seconds, 1), "revoked")
        except aioredis.RedisError:
            pass

    @staticmethod
    async def is_token_revoked(redis: aioredis.Redis, jti: str) -> bool:
        """Check if a refresh token JTI has been revoked in Redis."""
        key = f"revoked_token:{jti}"
        try:
            return bool(await redis.exists(key))
        except aioredis.RedisError:
            return False

