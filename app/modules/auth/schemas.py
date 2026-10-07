from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.modules.users.schemas import UserResponse


class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(description="User's registered email address", examples=["alice@example.com"])
    first_name: str = Field(..., min_length=1, max_length=100, description="First name", examples=["Alice"])
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name", examples=["Smith"])
    password1: str = Field(..., min_length=8, max_length=128, description="Primary password (min 8 chars)", examples=["StrongP@ssw0rd!"])
    password2: str = Field(..., min_length=8, max_length=128, description="Confirm password (must match password1)", examples=["StrongP@ssw0rd!"])

    @model_validator(mode="after")
    def verify_passwords_match(self) -> "UserRegisterRequest":
        if self.password1 != self.password2:
            raise ValueError("password1 and password2 do not match")
        return self


class UserVerifyRequest(BaseModel):
    email: EmailStr = Field(description="User's registered email address", examples=["alice@example.com"])
    code: str = Field(..., min_length=4, max_length=10, description="6-digit verification OTP code received via email", examples=["123456"])


class ResendVerificationRequest(BaseModel):
    email: EmailStr = Field(description="Email address to resend verification OTP to", examples=["alice@example.com"])


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(description="User's registered email address", examples=["alice@example.com"])
    password: str = Field(..., min_length=1, description="Account password", examples=["StrongP@ssw0rd!"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(description="Email address associated with the account", examples=["alice@example.com"])


class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(description="Email address associated with the account", examples=["alice@example.com"])
    code: str = Field(..., min_length=4, max_length=10, description="Password reset OTP code received via email", examples=["654321"])
    new_password: str = Field(..., min_length=8, max_length=128, description="New password (min 8 chars)", examples=["NewStrongP@ssw0rd!"])
    confirm_password: str = Field(..., min_length=8, max_length=128, description="Confirm new password", examples=["NewStrongP@ssw0rd!"])

    @model_validator(mode="after")
    def verify_passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("new_password and confirm_password do not match")
        return self


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(
        default=None,
        description="Optional JWT refresh token in request body (preferred from HttpOnly cookie)",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
    )


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = Field(
        default=None,
        description="Optional JWT refresh token in request body to invalidate (preferred from HttpOnly cookie)",
    )


class TokenResponse(BaseModel):
    access_token: str = Field(description="JWT Bearer access token")
    refresh_token: Optional[str] = Field(
        default=None,
        description="JWT refresh token (typically set securely in HttpOnly cookie)",
    )
    token_type: str = Field(default="Bearer", description="Token authentication scheme")
    expires_in: int = Field(description="Access token validity lifetime in seconds", examples=[3600])
    user: Optional[UserResponse] = Field(default=None, description="Authenticated user profile information")

