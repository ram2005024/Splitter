"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, CreateGroupFormData } from "@/features/groups/schemas";
import { useCreateGroup } from "@/features/groups/hooks";
import { useLanguage } from "@/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { NormalizedError } from "@/lib/api/errors";

export default function NewGroupPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const createGroupMutation = useCreateGroup();
  const { language, t } = useLanguage();

  const {
    register,
    handleSubmit,
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
      if (res.data?.id) {
        router.push(`/groups/${res.data.id}`);
      } else {
        router.push("/groups");
      }
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setErrorMsg(error?.message || "Failed to create group.");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/groups">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {language === "ne" ? "नयाँ समूह बनाउनुहोस्" : "Create New Group"}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {language === "ne"
              ? "नेपाली रूपैयाँ (NPR) मा नयाँ खर्च कार्यक्षेत्र सुरु गर्नुहोस्"
              : "Start a new shared budget workspace in NPR"}
          </p>
        </div>
      </div>

      <Card
        className="border shadow-sm"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <CardContent className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <Alert variant="error" title="Creation Failed">
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t("groupName")}
              placeholder={language === "ne" ? "जस्तै: पोखरा भ्रमण, कोठा ३ बी" : "e.g. Pokhara Trip, Flat 3B"}
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label={t("currency")}
                options={[
                  { value: "NPR", label: "NPR (रू) — Nepalese Rupee" },
                ]}
                helperText={t("currencyFixedNote")}
                {...register("currency")}
              />

              <Select
                label={t("groupCategory")}
                options={[
                  { value: "TRIP", label: language === "ne" ? "यात्रा / भ्रमण" : "Trip / Travel" },
                  { value: "HOME", label: language === "ne" ? "घर / कोठाका साथी" : "Home / Flatmates" },
                  { value: "COUPLE", label: language === "ne" ? "दम्पती" : "Couple" },
                  { value: "PROJECT", label: language === "ne" ? "परियोजना / काम" : "Project / Work" },
                  { value: "OTHER", label: language === "ne" ? "अन्य" : "Other / General" },
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
                  : "e.g. Shared expenses for summer cabin trip"
              }
              error={errors.description?.message}
              {...register("description")}
            />

            <div
              className="flex items-center justify-end gap-3 pt-4 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Link href="/groups">
                <Button type="button" variant="ghost">
                  {t("cancel")}
                </Button>
              </Link>
              <Button type="submit" isLoading={createGroupMutation.isPending}>
                {t("createGroupBtn")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
