from typing import Optional
from fastapi import APIRouter, Depends, Request, status
from app.api.dependencies import get_client_ip, get_current_user, get_services
from app.core.responses import APIResponse, success_response
from app.core.security import clear_refresh_cookie, set_refresh_cookie
from app.factories.service_factory import ServiceFactory
from app.modules.auth.exceptions import InvalidCredentialsException
from app.modules.auth.schemas import (
    ForgotPasswordRequest,
    LogoutRequest,
    RefreshTokenRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserVerifyRequest,
)
from app.modules.users.models import User
from app.modules.users.schemas import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    req: UserRegisterRequest,
    client_ip: str = Depends(get_client_ip),
    services: ServiceFactory = Depends(get_services),
):
    """Registers a new user, provisions an automatic UserProfile, and sends an email verification OTP."""
    user = await services.auth_service.register(req, client_ip=client_ip)
    user_data = UserResponse.model_validate(user).model_dump(mode="json")
    return success_response(
        data=user_data,
        message="Registration successful! Please check your email for the verification code.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/verify",
    response_model=APIResponse[UserResponse],
    summary="Verify email account with OTP code",
)
async def verify_account(
    req: UserVerifyRequest,
    services: ServiceFactory = Depends(get_services),
):
    """Validates the 6-digit email OTP and activates the user account for login."""
    user = await services.auth_service.verify_email(email=req.email, code=req.code)
    user_data = UserResponse.model_validate(user).model_dump(mode="json")
    return success_response(
        data=user_data,
        message="Account verified successfully! You can now log in.",
    )


@router.post(
    "/resend-verification",
    response_model=APIResponse[None],
    summary="Resend account verification OTP",
)
async def resend_verification(
    req: ResendVerificationRequest,
    client_ip: str = Depends(get_client_ip),
    services: ServiceFactory = Depends(get_services),
):
    """Generates a new verification OTP and re-dispatches the verification email."""
    await services.auth_service.resend_verification(email=req.email, client_ip=client_ip)
    return success_response(
        message="Verification code resent successfully. Please check your inbox.",
    )


@router.post(
    "/login",
    response_model=APIResponse[TokenResponse],
    summary="Login with email and password",
)
async def login(
    req: UserLoginRequest,
    client_ip: str = Depends(get_client_ip),
    services: ServiceFactory = Depends(get_services),
):
    """Authenticates user credentials, sets HttpOnly refresh cookie, and returns access token + user details."""
    token_response, refresh_token = await services.auth_service.login(req, client_ip=client_ip)
    res = success_response(
        data=token_response.model_dump(mode="json"),
        message="Login successful",
    )
    set_refresh_cookie(res, refresh_token)
    return res


@router.post(
    "/refresh",
    response_model=APIResponse[TokenResponse],
    summary="Refresh JWT access token",
)
async def refresh_token(
    request: Request,
    req: Optional[RefreshTokenRequest] = None,
    services: ServiceFactory = Depends(get_services),
):
    """Extracts refresh token from HttpOnly cookie or body, rotates it, sets new cookie, and returns new access token."""
    cookie_token = request.cookies.get("refresh_token")
    body_token = req.refresh_token if req else None
    token = cookie_token or body_token
    if not token:
        raise InvalidCredentialsException("Refresh token missing. Please log in.")

    token_response, new_refresh_token = await services.auth_service.refresh_access_token(token)
    res = success_response(
        data=token_response.model_dump(mode="json"),
        message="Token refreshed successfully",
    )
    set_refresh_cookie(res, new_refresh_token)
    return res


@router.post(
    "/logout",
    response_model=APIResponse[None],
    summary="Logout user session and revoke refresh token",
)
async def logout(
    request: Request,
    req: Optional[LogoutRequest] = None,
    services: ServiceFactory = Depends(get_services),
):
    """Invalidates the refresh token in Redis and removes the HttpOnly session cookie."""
    cookie_token = request.cookies.get("refresh_token")
    body_token = req.refresh_token if req else None
    token = cookie_token or body_token
    if token:
        await services.auth_service.logout(token)

    res = success_response(
        message="Logged out successfully",
    )
    clear_refresh_cookie(res)
    return res


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get current logged-in user profile",
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Retrieves full account details and profile of the authenticated user."""
    user_data = UserResponse.model_validate(current_user).model_dump(mode="json")
    return success_response(
        data=user_data,
        message="Current user profile retrieved successfully",
    )


@router.post(
    "/forgot-password",
    response_model=APIResponse[None],
    summary="Request password reset code",
)
async def forgot_password(
    req: ForgotPasswordRequest,
    services: ServiceFactory = Depends(get_services),
):
    """Dispatches a password reset OTP code to the requested email address."""
    await services.auth_service.request_password_reset(req.email)
    return success_response(
        message="If an account exists with this email, a password reset code has been sent.",
    )


@router.post(
    "/reset-password",
    response_model=APIResponse[None],
    summary="Reset password using OTP code",
)
async def reset_password(
    req: ResetPasswordRequest,
    services: ServiceFactory = Depends(get_services),
):
    """Verifies reset OTP code and updates the account password."""
    await services.auth_service.reset_password(req)
    return success_response(
        message="Password has been reset successfully. You can now log in with your new password.",
    )

