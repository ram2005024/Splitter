from decimal import Decimal
import pytest
from httpx import AsyncClient
from tests.conftest import MockRedis
from tests.test_groups import create_and_login_user


@pytest.mark.asyncio
async def test_settlement_and_debt_simplification(client: AsyncClient, mock_redis: MockRedis):
    # Setup 3 users: Alice, Bob, Charlie
    h_alice = await create_and_login_user(client, mock_redis, "alice_s@example.com", "Alice")
    h_bob = await create_and_login_user(client, mock_redis, "bob_s@example.com", "Bob")
    h_charlie = await create_and_login_user(client, mock_redis, "charlie_s@example.com", "Charlie")

    u_alice = (await client.get("/api/v1/users/me", headers=h_alice)).json()["data"]
    u_bob = (await client.get("/api/v1/users/me", headers=h_bob)).json()["data"]
    u_charlie = (await client.get("/api/v1/users/me", headers=h_charlie)).json()["data"]

    # Alice creates group
    group_resp = await client.post(
        "/api/v1/groups/",
        headers=h_alice,
        json={"name": "Roadtrip", "currency": "USD"},
    )
    group_id = group_resp.json()["data"]["id"]
    invite_code = group_resp.json()["data"]["invite_code"]

    # Bob and Charlie join
    await client.post("/api/v1/groups/join", headers=h_bob, json={"invite_code": invite_code})
    await client.post("/api/v1/groups/join", headers=h_charlie, json={"invite_code": invite_code})

    # Expense 1: Alice pays $90.00 split equally ($30 each)
    # Alice: +$60.00, Bob: -$30.00, Charlie: -$30.00
    await client.post(
        f"/api/v1/groups/{group_id}/expenses",
        headers=h_alice,
        json={
            "title": "Gas",
            "amount": 90.00,
            "split_type": "EQUAL",
        },
    )

    # Expense 2: Bob pays $60.00 split equally between Bob and Charlie ($30 each)
    # Bob: -$30 + $30 = $0.00 net
    # Charlie: -$30 - $30 = -$60.00 net
    # Alice: +$60.00 net
    await client.post(
        f"/api/v1/groups/{group_id}/expenses",
        headers=h_bob,
        json={
            "title": "Snacks",
            "amount": 60.00,
            "split_type": "EQUAL",
            "splits": [
                {"user_id": u_bob["id"]},
                {"user_id": u_charlie["id"]},
            ],
        },
    )

    # Test Debt Simplification:
    # Instead of Charlie paying Bob and Bob paying Alice,
    # the algorithm simplifies it: Charlie should pay Alice $60 directly! (1 transaction instead of 2)
    simplify_resp = await client.get(
        f"/api/v1/groups/{group_id}/simplify-debts",
        headers=h_alice,
    )
    assert simplify_resp.status_code == 200
    sim_data = simplify_resp.json()["data"]
    assert sim_data["transaction_count"] == 1
    suggested = sim_data["suggested_settlements"][0]
    assert suggested["from_user_id"] == u_charlie["id"]
    assert suggested["to_user_id"] == u_alice["id"]
    assert Decimal(str(suggested["amount"])) == Decimal("60.00")

    # Charlie executes the settlement payment of $60 to Alice
    settle_resp = await client.post(
        f"/api/v1/groups/{group_id}/settlements",
        headers=h_charlie,
        json={
            "receiver_id": u_alice["id"],
            "amount": 60.00,
            "payment_method": "VENMO",
            "reference_note": "Settling up for the roadtrip",
        },
    )
    assert settle_resp.status_code == 201

    # Check that all balances are now exactly 0.00
    bal_after = await client.get(f"/api/v1/groups/{group_id}/balances", headers=h_alice)
    assert bal_after.status_code == 200
    for b in bal_after.json()["data"]["balances"]:
        assert Decimal(str(b["net_balance"])) == Decimal("0.00")

    # Check debt simplification now returns 0 suggested transactions
    simplify_after = await client.get(
        f"/api/v1/groups/{group_id}/simplify-debts",
        headers=h_alice,
    )
    assert simplify_after.json()["data"]["transaction_count"] == 0
