import pytest
from httpx import AsyncClient
from tests.conftest import MockRedis


async def create_and_login_user(client: AsyncClient, mock_redis: MockRedis, email: str, name: str) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "first_name": name,
            "last_name": "Test",
            "password1": "Password123!",
            "password2": "Password123!",
        },
    )
    otp = await mock_redis.get(f"verify_code:{email}")
    await client.post("/api/v1/auth/verify", json={"email": email, "code": otp})

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    tokens = login_resp.json()["data"]
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_group_lifecycle_and_invite_code(client: AsyncClient, mock_redis: MockRedis):
    headers_owner = await create_and_login_user(client, mock_redis, "owner@example.com", "Owner")
    headers_friend = await create_and_login_user(client, mock_redis, "friend@example.com", "Friend")

    # 1. Create Group
    create_group_resp = await client.post(
        "/api/v1/groups/",
        headers=headers_owner,
        json={
            "name": "Trip to Paris",
            "description": "Vacation split with friends",
            "currency": "EUR",
            "group_type": "TRIP",
        },
    )
    assert create_group_resp.status_code == 201
    group_data = create_group_resp.json()["data"]
    assert group_data["name"] == "Trip to Paris"
    assert group_data["currency"] == "EUR"
    invite_code = group_data["invite_code"]
    assert len(invite_code) == 8
    # Creator must be admin in members
    assert len(group_data["members"]) == 1
    assert group_data["members"][0]["role"] == "ADMIN"

    group_id = group_data["id"]

    # 2. Friend tries to view group before joining -> 403 Forbidden
    unauth_resp = await client.get(f"/api/v1/groups/{group_id}", headers=headers_friend)
    assert unauth_resp.status_code == 403

    # 3. Friend joins group with invite code
    join_resp = await client.post(
        "/api/v1/groups/join",
        headers=headers_friend,
        json={"invite_code": invite_code},
    )
    assert join_resp.status_code == 200
    assert join_resp.json()["success"] is True

    # 4. Now friend can view group details with 2 members
    details_resp = await client.get(f"/api/v1/groups/{group_id}", headers=headers_friend)
    assert details_resp.status_code == 200
    members = details_resp.json()["data"]["members"]
    assert len(members) == 2
    roles = {m["email"]: m["role"] for m in members}
    assert roles["owner@example.com"] == "ADMIN"
    assert roles["friend@example.com"] == "MEMBER"


@pytest.mark.asyncio
async def test_add_member_by_email(client: AsyncClient, mock_redis: MockRedis):
    headers_admin = await create_and_login_user(client, mock_redis, "admin2@example.com", "Admin2")
    await create_and_login_user(client, mock_redis, "member2@example.com", "Member2")

    # Create group
    g_resp = await client.post(
        "/api/v1/groups/",
        headers=headers_admin,
        json={"name": "Roommates", "currency": "USD", "group_type": "HOME"},
    )
    group_id = g_resp.json()["data"]["id"]

    # Admin adds member by email
    add_resp = await client.post(
        f"/api/v1/groups/{group_id}/members",
        headers=headers_admin,
        json={"email": "member2@example.com", "role": "MEMBER"},
    )
    assert add_resp.status_code == 200
    assert add_resp.json()["success"] is True
