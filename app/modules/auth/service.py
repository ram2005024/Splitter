from datetime import datetime, timezone
import logging
from typing import Optional
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.core.rate_limiter import RedisLimiter
from app.core.security import SecurityManager
from app.modules.auth.exceptions import (
    AccountDisabledException,
    AccountLockedException,
    AccountNotVerifiedException,
    InvalidCredentialsException,
    InvalidResetCodeException,
    InvalidVerificationCodeException,
    UserAlreadyExistsException,
)
from app.modules.auth.schemas import (
    ResetPasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.modules.users.models import User, UserProfile
from app.modules.users.repo import UserProfileRepository, UserRepository
from app.modules.users.schemas import UserResponse
from app.workers.tasks import send_password_reset_email, send_verification_email

logger = logging.getLogger(__name__)


def print_dev_otp(purpose: str, email: str, code: str) -> None:
    """Print high-visibility OTP banner to FastAPI console in development."""
    if settings.ENVIRONMENT == "development" or bool(settings.DEBUG):
        print(
            f"\n{'=' * 65}\n"
            f"  [API DEV OTP] {purpose.upper()}\n"
            f"  Recipient : {email}\n"
            f"  OTP Code  : >>> {code} <<<\n"
            f"  Expires In: 15 minutes\n"
            f"{'=' * 65}\n",
            flush=True,
        )


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
        user_repo: UserRepository,
        profile_repo: UserProfileRepository,
        redis: aioredis.Redis,
    ):
        self.session = session
        self.user_repo = user_repo
        self.profile_repo = profile_repo
        self.redis = redis

    async def register(self, req: UserRegisterRequest, client_ip: str) -> User:
        await RedisLimiter.check_registration_spam(self.redis, client_ip)

        existing = await self.user_repo.get_by_email(req.email)
        if existing:
            raise UserAlreadyExistsException(req.email)

        hashed_pwd = SecurityManager.hash_password(req.password1)
        user = User(
            email=req.email.lower().strip(),
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            hashed_password=hashed_pwd,
            is_verified=False,
            is_active=True,
        )
        self.session.add(user)
        await self.session.flush()

        profile = UserProfile(
            user_id=user.id,
            default_currency="NPR",
            notification_settings={"email_on_expense": True, "email_on_settlement": True},
        )
        self.session.add(profile)
        await self.session.commit()
        await self.session.refresh(user)

        otp = SecurityManager.generate_numeric_otp(6)
        await RedisLimiter.store_verification_code(
            self.redis,
            email=user.email,
            code=otp,
            expire_minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES,
        )

        try:
            send_verification_email.delay(
                email=user.email,
                code=otp,
                first_name=user.first_name,
            )
        except Exception as exc:
            logger.warning(f"Could not enqueue verification email task: {exc}. OTP is: {otp}")

        return user

    async def verify_email(self, email: str, code: str) -> User:
        stored_code = await RedisLimiter.get_verification_code(self.redis, email)
        if not stored_code or stored_code.strip() != code.strip():
            raise InvalidVerificationCodeException()

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundException("User not found.")

        user.is_verified = True
        await self.session.commit()
        await self.session.refresh(user)

        await RedisLimiter.delete_verification_code(self.redis, email)
        return user

    async def resend_verification(self, email: str, client_ip: str) -> None:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundException("User not found.")
        if user.is_verified:
            raise InvalidVerificationCodeException("Account is already verified.")

        otp = SecurityManager.generate_numeric_otp(6)
        await RedisLimiter.store_verification_code(
            self.redis,
            email=user.email,
            code=otp,
            expire_minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES,
        )

        try:
            send_verification_email.delay(
                email=user.email,
                code=otp,
                first_name=user.first_name,
            )
        except Exception as exc:
            logger.warning(f"Could not enqueue verification email: {exc}. OTP: {otp}")

    async def login(self, req: UserLoginRequest, client_ip: str) -> TokenResponse:
        email = req.email.lower().strip()

        await RedisLimiter.check_login_lockout(self.redis, email)

        user = await self.user_repo.get_by_email(email)
        if not user or not SecurityManager.verify_password(req.password, user.hashed_password):
            attempts = await RedisLimiter.record_failed_login(self.redis, email)
            remaining = settings.RATE_LIMIT_LOGIN_MAX_FAILED_ATTEMPTS - attempts
            if remaining > 0:
                raise InvalidCredentialsException(
                    message=f"Invalid email or password. {remaining} attempt(s) remaining before lockout."
                )
            else:
                raise AccountLockedException(settings.RATE_LIMIT_LOGIN_LOCKOUT_SECONDS)

        if not user.is_verified:
            raise AccountNotVerifiedException()

        if not user.is_active:
            raise AccountDisabledException()

        await RedisLimiter.clear_login_attempts(self.redis, email)

        access_token = SecurityManager.create_access_token(subject=user.id)
        refresh_token = SecurityManager.create_refresh_token(subject=user.id)

        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=None,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )
        return token_response, refresh_token

    async def refresh_access_token(self, refresh_token: str) -> tuple[TokenResponse, str]:
        try:
            payload = SecurityManager.decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise InvalidCredentialsException("Invalid token type. Refresh token required.")
            user_id = payload.get("sub")
            jti = payload.get("jti")
        except Exception:
            raise InvalidCredentialsException("Invalid or expired refresh token.")

        if jti and await RedisLimiter.is_token_revoked(self.redis, jti):
            raise InvalidCredentialsException("Refresh token has been revoked. Please log in again.")

        user = await self.user_repo.get_with_profile(user_id)
        if not user or not user.is_active:
            raise InvalidCredentialsException("User account is inactive or not found.")

        # Revoke old refresh token (token rotation security)
        if jti:
            exp = payload.get("exp")
            now_ts = int(datetime.now(timezone.utc).timestamp())
            ttl = max(int(exp - now_ts) if exp else settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400, 1)
            await RedisLimiter.revoke_token(self.redis, jti, ttl)

        new_access_token = SecurityManager.create_access_token(subject=user.id)
        new_refresh_token = SecurityManager.create_refresh_token(subject=user.id)

        token_response = TokenResponse(
            access_token=new_access_token,
            refresh_token=None,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )
        return token_response, new_refresh_token

    async def logout(self, refresh_token: Optional[str] = None) -> None:
        if not refresh_token:
            return
        try:
            payload = SecurityManager.decode_token(refresh_token)
            jti = payload.get("jti")
            if jti:
                exp = payload.get("exp")
                now_ts = int(datetime.now(timezone.utc).timestamp())
                ttl = max(int(exp - now_ts) if exp else settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400, 1)
                await RedisLimiter.revoke_token(self.redis, jti, ttl)
        except Exception:
            pass

    async def request_password_reset(self, email: str) -> None:
        user = await self.user_repo.get_by_email(email)
        if not user:
            return

        code = SecurityManager.generate_numeric_otp(6)
        await RedisLimiter.store_password_reset_code(
            self.redis,
            email=user.email,
            code=code,
            expire_minutes=settings.PASSWORD_RESET_CODE_EXPIRE_MINUTES,
        )

        try:
            send_password_reset_email.delay(
                email=user.email,
                code=code,
                first_name=user.first_name,
            )
        except Exception as exc:
            logger.warning(f"Could not enqueue password reset task: {exc}. OTP: {code}")

    async def reset_password(self, req: ResetPasswordRequest) -> None:
        email = req.email.lower().strip()
        stored_code = await RedisLimiter.get_password_reset_code(self.redis, email)
        if not stored_code or stored_code.strip() != req.code.strip():
            raise InvalidResetCodeException()

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundException("User not found.")

        user.hashed_password = SecurityManager.hash_password(req.new_password)
        await self.session.commit()
        await RedisLimiter.delete_password_reset_code(self.redis, email)
