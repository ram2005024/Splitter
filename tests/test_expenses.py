from decimal import Decimal
import pytest
from httpx import AsyncClient
from tests.conftest import MockRedis
from tests.test_groups import create_and_login_user


@pytest.mark.asyncio
async def test_equal_split_with_penny_precision(client: AsyncClient, mock_redis: MockRedis):
    # Setup 3 users
    h_user1 = await create_and_login_user(client, mock_redis, "exp1@example.com", "User1")
    h_user2 = await create_and_login_user(client, mock_redis, "exp2@example.com", "User2")
    h_user3 = await create_and_login_user(client, mock_redis, "exp3@example.com", "User3")

    # User 1 creates group
    group_resp = await client.post(
        "/api/v1/groups/",
        headers=h_user1,
        json={"name": "Dinner Split", "currency": "USD"},
    )
    group_data = group_resp.json()["data"]
    group_id = group_data["id"]
    invite_code = group_data["invite_code"]

    # Users 2 and 3 join
    await client.post("/api/v1/groups/join", headers=h_user2, json={"invite_code": invite_code})
    await client.post("/api/v1/groups/join", headers=h_user3, json={"invite_code": invite_code})

    # User 1 pays $100.00 split equally among all 3 members
    expense_resp = await client.post(
        f"/api/v1/groups/{group_id}/expenses",
        headers=h_user1,
        json={
            "title": "Dinner at Bistro",
            "amount": 100.00,
            "currency": "USD",
            "split_type": "EQUAL",
            "category": "FOOD_AND_DRINK",
        },
    )
    assert expense_resp.status_code == 201
    exp_data = expense_resp.json()["data"]
    splits = exp_data["splits"]
    assert len(splits) == 3

    # Verify that the sum of calculated splits is exactly 100.00 down to the cent
    total_split_sum = sum(Decimal(str(s["amount_owed"])) for s in splits)
    assert total_split_sum == Decimal("100.00")

    # One member gets 33.34 and two get 33.33 (or similar exact cent distribution)
    amounts = sorted([float(s["amount_owed"]) for s in splits])
    assert amounts == [33.33, 33.33, 33.34]

    # Check Balances
    bal_resp = await client.get(f"/api/v1/groups/{group_id}/balances", headers=h_user1)
    assert bal_resp.status_code == 200
    summary = bal_resp.json()["data"]
    assert summary["total_group_spending"] == "100.00"

    # Sum of all net balances in the group must be 0.00
    net_sum = sum(Decimal(str(b["net_balance"])) for b in summary["balances"])
    assert net_sum == Decimal("0.00")


@pytest.mark.asyncio
async def test_exact_split_validation(client: AsyncClient, mock_redis: MockRedis):
    h_user1 = await create_and_login_user(client, mock_redis, "exact1@example.com", "Exact1")
    await create_and_login_user(client, mock_redis, "exact2@example.com", "Exact2")

    group_resp = await client.post(
        "/api/v1/groups/",
        headers=h_user1,
        json={"name": "Exact Group", "currency": "USD"},
    )
    group_id = group_resp.json()["data"]["id"]
    invite_code = group_resp.json()["data"]["invite_code"]

    u1_profile = (await client.get("/api/v1/users/me", headers=h_user1)).json()["data"]
    u1_id = u1_profile["id"]

    # Fails if sum doesn't match total amount (e.g. 40 + 50 != 100)
    fail_resp = await client.post(
        f"/api/v1/groups/{group_id}/expenses",
        headers=h_user1,
        json={
            "title": "Concert Tickets",
            "amount": 100.00,
            "split_type": "EXACT",
            "splits": [
                {"user_id": u1_id, "amount_owed": 40.00},
            ],
        },
    )
    assert fail_resp.status_code == 422
    assert "does not match" in fail_resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_percentage_and_shares_split(client: AsyncClient, mock_redis: MockRedis):
    h_user1 = await create_and_login_user(client, mock_redis, "pct1@example.com", "Pct1")
    h_user2 = await create_and_login_user(client, mock_redis, "pct2@example.com", "Pct2")

    group_resp = await client.post(
        "/api/v1/groups/",
        headers=h_user1,
        json={"name": "Vacation House", "currency": "USD"},
    )
    group_id = group_resp.json()["data"]["id"]
    invite_code = group_resp.json()["data"]["invite_code"]
    await client.post("/api/v1/groups/join", headers=h_user2, json={"invite_code": invite_code})

    u1_id = (await client.get("/api/v1/users/me", headers=h_user1)).json()["data"]["id"]
    u2_id = (await client.get("/api/v1/users/me", headers=h_user2)).json()["data"]["id"]

    # 1. Percentage Split: 70% and 30% on $200.00
    pct_resp = await client.post(
        f"/api/v1/groups/{group_id}/expenses",
        headers=h_user1,
        json={
            "title": "Groceries",
            "amount": 200.00,
            "split_type": "PERCENTAGE",
            "splits": [
                {"user_id": u1_id, "percentage": 70.00},
                {"user_id": u2_id, "percentage": 30.00},
            ],
        },
    )
    assert pct_resp.status_code == 201
    splits = pct_resp.json()["data"]["splits"]
    owed_dict = {s["user_id"]: Decimal(str(s["amount_owed"])) for s in splits}
    assert owed_dict[u1_id] == Decimal("140.00")
    assert owed_dict[u2_id] == Decimal("60.00")

    # 2. Shares Split: 2 shares and 1 share on $300.00 (2/3 = 200, 1/3 = 100)
    share_resp = await client.post(
        f"/api/v1/groups/{group_id}/expenses",
        headers=h_user1,
        json={
            "title": "Airfare",
            "amount": 300.00,
            "split_type": "SHARES",
            "splits": [
                {"user_id": u1_id, "shares": 2},
                {"user_id": u2_id, "shares": 1},
            ],
        },
    )
    assert share_resp.status_code == 201
    share_splits = share_resp.json()["data"]["splits"]
    share_dict = {s["user_id"]: Decimal(str(s["amount_owed"])) for s in share_splits}
    assert share_dict[u1_id] == Decimal("200.00")
    assert share_dict[u2_id] == Decimal("100.00")
