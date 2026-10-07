"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "./api";
import { ExpenseCreateRequest } from "@/types/api";

export function useGroupExpenses(groupId: string, page = 1) {
  return useQuery({
    queryKey: ["groupExpenses", groupId, page],
    queryFn: async () => {
      const res = await expensesApi.getGroupExpenses(groupId, page);
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useExpenseDetail(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: ["expenseDetail", groupId, expenseId],
    queryFn: async () => {
      const res = await expensesApi.getExpenseDetail(groupId, expenseId);
      return res.data;
    },
    enabled: !!groupId && !!expenseId,
  });
}

export function useGroupBalances(groupId: string) {
  return useQuery({
    queryKey: ["groupBalances", groupId],
    queryFn: async () => {
      const res = await expensesApi.getGroupBalances(groupId);
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreateRequest) => expensesApi.createExpense(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupExpenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupBalances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["simplifiedDebts", groupId] });
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.deleteExpense(groupId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupExpenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupBalances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["simplifiedDebts", groupId] });
    },
  });
}
