from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Profile ID")
    user_id: str = Field(description="Associated User ID")
    avatar_url: str | None = Field(
        None,
        description="URL of user's avatar image",
        examples=["https://example.com/avatar.png"],
    )
    phone_number: str | None = Field(
        None, description="Phone number with country code", examples=["+1234567890"]
    )
    default_currency: str = Field(
        default="NPR", description="Preferred base currency", examples=["NPR"]
    )
    bio: str | None = Field(
        None,
        description="User biography",
        examples=["Splitting bills with friends & roommates."],
    )
    payment_handle: str | None = Field(
        None, description="Payment handle or UPI ID", examples=["alice@upi"]
    )
    notification_settings: dict[str, Any] | None = Field(
        None, description="User notification settings"
    )
    created_at: datetime = Field(description="Creation timestamp")
    updated_at: datetime = Field(description="Last update timestamp")


class UserProfileUpdate(BaseModel):
    avatar_url: str | None = Field(
        None,
        description="URL of user's avatar image",
        examples=["https://example.com/avatar.png"],
    )
    phone_number: str | None = Field(
        None, description="Phone number with country code", examples=["+1234567890"]
    )
    default_currency: str | None = Field(
        None, description="Preferred ISO 3-letter currency code", examples=["NPR"]
    )
    bio: str | None = Field(
        None, description="User biography", examples=["Trip planner and foodie."]
    )
    payment_handle: str | None = Field(
        None,
        description="Payment handle (UPI ID / PayPal username / Venmo)",
        examples=["alice@upi"],
    )
    notification_settings: dict[str, Any] | None = Field(
        None, description="User notification settings"
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="User unique identifier")
    email: EmailStr = Field(
        description="Registered email address", examples=["alice@example.com"]
    )
    first_name: str = Field(description="User's first name", examples=["Alice"])
    last_name: str = Field(description="User's last name", examples=["Smith"])
    full_name: str = Field(description="User's full name", examples=["Alice Smith"])
    is_verified: bool = Field(
        description="Whether the user account email has been verified"
    )
    is_active: bool = Field(description="Whether the user account is active")
    profile: UserProfileResponse | None = Field(
        None, description="User profile details"
    )
    created_at: datetime = Field(description="Registration timestamp")
