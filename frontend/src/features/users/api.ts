import apiClient from "@/lib/api/client";
import { APIResponse, UserProfile } from "@/types/api";

export interface UserProfileUpdateInput {
  avatar_url?: string | null;
  phone_number?: string | null;
  default_currency?: string | null;
  bio?: string | null;
  payment_handle?: string | null;
}

export const usersApi = {
  async updateProfile(data: UserProfileUpdateInput): Promise<APIResponse<UserProfile>> {
    const response = await apiClient.patch<APIResponse<UserProfile>>("/users/me/profile", data);
    return response.data;
  },
};
