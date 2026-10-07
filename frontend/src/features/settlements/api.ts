import apiClient from "@/lib/api/client";
import {
  APIResponse,
  DebtSimplification,
  Settlement,
  SettlementCreateRequest,
} from "@/types/api";

export const settlementsApi = {
  async getGroupSettlements(groupId: string, page = 1, pageSize = 50): Promise<APIResponse<Settlement[]>> {
    const response = await apiClient.get<APIResponse<Settlement[]>>(
      `/groups/${groupId}/settlements?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  },

  async recordSettlement(groupId: string, data: SettlementCreateRequest): Promise<APIResponse<Settlement>> {
    const response = await apiClient.post<APIResponse<Settlement>>(
      `/groups/${groupId}/settlements`,
      data
    );
    return response.data;
  },

  async simplifyDebts(groupId: string): Promise<APIResponse<DebtSimplification>> {
    const response = await apiClient.get<APIResponse<DebtSimplification>>(
      `/groups/${groupId}/simplify-debts`
    );
    return response.data;
  },
};
