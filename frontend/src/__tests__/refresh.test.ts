import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { refreshAccessToken } from "../lib/api/refresh";
import { useAuthStore } from "../stores/auth-store";

vi.mock("axios");

describe("Concurrent Refresh Protection (Section 10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  it("should make exactly ONE refresh request when multiple concurrent calls happen simultaneously", async () => {
    let callCount = 0;
    (axios.post as any).mockImplementation(async () => {
      callCount++;
      // Simulate network latency
      await new Promise((res) => setTimeout(res, 50));
      return {
        data: {
          success: true,
          data: {
            access_token: "new-access-token-999",
            token_type: "Bearer",
            expires_in: 3600,
            user: {
              id: "user-1",
              email: "test@example.com",
              full_name: "Test User",
            },
          },
        },
      };
    });

    // 4 concurrent requests hit 401 at the exact same moment
    const [token1, token2, token3, token4] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    // All 4 callers receive the exact same new access token
    expect(token1).toBe("new-access-token-999");
    expect(token2).toBe("new-access-token-999");
    expect(token3).toBe("new-access-token-999");
    expect(token4).toBe("new-access-token-999");

    // CRITICAL: axios.post must only have been invoked ONCE
    expect(callCount).toBe(1);

    // Zustand store must be updated with the new token and user
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("new-access-token-999");
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe("test@example.com");
  });

  it("should clear auth state and reject all callers when refresh fails (Section 11)", async () => {
    useAuthStore.getState().setAuth("old-token", {
      id: "u-1",
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      full_name: "Test User",
      is_verified: true,
      is_active: true,
      created_at: "",
    });

    (axios.post as any).mockRejectedValueOnce(new Error("Refresh token expired or revoked"));

    await expect(refreshAccessToken()).rejects.toThrow("Refresh token expired or revoked");

    // Client auth must be wiped
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
