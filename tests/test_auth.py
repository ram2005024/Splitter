import pytest
from httpx import AsyncClient
from tests.conftest import MockRedis


@pytest.mark.asyncio
async def test_register_password_mismatch(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "password1": "Password123!",
            "password2": "MismatchPassword!",
        },
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_register_success_auto_profile_and_verify(client: AsyncClient, mock_redis: MockRedis):
    # 1. Register
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "alice@example.com",
            "first_name": "Alice",
            "last_name": "Smith",
            "password1": "SecurePass123!",
            "password2": "SecurePass123!",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["email"] == "alice@example.com"
    assert body["data"]["is_verified"] is False
    # Requirement 2: Profile must be automatically created
    assert body["data"]["profile"] is not None
    assert body["data"]["profile"]["default_currency"] == "USD"

    # Verify code was stored in Redis
    otp = await mock_redis.get("verify_code:alice@example.com")
    assert otp is not None
    assert len(otp) == 6

    # 2. Try to login before verification -> should fail with 403 Forbidden
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "SecurePass123!"},
    )
    assert login_resp.status_code == 403
    assert "verify your email" in login_resp.json()["message"].lower()

    # 3. Verify with OTP
    verify_resp = await client.post(
        "/api/v1/auth/verify",
        json={"email": "alice@example.com", "code": otp},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["data"]["is_verified"] is True

    # 4. Login after verification
    login_ok = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "SecurePass123!"},
    )
    assert login_ok.status_code == 200
    tokens = login_ok.json()["data"]
    assert "access_token" in tokens
    assert "user" in tokens
    assert tokens["user"]["email"] == "alice@example.com"
    # HttpOnly cookie check
    assert "refresh_token" in login_ok.cookies
    initial_refresh_cookie = login_ok.cookies["refresh_token"]

    # 5. Refresh token using HttpOnly cookie (no body sent)
    refresh_ok = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": initial_refresh_cookie},
    )
    assert refresh_ok.status_code == 200
    refresh_data = refresh_ok.json()["data"]
    assert "access_token" in refresh_data
    assert "refresh_token" in refresh_ok.cookies
    new_refresh_cookie = refresh_ok.cookies["refresh_token"]

    # 6. Logout - revokes refresh token and clears cookie
    logout_ok = await client.post(
        "/api/v1/auth/logout",
        cookies={"refresh_token": new_refresh_cookie},
    )
    assert logout_ok.status_code == 200

    # 7. Attempting to refresh with the revoked token should fail with 401
    revoked_refresh = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": new_refresh_cookie},
    )
    assert revoked_refresh.status_code == 401



@pytest.mark.asyncio
async def test_login_lockout_redis(client: AsyncClient, mock_redis: MockRedis):
    # Register and verify bob
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "bob@example.com",
            "first_name": "Bob",
            "last_name": "Builder",
            "password1": "StrongPass123!",
            "password2": "StrongPass123!",
        },
    )
    otp = await mock_redis.get("verify_code:bob@example.com")
    await client.post("/api/v1/auth/verify", json={"email": "bob@example.com", "code": otp})

    # Fail login 4 times (returns 401 with warning of remaining attempts)
    for _ in range(4):
        fail_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "bob@example.com", "password": "WrongPassword!"},
        )
        assert fail_resp.status_code == 401

    # 5th failed attempt reaches max threshold and triggers lockout (429 Rate Limit)
    fifth_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "bob@example.com", "password": "WrongPassword!"},
    )
    assert fifth_resp.status_code == 429

    # Even with the correct password, subsequent attempt is locked out (429)
    lockout_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "bob@example.com", "password": "StrongPass123!"},
    )
    assert lockout_resp.status_code == 429
    assert "locked" in lockout_resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_password_reset_flow(client: AsyncClient, mock_redis: MockRedis):
    email = "charlie@example.com"
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "first_name": "Charlie",
            "last_name": "Brown",
            "password1": "OldPassword123!",
            "password2": "OldPassword123!",
        },
    )
    otp = await mock_redis.get(f"verify_code:{email}")
    await client.post("/api/v1/auth/verify", json={"email": email, "code": otp})

    # Request password reset
    forgot_resp = await client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert forgot_resp.status_code == 200

    reset_code = await mock_redis.get(f"pwd_reset_code:{email}")
    assert reset_code is not None

    # Reset password
    reset_resp = await client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": email,
            "code": reset_code,
            "new_password": "NewStrongPassword456!",
            "confirm_password": "NewStrongPassword456!",
        },
    )
    assert reset_resp.status_code == 200

    # Login with new password
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "NewStrongPassword456!"},
    )
    assert login_resp.status_code == 200
