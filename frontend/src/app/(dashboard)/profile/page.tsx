"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormData } from "@/features/users/schemas";
import { useAuthStore } from "@/stores/auth-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { useUpdateProfile } from "@/features/users/hooks";
import { useLanguage } from "@/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, ShieldCheck, Phone, FileText, CreditCard } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { NormalizedError } from "@/lib/api/errors";

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <div className="pb-6 border-b" style={{ borderColor: "var(--border-default)" }}>
        <Skeleton className="h-9 w-72 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Avatar card */}
      <div
        className="rounded-2xl border p-6 sm:p-8 shadow-xl"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>
      </div>

      {/* Form card */}
      <div
        className="rounded-2xl border p-6 shadow-xl space-y-4"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-3 w-64 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const { t } = useLanguage();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      phone_number: user?.profile?.phone_number || "",
      default_currency: user?.profile?.default_currency || "NPR",
      bio: user?.profile?.bio || "",
      payment_handle: user?.profile?.payment_handle || "",
      avatar_url: user?.profile?.avatar_url || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setFeedback(null);
    try {
      await updateProfileMutation.mutateAsync({
        phone_number: data.phone_number || null,
        default_currency: data.default_currency || "NPR",
        bio: data.bio || null,
        payment_handle: data.payment_handle || null,
        avatar_url: data.avatar_url || null,
      });
      setFeedback({ type: "success", message: t("profileUpdated") });
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setFeedback({ type: "error", message: error?.message || t("profileUpdateFailed") });
    }
  };

  if (isLoading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6 animate-fadeIn">
      <div className="pb-6 border-b" style={{ borderColor: "var(--border-default)" }}>
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5"
          style={{ color: "var(--text-primary)" }}
        >
          <User className="h-7 w-7" style={{ color: "var(--accent)" }} />
          {t("profileTitle")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("profileDesc")}
        </p>
      </div>

      {feedback && (
        <Alert variant={feedback.type} title={feedback.type === "success" ? t("success") : t("error")}>
          {feedback.message}
        </Alert>
      )}

      {/* Account Info Header Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-2xl font-bold text-white shadow-xl shrink-0">
            {getInitials(user.full_name)}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {user.full_name}
              </h2>
              <div className="flex justify-center sm:justify-start gap-2">
                {user.is_verified && (
                  <Badge variant="success" className="gap-1 text-[10px]">
                    <ShieldCheck className="h-3 w-3" />
                    {t("verified")}
                  </Badge>
                )}
                {user.is_active && (
                  <Badge variant="outline" className="text-[10px]">
                    {t("activeAccount")}
                  </Badge>
                )}
              </div>
            </div>

            <p
              className="text-xs flex items-center justify-center sm:justify-start gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Mail className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              {user.email}
            </p>

            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {t("accountCreated")} {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>{t("profileDetails")}</CardTitle>
          <CardDescription>
            {t("profileDetailsDesc")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t("defaultCurrency")}
                options={[
                  { value: "NPR", label: "NPR — Nepalese Rupee (रू)" },
                ]}
                helperText={t("defaultCurrencyHelper")}
                error={errors.default_currency?.message}
                {...register("default_currency")}
              />

              <Input
                label={t("phoneNumber")}
                placeholder="+977 98XXXXXXXX"
                icon={<Phone className="h-4 w-4" />}
                error={errors.phone_number?.message}
                {...register("phone_number")}
              />
            </div>

            <Input
              label={t("paymentHandle")}
              placeholder={t("paymentHandlePlaceholder")}
              icon={<CreditCard className="h-4 w-4" />}
              helperText={t("paymentHandleHelper")}
              error={errors.payment_handle?.message}
              {...register("payment_handle")}
            />

            <Input
              label={t("avatarUrl")}
              placeholder="https://example.com/avatar.png"
              error={errors.avatar_url?.message}
              {...register("avatar_url")}
            />

            <div className="space-y-1.5">
              <label
                className="block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("bio")}
              </label>
              <textarea
                rows={3}
                placeholder={t("bioPlaceholder")}
                className="flex w-full rounded-xl border px-3 py-2 text-sm placeholder:opacity-50 focus:outline-none focus:ring-1 transition-colors"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: errors.bio ? "var(--error)" : "var(--border-default)",
                  color: "var(--text-primary)",
                }}
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-xs text-rose-500 font-medium">{errors.bio.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" isLoading={updateProfileMutation.isPending}>
                {t("saveChanges")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
