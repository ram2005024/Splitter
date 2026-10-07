"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreateGroup } from "@/features/groups/hooks";
import {
  CreateGroupFormData,
  createGroupSchema,
} from "@/features/groups/schemas";
import { NormalizedError } from "@/lib/api/errors";
import { useLanguage } from "@/providers/language-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

export function CreateGroupDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateGroupDialogProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const createGroupMutation = useCreateGroup();
  const { language, t } = useLanguage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "NPR",
      group_type: "OTHER",
    },
  });

  const onSubmit = async (data: CreateGroupFormData) => {
    setErrorMsg(null);
    try {
      const res = await createGroupMutation.mutateAsync(data);
      reset();
      onClose();
      if (onSuccess && res.data) {
        onSuccess(res.data.id);
      }
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setErrorMsg(error?.message || t("createGroupFailedDefault"));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === "ne"
          ? "नयाँ खर्च समूह बनाउनुहोस्"
          : "Create New Expense Group"
      }
      description={
        language === "ne"
          ? "यात्रा, कोठाका साथी वा परियोजनाको खर्च ट्र्याक गर्नुहोस्"
          : "Start tracking shared trip, apartment, or project expenses in NPR"
      }
    >
      {errorMsg && (
        <Alert variant="error" title={t("creationFailed")} className="mb-4">
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t("groupName")}
          placeholder={
            language === "ne"
              ? "जस्तै: पोखरा भ्रमण, कोठा ३ बी"
              : "e.g. Pokhara Trip, Flat 3B"
          }
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={t("currency")}
            options={[{ value: "NPR", label: "NPR (रू) — Nepalese Rupee" }]}
            helperText={t("currencyFixedNote")}
            {...register("currency")}
          />

          <Select
            label={t("groupCategory")}
            options={[
              {
                value: "TRIP",
                label: language === "ne" ? "यात्रा / भ्रमण" : "Trip / Travel",
              },
              {
                value: "HOME",
                label:
                  language === "ne" ? "घर / कोठाका साथी" : "Home / Flatmates",
              },
              {
                value: "COUPLE",
                label: language === "ne" ? "दम्पती" : "Couple",
              },
              {
                value: "PROJECT",
                label: language === "ne" ? "परियोजना / काम" : "Project / Work",
              },
              {
                value: "OTHER",
                label: language === "ne" ? "अन्य" : "Other / General",
              },
            ]}
            error={errors.group_type?.message}
            {...register("group_type")}
          />
        </div>

        <Input
          label={t("description")}
          placeholder={
            language === "ne"
              ? "यस समूहको उद्देश्यबारे छोटो विवरण"
              : "Short note about the purpose of this group"
          }
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" isLoading={createGroupMutation.isPending}>
            {t("createGroupBtn")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
