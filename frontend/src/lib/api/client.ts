import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { refreshAccessToken } from "./refresh";
import { normalizeApiError } from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Extend Axios request config for retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Request Interceptor: Inject Bearer token from Zustand
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Concurrent Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(normalizeApiError(error));
    }

    const requestUrl = originalRequest.url || "";
    const isAuthRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh");

    // Intercept 401 Unauthorized for non-auth requests that haven't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        // Await shared refresh promise
        const newAccessToken = await refreshAccessToken();

        // Update Authorization header with new access token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // Refresh failed: session expired or token revoked
        if (typeof window !== "undefined") {
          // Avoid infinite redirect loops if already on login
          if (!window.location.pathname.startsWith("/login")) {
            window.location.href = "/login?session_expired=true";
          }
        }
        return Promise.reject(normalizeApiError(refreshErr));
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export default apiClient;
