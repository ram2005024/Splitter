import apiClient from "@/lib/api/client";
import { APIResponse, TokenResponse, User } from "@/types/api";
import {
  LoginFormData,
  RegisterFormData,
  VerifyEmailFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from "./schemas";

export const authApi = {
  async login(data: LoginFormData): Promise<APIResponse<TokenResponse>> {
    const response = await apiClient.post<APIResponse<TokenResponse>>("/auth/login", data);
    return response.data;
  },

  async register(data: RegisterFormData): Promise<APIResponse<User>> {
    const response = await apiClient.post<APIResponse<User>>("/auth/register", data);
    return response.data;
  },

  async verifyEmail(data: VerifyEmailFormData): Promise<APIResponse<User>> {
    const response = await apiClient.post<APIResponse<User>>("/auth/verify", data);
    return response.data;
  },

  async resendVerification(email: string): Promise<APIResponse<null>> {
    const response = await apiClient.post<APIResponse<null>>("/auth/resend-verification", { email });
    return response.data;
  },

  async logout(): Promise<APIResponse<null>> {
    const response = await apiClient.post<APIResponse<null>>("/auth/logout");
    return response.data;
  },

  async getMe(): Promise<APIResponse<User>> {
    const response = await apiClient.get<APIResponse<User>>("/users/me");
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordFormData): Promise<APIResponse<null>> {
    const response = await apiClient.post<APIResponse<null>>("/auth/forgot-password", data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordFormData): Promise<APIResponse<null>> {
    const response = await apiClient.post<APIResponse<null>>("/auth/reset-password", data);
    return response.data;
  },
};
