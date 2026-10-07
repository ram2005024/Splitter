"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settlementsApi } from "./api";
import { SettlementCreateRequest } from "@/types/api";

export function useGroupSettlements(groupId: string, page = 1) {
  return useQuery({
    queryKey: ["groupSettlements", groupId, page],
    queryFn: async () => {
      const res = await settlementsApi.getGroupSettlements(groupId, page);
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useSimplifyDebts(groupId: string) {
  return useQuery({
    queryKey: ["simplifiedDebts", groupId],
    queryFn: async () => {
      const res = await settlementsApi.simplifyDebts(groupId);
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useRecordSettlement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SettlementCreateRequest) => settlementsApi.recordSettlement(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupSettlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupBalances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["simplifiedDebts", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });
}
