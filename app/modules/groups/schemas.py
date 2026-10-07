from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.modules.groups.models import GroupType, MemberRole


class GroupMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Membership record ID")
    user_id: str = Field(description="User ID of the member")
    role: MemberRole = Field(description="Role in group (ADMIN or MEMBER)")
    first_name: Optional[str] = Field(None, description="User's first name")
    last_name: Optional[str] = Field(None, description="User's last name")
    email: Optional[EmailStr] = Field(None, description="User's registered email")
    avatar_url: Optional[str] = Field(None, description="URL of user avatar")
    joined_at: datetime = Field(description="Timestamp when user joined group")


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Name of the expense group", examples=["Summer Trip to Hawaii"])
    description: Optional[str] = Field(None, description="Optional description of the group", examples=["Shared trip expenses for flights, stay, and meals."])
    currency: str = Field(default="NPR", max_length=10, description="ISO base currency code", examples=["NPR"])
    group_type: GroupType = Field(default=GroupType.OTHER, description="Type/Category of the group", examples=[GroupType.TRIP])


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150, description="Updated group name")
    description: Optional[str] = Field(None, description="Updated group description")
    currency: Optional[str] = Field(None, max_length=10, description="Updated currency code")
    group_type: Optional[GroupType] = Field(None, description="Updated group type")


class GroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Group unique identifier")
    name: str = Field(description="Group name")
    description: Optional[str] = Field(None, description="Group description")
    invite_code: str = Field(description="Unique 8-character invite code")
    currency: str = Field(description="Base currency code")
    group_type: GroupType = Field(description="Group type")
    creator_id: Optional[str] = Field(None, description="User ID of creator")
    members_count: int = Field(default=0, description="Total number of members")
    created_at: datetime = Field(description="Creation timestamp")


class GroupDetailResponse(GroupResponse):
    members: List[GroupMemberResponse] = Field(default=[], description="List of group members and their roles")


class JoinGroupByCodeRequest(BaseModel):
    invite_code: str = Field(..., min_length=4, max_length=20, description="8-character unique group invite code", examples=["H7K2M9XP"])


class JoinGroupResponse(BaseModel):
    group_id: str = Field(description="ID of the joined group")
    group_name: str = Field(description="Name of the joined group")
    currency: str = Field(description="Base currency of the group")


class AddMemberRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address of user to add", examples=["friend@example.com"])
    role: MemberRole = Field(default=MemberRole.MEMBER, description="Assigned role in group (ADMIN or MEMBER)")


class AddMemberResponse(BaseModel):
    group_id: str = Field(description="Group ID")
    user_id: str = Field(description="Added member's user ID")
    role: str = Field(description="Role assigned to member")
