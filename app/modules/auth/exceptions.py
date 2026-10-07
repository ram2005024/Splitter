from app.core.exceptions import (
    AuthenticationException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    RateLimitException,
)


class UserAlreadyExistsException(ConflictException):
    def __init__(self, email: str):
        super().__init__(
            message=f"User with email '{email}' already exists.",
            details={"email": email},
        )


class InvalidCredentialsException(AuthenticationException):
    def __init__(self, message: str = "Invalid email or password."):
        super().__init__(message=message)


class AccountNotVerifiedException(ForbiddenException):
    def __init__(self, message: str = "Please verify your email before logging in. Check your inbox for your verification code."):
        super().__init__(message=message)


class AccountDisabledException(ForbiddenException):
    def __init__(self, message: str = "Your account is disabled. Contact support."):
        super().__init__(message=message)


class AccountLockedException(RateLimitException):
    def __init__(self, lockout_seconds: int):
        super().__init__(
            message=f"Invalid email or password. Account locked for {lockout_seconds // 60} minutes."
        )


class InvalidVerificationCodeException(BadRequestException):
    def __init__(self, message: str = "Invalid or expired verification code."):
        super().__init__(message=message)


class InvalidResetCodeException(BadRequestException):
    def __init__(self, message: str = "Invalid or expired password reset code."):
        super().__init__(message=message)
