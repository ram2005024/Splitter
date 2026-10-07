import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import bcrypt
import jwt
from fastapi import Response
from app.core.config import settings


class SecurityManager:
    """Consolidated class for hashing, token operations, OTPs, and security codes."""

    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

    @staticmethod
    def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "access",
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def create_refresh_token(subject: str | Any, expires_delta: Optional[timedelta] = None, jti: Optional[str] = None) -> str:
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        token_jti = jti or str(uuid.uuid4())
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "refresh",
            "iat": datetime.now(timezone.utc),
            "jti": token_jti,
        }
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> dict[str, Any]:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    @staticmethod
    def generate_numeric_otp(length: int = 6) -> str:
        """Generate cryptographically secure numeric OTP."""
        digits = string.digits
        return "".join(secrets.choice(digits) for _ in range(length))

    @staticmethod
    def generate_group_invite_code(length: int = 8) -> str:
        """Generate unique human-readable group invite code (alphanumeric uppercase)."""
        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return "".join(secrets.choice(alphabet) for _ in range(length))


def set_refresh_cookie(response: Response, token: str) -> None:
    """Set refresh token into backend-managed HttpOnly cookie."""
    max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    is_prod = settings.ENVIRONMENT.lower() == "production"
    response.set_cookie(
        key="refresh_token",
        value=token,
        max_age=max_age,
        expires=max_age,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
    )


def clear_refresh_cookie(response: Response) -> None:
    """Clear the refresh token HttpOnly cookie on logout or session expiration."""
    is_prod = settings.ENVIRONMENT.lower() == "production"
    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        secure=is_prod,
        samesite="lax",
    )


# Convenient instance & function aliases for backward compatibility if needed
security_manager = SecurityManager()
hash_password = SecurityManager.hash_password
verify_password = SecurityManager.verify_password
create_access_token = SecurityManager.create_access_token
create_refresh_token = SecurityManager.create_refresh_token
decode_token = SecurityManager.decode_token
generate_numeric_otp = SecurityManager.generate_numeric_otp
generate_group_invite_code = SecurityManager.generate_group_invite_code
