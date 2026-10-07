"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth-store";
import { useGroupDetails } from "@/features/groups/hooks";
import { useCreateExpense } from "@/features/expenses/hooks";
import {
  createExpenseSchema,
  CreateExpenseFormData,
  expenseFormSchema,
  ExpenseFormValues,
} from "@/features/expenses/schemas";
import { useLanguage } from "@/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Receipt, Banknote, Calculator } from "lucide-react";
import { SplitType, ExpenseCategory } from "@/types/api";
import { formatCurrency, getInitials } from "@/lib/utils";
import { NormalizedError } from "@/lib/api/errors";

function NewExpenseSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-36 rounded-md" />
        </div>
      </div>

      <div
        className="rounded-2xl border p-6 sm:p-8 space-y-6"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>

        <div className="pt-4 border-t space-y-4" style={{ borderColor: "var(--border-subtle)" }}>
          <Skeleton className="h-5 w-40 rounded" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 rounded-xl" />
            ))}
          </div>
          <div className="space-y-2 mt-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { t } = useLanguage();

  const { data: group, isLoading: groupLoading } = useGroupDetails(groupId);
  const createExpenseMutation = useCreateExpense(groupId);

  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, { amount?: number; percentage?: number; shares?: number }>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      amount: undefined,
      payer_id: currentUser?.id,
      category: "FOOD_AND_DRINK",
      notes: "",
    },
  });

  const totalAmount = watch("amount") || 0;

  React.useEffect(() => {
    if (group?.members && selectedUserIds.length === 0) {
      setSelectedUserIds(group.members.map((m) => m.user_id));
    }
  }, [group, selectedUserIds.length]);

  const toggleParticipant = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCustomValueChange = (userId: string, field: "amount" | "percentage" | "shares", value: number) => {
    setCustomSplits((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    setFormError(null);

    if (selectedUserIds.length === 0) {
      setFormError("Please select at least one participant for the split.");
      return;
    }

    if (splitType === "EXACT") {
      const sum = selectedUserIds.reduce((acc, uid) => acc + (customSplits[uid]?.amount || 0), 0);
      if (Math.abs(sum - Number(data.amount)) > 0.01) {
        setFormError(
          `Exact split amounts sum to ${sum.toFixed(2)}, which must equal total expense of ${Number(data.amount).toFixed(2)}`
        );
        return;
      }
    } else if (splitType === "PERCENTAGE") {
      const sum = selectedUserIds.reduce((acc, uid) => acc + (customSplits[uid]?.percentage || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setFormError(`Split percentages sum to ${sum.toFixed(1)}%, which must equal 100%`);
        return;
      }
    } else if (splitType === "SHARES") {
      const sum = selectedUserIds.reduce((acc, uid) => acc + (customSplits[uid]?.shares || 1), 0);
      if (sum <= 0) {
        setFormError("Total shares must be at least 1");
        return;
      }
    }

    try {
      const splitsPayload = selectedUserIds.map((userId) => {
        if (splitType === "EQUAL") {
          return { user_id: userId };
        } else if (splitType === "EXACT") {
          return { user_id: userId, amount_owed: customSplits[userId]?.amount || 0 };
        } else if (splitType === "PERCENTAGE") {
          return { user_id: userId, percentage: customSplits[userId]?.percentage || 0 };
        } else {
          return { user_id: userId, shares: customSplits[userId]?.shares || 1 };
        }
      });

      await createExpenseMutation.mutateAsync({
        title: data.title.trim(),
        amount: Number(data.amount),
        currency: group?.currency || "NPR",
        payer_id: data.payer_id || currentUser?.id,
        split_type: splitType,
        category: data.category as ExpenseCategory,
        notes: data.notes || null,
        splits: splitsPayload,
      });

      router.push(`/groups/${groupId}`);
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setFormError(error?.message || t("expenseFailedDefault"));
    }
  };

  if (groupLoading) return <NewExpenseSkeleton />;

  if (!group) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <Card className="p-8 max-w-md mx-auto border" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
          <p style={{ color: "var(--danger)" }}>{t("groupNotFoundShort")}</p>
          <Link href="/groups" className="mt-4 inline-block">
            <Button size="sm">{t("backToGroups")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const categoryOptions = [
    { value: "FOOD_AND_DRINK", label: t("catFood") },
    { value: "GROCERIES", label: t("catGroceries") },
    { value: "TRANSPORTATION", label: t("catTransportation") },
    { value: "ENTERTAINMENT", label: t("catEntertainment") },
    { value: "RENT", label: t("catRent") },
    { value: "UTILITIES", label: t("catUtilities") },
    { value: "TRAVEL", label: t("catTravel") },
    { value: "SHOPPING", label: t("catShopping") },
    { value: "HEALTH", label: t("catHealth") },
    { value: "GENERAL", label: t("catGeneral") },
  ];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Link href={`/groups/${groupId}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {t("addExpenseTitle")}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {t("addExpenseDesc")} {group.name}
          </p>
        </div>
      </div>

      <Card
        className="border shadow-sm"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <CardContent className="p-6 sm:p-8 space-y-6">
          {formError && (
            <Alert variant="error" title={t("submissionError")}>
              {formError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <Input
                label={t("expenseTitleLabel")}
                placeholder={t("expenseTitlePlaceholder")}
                error={errors.title?.message}
                {...register("title")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`${t("totalAmountLabel")} (${group.currency})`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  icon={<Banknote className="h-4 w-4" />}
                  error={errors.amount?.message}
                  {...register("amount")}
                />

                <Select
                  label={t("categoryLabel")}
                  options={categoryOptions}
                  error={errors.category?.message}
                  {...register("category")}
                />
              </div>

              <Select
                label={t("paidByLabel")}
                options={group.members.map((m) => ({
                  value: m.user_id,
                  label: `${m.first_name || m.email} (${m.email})`,
                }))}
                emptyMessage={t("noMembersForSplit")}
                error={errors.payer_id?.message}
                {...register("payer_id")}
              />

              <Input
                label={t("notesLabel")}
                placeholder={t("notesPlaceholder")}
                error={errors.notes?.message}
                {...register("notes")}
              />
            </div>

            {/* Split Configuration */}
            <div className="pt-4 border-t space-y-4" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="text-sm font-semibold flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <Calculator className="h-4 w-4 text-indigo-500" />
                    {t("splitConfigTitle")}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {t("splitConfigDesc")}
                  </p>
                </div>

                <Badge variant="outline" className="text-xs">
                  {selectedUserIds.length} {t("ofMembers")} {group.members.length} {t("groupMembers2")}
                </Badge>
              </div>

              {/* Split Type Selector */}
              <div className="grid grid-cols-4 gap-2">
                {(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"] as SplitType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSplitType(type)}
                    className="rounded-xl py-2 px-3 text-xs font-semibold transition-all border cursor-pointer"
                    style={
                      splitType === type
                        ? {
                            background: "var(--accent-subtle)",
                            color: "var(--accent)",
                            borderColor: "var(--accent)",
                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                          }
                        : {
                            background: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            borderColor: "var(--border-default)",
                          }
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Participant List */}
              <div className="space-y-2 mt-4">
                {group.members.length === 0 ? (
                  <div
                    className="p-6 text-center rounded-xl border text-xs"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {t("noMembersForSplit")}
                  </div>
                ) : (
                  group.members.map((member) => {
                    const isSelected = selectedUserIds.includes(member.user_id);
                    const equalShare =
                      totalAmount > 0 && selectedUserIds.length > 0
                        ? (totalAmount / selectedUserIds.length).toFixed(2)
                        : "0.00";

                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-3 rounded-xl border transition-all"
                        style={
                          isSelected
                            ? { background: "var(--bg-surface)", borderColor: "var(--border-default)" }
                            : { background: "var(--bg-elevated)", borderColor: "var(--border-subtle)", opacity: 0.5 }
                        }
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleParticipant(member.user_id)}
                            className="h-4 w-4 rounded cursor-pointer"
                            style={{ accentColor: "var(--accent)" }}
                          />
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border"
                            style={{
                              background: "var(--bg-elevated)",
                              borderColor: "var(--border-default)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {getInitials(member.first_name || member.email)}
                          </div>
                          <div>
                            <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                              {member.first_name || "Member"}
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {member.email}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            {splitType === "EQUAL" && (
                              <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                                {formatCurrency(equalShare, group.currency)}
                              </span>
                            )}

                            {splitType === "EXACT" && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {group.currency}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="w-24 rounded-lg border px-2.5 py-1 text-xs text-right focus:outline-none"
                                  style={{
                                    background: "var(--bg-elevated)",
                                    borderColor: "var(--border-default)",
                                    color: "var(--text-primary)",
                                  }}
                                  value={customSplits[member.user_id]?.amount ?? ""}
                                  onChange={(e) =>
                                    handleCustomValueChange(member.user_id, "amount", parseFloat(e.target.value) || 0)
                                  }
                                />
                              </div>
                            )}

                            {splitType === "PERCENTAGE" && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="1"
                                  placeholder="%"
                                  className="w-16 rounded-lg border px-2 py-1 text-xs text-right focus:outline-none"
                                  style={{
                                    background: "var(--bg-elevated)",
                                    borderColor: "var(--border-default)",
                                    color: "var(--text-primary)",
                                  }}
                                  value={customSplits[member.user_id]?.percentage ?? ""}
                                  onChange={(e) =>
                                    handleCustomValueChange(member.user_id, "percentage", parseFloat(e.target.value) || 0)
                                  }
                                />
                                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>%</span>
                              </div>
                            )}

                            {splitType === "SHARES" && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="1"
                                  placeholder="1"
                                  className="w-16 rounded-lg border px-2 py-1 text-xs text-right focus:outline-none"
                                  style={{
                                    background: "var(--bg-elevated)",
                                    borderColor: "var(--border-default)",
                                    color: "var(--text-primary)",
                                  }}
                                  value={customSplits[member.user_id]?.shares ?? 1}
                                  onChange={(e) =>
                                    handleCustomValueChange(member.user_id, "shares", parseInt(e.target.value) || 1)
                                  }
                                />
                                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {t("shares")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className="flex items-center justify-end gap-3 pt-4 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Link href={`/groups/${groupId}`}>
                <Button type="button" variant="ghost">
                  {t("cancel")}
                </Button>
              </Link>
              <Button type="submit" size="lg" isLoading={createExpenseMutation.isPending}>
                {t("saveAndSplit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
