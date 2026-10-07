"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "./api";
import {
  CreateGroupFormData,
  JoinGroupByCodeFormData,
  AddMemberFormData,
} from "./schemas";

export function useMyGroups() {
  return useQuery({
    queryKey: ["myGroups"],
    queryFn: async () => {
      const res = await groupsApi.getMyGroups();
      return res.data;
    },
  });
}

export function useGroupDetails(groupId: string) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await groupsApi.getGroupDetails(groupId);
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: async () => {
      const res = await groupsApi.getGroupMembers(groupId);
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupFormData) => groupsApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: JoinGroupByCodeFormData) => groupsApi.joinGroupByCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMemberFormData) => groupsApi.addMember(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupBalances", groupId] });
    },
  });
}
