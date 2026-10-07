from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user, get_services
from app.core.responses import APIResponse, success_response
from app.factories.service_factory import ServiceFactory
from app.modules.users.models import User
from app.modules.users.schemas import UserProfileResponse, UserProfileUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users & Profiles"])


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get current logged-in user profile",
)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retrieves full account details and profile of the authenticated user."""
    user_data = UserResponse.model_validate(current_user).model_dump(mode="json")
    return success_response(
        data=user_data,
        message="User profile retrieved successfully",
    )


@router.patch(
    "/me/profile",
    response_model=APIResponse[UserProfileResponse],
    summary="Update user profile",
)
async def update_my_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Updates extra profile information (phone, avatar, currency preference, bio, payment handles)."""
    updated_profile = await services.user_service.update_profile(current_user.id, profile_in)
    profile_data = UserProfileResponse.model_validate(updated_profile).model_dump(mode="json")
    return success_response(
        data=profile_data,
        message="Profile updated successfully",
    )
