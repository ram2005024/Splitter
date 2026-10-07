from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import SecurityManager
from app.modules.groups.exceptions import (
    AlreadyGroupMemberException,
    GroupNotFoundException,
    NotGroupMemberException,
)
from app.modules.groups.models import Group, GroupMember, MemberRole
from app.modules.groups.repo import GroupMemberRepository, GroupRepository
from app.modules.groups.schemas import GroupCreate, GroupMemberResponse, GroupResponse
from app.modules.users.exceptions import UserNotFoundException
from app.modules.users.repo import UserRepository
from app.workers.tasks import send_group_invitation_notification


class GroupService:
    def __init__(
        self,
        session: AsyncSession,
        group_repo: GroupRepository,
        member_repo: GroupMemberRepository,
        user_repo: UserRepository,
        activity_repo=None,
    ):
        self.session = session
        self.group_repo = group_repo
        self.member_repo = member_repo
        self.user_repo = user_repo
        self.activity_repo = activity_repo

    async def create_group(self, creator_id: str, req: GroupCreate) -> Group:
        while True:
            code = SecurityManager.generate_group_invite_code(8)
            existing = await self.group_repo.get_by_invite_code(code)
            if not existing:
                break

        group = Group(
            name=req.name.strip(),
            description=req.description.strip() if req.description else None,
            invite_code=code,
            currency=req.currency.upper().strip(),
            group_type=req.group_type,
            creator_id=creator_id,
        )
        self.session.add(group)
        await self.session.flush()

        admin_membership = GroupMember(
            group_id=group.id,
            user_id=creator_id,
            role=MemberRole.ADMIN,
        )
        self.session.add(admin_membership)
        await self.session.flush()

        if self.activity_repo:
            await self.activity_repo.log_activity(
                group_id=group.id,
                user_id=creator_id,
                action="GROUP_CREATED",
                details={"group_name": group.name, "invite_code": group.invite_code},
            )

        await self.session.commit()
        refreshed = await self.group_repo.get_with_members(group.id)
        return refreshed or group

    async def get_user_groups(self, user_id: str) -> List[GroupResponse]:
        groups = await self.group_repo.get_user_groups(user_id)
        response_list: List[GroupResponse] = []
        for g in groups:
            res = GroupResponse(
                id=g.id,
                name=g.name,
                description=g.description,
                invite_code=g.invite_code,
                currency=g.currency,
                group_type=g.group_type,
                creator_id=g.creator_id,
                members_count=len(g.members),
                created_at=g.created_at,
            )
            response_list.append(res)
        return response_list

    async def get_group_details(self, group_id: str, user_id: str) -> Group:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise NotGroupMemberException()

        group = await self.group_repo.get_with_members(group_id)
        if not group:
            raise GroupNotFoundException(group_id)
        return group

    async def join_group_by_code(self, user_id: str, invite_code: str) -> Group:
        group = await self.group_repo.get_by_invite_code(invite_code)
        if not group:
            raise GroupNotFoundException(invite_code)

        is_already_member = await self.member_repo.is_member(group.id, user_id)
        if is_already_member:
            raise AlreadyGroupMemberException("You are already a member of this group.")

        user = await self.user_repo.get_by_id(user_id)

        membership = GroupMember(
            group_id=group.id,
            user_id=user_id,
            role=MemberRole.MEMBER,
        )
        self.session.add(membership)
        await self.session.flush()

        if self.activity_repo:
            await self.activity_repo.log_activity(
                group_id=group.id,
                user_id=user_id,
                action="MEMBER_JOINED",
                details={
                    "member_name": user.full_name if user else "New member",
                    "join_method": "invite_code",
                },
            )

        await self.session.commit()
        refreshed = await self.group_repo.get_with_members(group.id)
        return refreshed or group

    async def add_member(
        self,
        actor_id: str,
        group_id: str,
        email: str,
        role: MemberRole = MemberRole.MEMBER,
    ) -> GroupMember:
        is_member = await self.member_repo.is_member(group_id, actor_id)
        if not is_member:
            raise NotGroupMemberException("You must be a member of this group to invite friends.")

        target_user = await self.user_repo.get_by_email(email)
        if not target_user:
            raise UserNotFoundException(email)

        already_member = await self.member_repo.is_member(group_id, target_user.id)
        if already_member:
            raise AlreadyGroupMemberException(f"User '{email}' is already in this group.")

        membership = GroupMember(
            group_id=group_id,
            user_id=target_user.id,
            role=role,
        )
        self.session.add(membership)
        await self.session.flush()

        if self.activity_repo:
            await self.activity_repo.log_activity(
                group_id=group_id,
                user_id=actor_id,
                action="MEMBER_ADDED",
                details={
                    "added_user_id": target_user.id,
                    "added_user_name": target_user.full_name,
                    "role": role.value,
                },
            )

        await self.session.commit()

        try:
            inviter = await self.user_repo.get_by_id(actor_id)
            inviter_name = inviter.full_name if (inviter and inviter.full_name) else "A group member"
            group = await self.group_repo.get_by_id(group_id)
            group_name = group.name if group else "Splitter Group"
            if target_user.email:
                send_group_invitation_notification.delay(
                    group_name=group_name,
                    inviter_name=inviter_name,
                    recipient_email=target_user.email,
                )
        except Exception:
            pass

        return membership

    async def get_group_members(self, group_id: str, user_id: str) -> List[GroupMemberResponse]:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise NotGroupMemberException()

        members = await self.member_repo.get_group_members(group_id)
        response: List[GroupMemberResponse] = []
        for m in members:
            response.append(
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
            )
        return response
