import apiClient from "@/lib/api/client";
import {
  APIResponse,
  Group,
  GroupDetail,
  GroupMember,
} from "@/types/api";
import {
  CreateGroupFormData,
  JoinGroupByCodeFormData,
  AddMemberFormData,
} from "./schemas";

export const groupsApi = {
  async getMyGroups(): Promise<APIResponse<Group[]>> {
    const response = await apiClient.get<APIResponse<Group[]>>("/groups/");
    return response.data;
  },

  async getGroupDetails(groupId: string): Promise<APIResponse<GroupDetail>> {
    const response = await apiClient.get<APIResponse<GroupDetail>>(`/groups/${groupId}`);
    return response.data;
  },

  async createGroup(data: CreateGroupFormData): Promise<APIResponse<GroupDetail>> {
    const response = await apiClient.post<APIResponse<GroupDetail>>("/groups/", data);
    return response.data;
  },

  async joinGroupByCode(data: JoinGroupByCodeFormData): Promise<APIResponse<{ group_id: string; group_name: string; currency: string }>> {
    const response = await apiClient.post<APIResponse<{ group_id: string; group_name: string; currency: string }>>(
      "/groups/join",
      data
    );
    return response.data;
  },

  async addMember(groupId: string, data: AddMemberFormData): Promise<APIResponse<{ group_id: string; user_id: string; role: string }>> {
    const response = await apiClient.post<APIResponse<{ group_id: string; user_id: string; role: string }>>(
      `/groups/${groupId}/members`,
      data
    );
    return response.data;
  },

  async getGroupMembers(groupId: string): Promise<APIResponse<GroupMember[]>> {
    const response = await apiClient.get<APIResponse<GroupMember[]>>(`/groups/${groupId}/members`);
    return response.data;
  },
};
