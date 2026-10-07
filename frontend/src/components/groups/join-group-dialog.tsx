"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinGroupByCodeSchema, JoinGroupByCodeFormData } from "@/features/groups/schemas";
import { useJoinGroup } from "@/features/groups/hooks";
import { useLanguage } from "@/providers/language-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { NormalizedError } from "@/lib/api/errors";

interface JoinGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

export function JoinGroupDialog({ isOpen, onClose, onSuccess }: JoinGroupDialogProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const joinGroupMutation = useJoinGroup();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinGroupByCodeFormData>({
    resolver: zodResolver(joinGroupByCodeSchema),
  });

  const onSubmit = async (data: JoinGroupByCodeFormData) => {
    setErrorMsg(null);
    try {
      const res = await joinGroupMutation.mutateAsync({
        invite_code: data.invite_code.toUpperCase().trim(),
      });
      reset();
      onClose();
      if (onSuccess && res.data) {
        onSuccess(res.data.group_id);
      }
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setErrorMsg(error?.message || t("joinFailedDefault"));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t("joinGroupTitle")}
      description={t("joinGroupDialogDesc")}
    >
      {errorMsg && (
        <Alert variant="error" title={t("joinFailed")} className="mb-4">
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t("inviteCodeLabel")}
          placeholder={t("inviteCodePlaceholder")}
          className="uppercase tracking-widest font-mono text-center text-lg"
          maxLength={12}
          error={errors.invite_code?.message}
          {...register("invite_code")}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" isLoading={joinGroupMutation.isPending}>
            {t("joinGroupBtn")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
