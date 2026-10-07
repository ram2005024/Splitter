import apiClient from "@/lib/api/client";
import {
  APIResponse,
  Expense,
  ExpenseCreateRequest,
  GroupBalanceSummary,
} from "@/types/api";

export const expensesApi = {
  async getGroupExpenses(groupId: string, page = 1, pageSize = 50): Promise<APIResponse<Expense[]>> {
    const response = await apiClient.get<APIResponse<Expense[]>>(
      `/groups/${groupId}/expenses?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  },

  async getExpenseDetail(groupId: string, expenseId: string): Promise<APIResponse<Expense>> {
    const response = await apiClient.get<APIResponse<Expense>>(
      `/groups/${groupId}/expenses/${expenseId}`
    );
    return response.data;
  },

  async createExpense(groupId: string, data: ExpenseCreateRequest): Promise<APIResponse<Expense>> {
    const response = await apiClient.post<APIResponse<Expense>>(
      `/groups/${groupId}/expenses`,
      data
    );
    return response.data;
  },

  async deleteExpense(groupId: string, expenseId: string): Promise<APIResponse<null>> {
    const response = await apiClient.delete<APIResponse<null>>(
      `/groups/${groupId}/expenses/${expenseId}`
    );
    return response.data;
  },

  async getGroupBalances(groupId: string): Promise<APIResponse<GroupBalanceSummary>> {
    const response = await apiClient.get<APIResponse<GroupBalanceSummary>>(
      `/groups/${groupId}/balances`
    );
    return response.data;
  },
};
