import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { APIResponse, TokenResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// Shared promise for concurrent 401 refresh coordination
let refreshPromise: Promise<string> | null = null;

/**
 * Handles automatic token refresh with strict concurrency deduplication.
 * If 10 requests hit 401 at the same moment, only ONE /auth/refresh HTTP request is sent.
 * All 10 requests share the same promise and retry when it resolves.
 */
export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // Call dedicated refresh endpoint with credentials (HttpOnly cookie included automatically)
      const response = await axios.post<APIResponse<TokenResponse>>(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const tokenData = response.data.data;
      if (!tokenData || !tokenData.access_token) {
        throw new Error("Invalid response received from refresh endpoint");
      }

      const newAccessToken = tokenData.access_token;
      // Update Zustand client store with fresh access token and user info
      useAuthStore.getState().setAuth(newAccessToken, tokenData.user);

      return newAccessToken;
    } catch (error) {
      // Refresh failed (expired/revoked refresh token)
      useAuthStore.getState().clearAuth();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
