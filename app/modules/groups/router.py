from typing import List
from fastapi import APIRouter, Depends, status
from app.api.dependencies import get_current_user, get_services
from app.core.responses import APIResponse, success_response
from app.factories.service_factory import ServiceFactory
from app.modules.groups.schemas import (
    AddMemberRequest,
    AddMemberResponse,
    GroupCreate,
    GroupDetailResponse,
    GroupMemberResponse,
    GroupResponse,
    JoinGroupByCodeRequest,
    JoinGroupResponse,
)
from app.modules.users.models import User

router = APIRouter(prefix="/groups", tags=["Expense Groups & Members"])


@router.post(
    "/",
    response_model=APIResponse[GroupDetailResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense group",
)
async def create_group(
    req: GroupCreate,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Creates a new group. The authenticated creator is automatically set as ADMIN and an 8-character invite code is generated."""
    group = await services.group_service.create_group(creator_id=current_user.id, req=req)
    members_resp = [
        GroupMemberResponse(
            id=m.id,
            user_id=m.user_id,
            role=m.role,
            first_name=m.user.first_name if m.user else None,
            last_name=m.user.last_name if m.user else None,
            email=m.user.email if m.user else None,
            avatar_url=m.user.profile.avatar_url if m.user and m.user.profile else None,
            joined_at=m.created_at,
        )
        for m in group.members
    ]
    data = GroupDetailResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        invite_code=group.invite_code,
        currency=group.currency,
        group_type=group.group_type,
        creator_id=group.creator_id,
        members_count=len(members_resp),
        created_at=group.created_at,
        members=members_resp,
    ).model_dump(mode="json")

    return success_response(
        data=data,
        message="Group created successfully! Share the invite code with members to join.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/",
    response_model=APIResponse[List[GroupResponse]],
    summary="List all expense groups for the current user",
)
async def get_my_groups(
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Retrieves all active groups where the user is an active member."""
    groups = await services.group_service.get_user_groups(user_id=current_user.id)
    return success_response(
        data=[g.model_dump(mode="json") for g in groups],
        message="Groups retrieved successfully",
        meta={"total": len(groups)},
    )


@router.get(
    "/{group_id}",
    response_model=APIResponse[GroupDetailResponse],
    summary="Get group details with members",
)
async def get_group_details(
    group_id: str,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Retrieves full group metadata, creator info, and list of all enrolled members."""
    group = await services.group_service.get_group_details(group_id=group_id, user_id=current_user.id)
    members_resp = [
        GroupMemberResponse(
            id=m.id,
            user_id=m.user_id,
            role=m.role,
            first_name=m.user.first_name if m.user else None,
            last_name=m.user.last_name if m.user else None,
            email=m.user.email if m.user else None,
            avatar_url=m.user.profile.avatar_url if m.user and m.user.profile else None,
            joined_at=m.created_at,
        )
        for m in group.members
    ]
    data = GroupDetailResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        invite_code=group.invite_code,
        currency=group.currency,
        group_type=group.group_type,
        creator_id=group.creator_id,
        members_count=len(members_resp),
        created_at=group.created_at,
        members=members_resp,
    ).model_dump(mode="json")

    return success_response(
        data=data,
        message="Group details retrieved successfully",
    )


@router.post(
    "/join",
    response_model=APIResponse[JoinGroupResponse],
    summary="Join an expense group via unique invite code",
)
async def join_group_by_code(
    req: JoinGroupByCodeRequest,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Enrolls the user into an existing group using the group's 8-character invite code."""
    group = await services.group_service.join_group_by_code(
        user_id=current_user.id,
        invite_code=req.invite_code,
    )
    return success_response(
        data={"group_id": group.id, "group_name": group.name, "currency": group.currency},
        message=f"Successfully joined group '{group.name}'!",
    )


@router.post(
    "/{group_id}/members",
    response_model=APIResponse[AddMemberResponse],
    summary="Add a member to the group by email",
)
async def add_member(
    group_id: str,
    req: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Adds a registered user directly to the group by their email address."""
    membership = await services.group_service.add_member(
        actor_id=current_user.id,
        group_id=group_id,
        email=req.email,
        role=req.role,
    )
    return success_response(
        data={"group_id": group_id, "user_id": membership.user_id, "role": membership.role.value},
        message=f"Member '{req.email}' added to group successfully",
    )


@router.get(
    "/{group_id}/members",
    response_model=APIResponse[List[GroupMemberResponse]],
    summary="List members in a group",
)
async def get_group_members(
    group_id: str,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Retrieves all members and their roles within the group."""
    members = await services.group_service.get_group_members(group_id=group_id, user_id=current_user.id)
    return success_response(
        data=[m.model_dump(mode="json") for m in members],
        message="Group members retrieved successfully",
        meta={"total": len(members)},
    )
