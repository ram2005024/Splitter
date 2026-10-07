"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, UserProfileUpdateInput } from "./api";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserProfileUpdateInput) => usersApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
