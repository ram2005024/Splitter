"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useExpenseDetail, useDeleteExpense } from "@/features/expenses/hooks";
import { useGroupDetails } from "@/features/groups/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, Receipt, Calendar, User, Tag, FileText } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { NormalizedError } from "@/lib/api/errors";

function ExpenseDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </div>

      <div
        className="rounded-2xl border p-6 sm:p-8 space-y-6"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center justify-between pb-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <Skeleton className="h-8 w-60 rounded-lg" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-3 w-16 ml-auto rounded" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>

        <div className="pt-2 space-y-3">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const { groupId, expenseId } = use(params);
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const { data: expense, isLoading: expenseLoading } = useExpenseDetail(groupId, expenseId);
  const { data: group } = useGroupDetails(groupId);
  const deleteMutation = useDeleteExpense(groupId);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isPayer = expense?.payer_id === currentUser?.id;
  const isGroupAdmin = group?.creator_id === currentUser?.id;
  const canDelete = isPayer || isGroupAdmin;

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(expenseId);
      router.push(`/groups/${groupId}`);
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setDeleteError(error?.message || "Failed to delete expense.");
    }
  };

  if (expenseLoading) {
    return <ExpenseDetailSkeleton />;
  }

  if (!expense) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <Card
          className="p-8 max-w-md mx-auto border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Expense Not Found
          </h2>
          <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            This expense does not exist or may have been deleted.
          </p>
          <Link href={`/groups/${groupId}`} className="mt-4 inline-block">
            <Button size="sm">Back to Group</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/groups/${groupId}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Expense Breakdown
            </h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Recorded in {group?.name || "Group"}
            </p>
          </div>
        </div>

        {canDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </div>

      {/* Main Expense Card */}
      <Card
        className="border shadow-sm p-6 sm:p-8 space-y-6"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {expense.category.replace(/_/g, " ")}
              </Badge>
              <Badge variant="info">Split: {expense.split_type}</Badge>
            </div>
            <h2
              className="text-2xl font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              {expense.title}
            </h2>
          </div>

          <div className="text-left sm:text-right">
            <span
              className="text-xs uppercase tracking-wider block"
              style={{ color: "var(--text-muted)" }}
            >
              Total Amount
            </span>
            <span
              className="text-3xl font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(expense.amount, expense.currency)}
            </span>
          </div>
        </div>

        {/* Expense Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div
            className="flex items-center gap-2.5 p-3 rounded-xl border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <User className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <span className="block text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>
                Paid By
              </span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {expense.payer_name}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-2.5 p-3 rounded-xl border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <span className="block text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>
                Date Incurred
              </span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {formatDate(expense.date)}
              </span>
            </div>
          </div>
        </div>

        {expense.notes && (
          <div
            className="p-4 rounded-xl border text-xs space-y-1"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <span
              className="font-medium uppercase text-[10px] flex items-center gap-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <FileText className="h-3.5 w-3.5" />
              Notes
            </span>
            <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {expense.notes}
            </p>
          </div>
        )}

        {/* Participant Split Breakdown */}
        <div className="pt-2 space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Participant Shares
          </h3>

          <div className="space-y-2">
            {expense.splits.map((split) => {
              const isPayer = split.user_id === expense.payer_id;

              return (
                <div
                  key={split.id}
                  className="flex items-center justify-between p-3 rounded-xl border"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold border"
                      style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {getInitials(split.user_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {split.user_name}
                        </span>
                        {isPayer && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500/30 text-emerald-500">
                            Payer
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {split.user_email}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className="text-sm font-bold block"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatCurrency(split.amount_owed, expense.currency)}
                    </span>
                    {split.percentage && (
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {split.percentage}%
                      </span>
                    )}
                    {split.shares && (
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {split.shares} shares
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This will recalculate member balances."
      >
        {deleteError && (
          <Alert variant="error" title="Delete Failed" className="mb-4">
            {deleteError}
          </Alert>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Confirm Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
