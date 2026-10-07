import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../stores/auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("should initialize in unauthenticated state with null token", () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should store access token and user on setAuth", () => {
    const mockUser = {
      id: "u-123",
      email: "alice@example.com",
      first_name: "Alice",
      last_name: "Smith",
      full_name: "Alice Smith",
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    useAuthStore.getState().setAuth("jwt-access-token-123", mockUser);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("jwt-access-token-123");
    expect(state.user?.email).toBe("alice@example.com");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isInitializing).toBe(false);

    // Verify refresh token is NEVER stored in Zustand
    expect((state as any).refreshToken).toBeUndefined();
    expect((state as any).refresh_token).toBeUndefined();
  });

  it("should clear access token and user state on clearAuth", () => {
    useAuthStore.getState().setAuth("jwt-token", {
      id: "u-1",
      email: "a@b.com",
      first_name: "A",
      last_name: "B",
      full_name: "A B",
      is_verified: true,
      is_active: true,
      created_at: "",
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
