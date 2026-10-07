"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useGroupDetails } from "@/features/groups/hooks";
import { useGroupExpenses } from "@/features/expenses/hooks";
import { useGroupBalances } from "@/features/expenses/hooks";
import { useSimplifyDebts } from "@/features/settlements/hooks";
import { useLanguage } from "@/providers/language-provider";
import { AddMemberDialog } from "@/components/groups/add-member-dialog";
import { RecordSettlementDialog } from "@/components/settlements/record-settlement-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  PlusCircle,
  Receipt,
  Scale,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

function GroupDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div
        className="rounded-2xl border p-6 sm:p-8 space-y-6"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-6 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-64 sm:w-80 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-md" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        <div
          className="pt-6 border-t grid grid-cols-2 sm:grid-cols-4 gap-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border p-5 flex items-center justify-between"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const currentUser = useAuthStore((state) => state.user);
  const { t } = useLanguage();

  const { data: group, isLoading: groupLoading } = useGroupDetails(groupId);
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses(groupId);
  const { data: balanceSummary, isLoading: balancesLoading } = useGroupBalances(groupId);
  const { data: debtSimplification, isLoading: debtsLoading } = useSimplifyDebts(groupId);

  const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "debts" | "members">("expenses");
  const [copiedCode, setCopiedCode] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleReceiverId, setSettleReceiverId] = useState<string | undefined>(undefined);
  const [settleAmount, setSettleAmount] = useState<number | undefined>(undefined);

  const handleCopyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleOpenSettle = (receiverId?: string, amount?: number) => {
    setSettleReceiverId(receiverId);
    setSettleAmount(amount);
    setSettleOpen(true);
  };

  if (groupLoading) {
    return <GroupDetailSkeleton />;
  }

  if (!group) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 text-center">
        <Card
          className="p-8 max-w-md mx-auto border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {t("groupNotFound")}
          </h2>
          <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            {t("groupNotFoundDesc")}
          </p>
          <Link href="/groups" className="mt-4 inline-block">
            <Button size="sm">{t("backToGroups")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const tabStyle = (tab: string) =>
    activeTab === tab
      ? {
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }
      : { color: "var(--text-secondary)" };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      {/* Group Header Hero */}
      <div
        className="rounded-2xl border p-6 sm:p-8 shadow-sm"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="capitalize text-xs font-medium">
                {group.group_type}
              </Badge>
              <button
                onClick={handleCopyInviteCode}
                className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
                style={{
                  background: "var(--accent-subtle)",
                  color: "var(--accent)",
                  borderColor: "var(--border-subtle)",
                }}
                title="Click to copy invite code"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-sans font-medium">{t("inviteCodeCopied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t("inviteCodeLabel2")}: {group.invite_code}</span>
                  </>
                )}
              </button>
            </div>

            <h1
              className="text-2xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {group.name}
            </h1>

            {group.description && (
              <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
                {group.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs pt-1" style={{ color: "var(--text-muted)" }}>
              <span>{group.members.length} {t("groupMembers2")}</span>
              <span>&bull;</span>
              <span>{t("groupCurrencyLabel")}: {group.currency}</span>
              <span>&bull;</span>
              <span>{t("createdAtLabel")} {formatDate(group.created_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setAddMemberOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {t("addMember")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleOpenSettle()} className="gap-2">
              <Scale className="h-4 w-4" />
              {t("settleDebt")}
            </Button>
            <Link href={`/groups/${group.id}/expenses/new`}>
              <Button size="sm" className="gap-2 shadow-sm">
                <PlusCircle className="h-4 w-4" />
                {t("addExpense")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        {balanceSummary && (
          <div
            className="mt-8 pt-6 border-t grid grid-cols-2 sm:grid-cols-4 gap-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                {t("totalGroupSpending")}
              </span>
              <p className="text-xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(balanceSummary.total_group_spending, group.currency)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                {t("totalSettled")}
              </span>
              <p className="text-xl font-bold text-emerald-500 mt-0.5">
                {formatCurrency(balanceSummary.total_settled, group.currency)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                {t("recordedExpenses")}
              </span>
              <p className="text-xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                {expenses?.length || 0}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                {t("simplificationStatus")}
              </span>
              <p className="text-xl font-bold mt-0.5" style={{ color: "var(--accent)" }}>
                {debtSimplification?.simplified_transactions?.length ?? 0} {t("transfersLeft")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 border-b pb-2 overflow-x-auto"
        style={{ borderColor: "var(--border-default)" }}
      >
        {(["expenses", "balances", "debts", "members"] as const).map((tab) => {
          const icons = {
            expenses: <Receipt className="h-4 w-4" />,
            balances: <Scale className="h-4 w-4" />,
            debts: <Sparkles className="h-4 w-4 text-indigo-500" />,
            members: <Users className="h-4 w-4" />,
          };
          const labels = {
            expenses: `${t("tabExpenses")} (${expenses?.length || 0})`,
            balances: t("tabBalances"),
            debts: t("tabDebts"),
            members: `${t("tabMembers")} (${group.members.length})`,
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
              style={tabStyle(tab)}
            >
              {icons[tab]}
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* TAB: Expenses */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("recordedExpensesTitle")}
            </h3>
            <Link href={`/groups/${group.id}/expenses/new`}>
              <Button size="sm" className="gap-1.5 text-xs">
                <PlusCircle className="h-3.5 w-3.5" />
                {t("addNewExpense")}
              </Button>
            </Link>
          </div>

          {expensesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border p-5 flex items-center justify-between"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40 rounded" />
                      <Skeleton className="h-3 w-56 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded" />
                </div>
              ))}
            </div>
          ) : !expenses || expenses.length === 0 ? (
            <Card
              className="p-12 text-center border"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
            >
              <Receipt className="mx-auto h-12 w-12 mb-3 opacity-40" style={{ color: "var(--text-secondary)" }} />
              <h4 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {t("noExpensesYet")}
              </h4>
              <p className="mt-1 text-xs max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
                {t("noExpensesDesc")}
              </p>
              <Link href={`/groups/${group.id}/expenses/new`} className="mt-4 inline-block">
                <Button size="sm">{t("addExpense")}</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <Link key={expense.id} href={`/groups/${group.id}/expenses/${expense.id}`} className="block">
                  <Card
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border transition-all gap-4 shadow-sm hover:shadow-md"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0 border"
                        style={{
                          background: "var(--bg-elevated)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--accent)",
                        }}
                      >
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {expense.title}
                          </h4>
                          <Badge variant="outline" className="text-[10px] py-0 px-2 capitalize">
                            {expense.category.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {t("paidBy")}{" "}
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                            {expense.payer_name}
                          </span>{" "}
                          &bull; {formatDate(expense.date)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <div className="text-left sm:text-right">
                        <span className="text-xs uppercase block" style={{ color: "var(--text-muted)" }}>
                          {t("splitType")} ({expense.split_type})
                        </span>
                        <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Member Balances */}
      {activeTab === "balances" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("netBalancesBreakdown")}
          </h3>

          {balancesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border p-5 space-y-4"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : !balanceSummary || balanceSummary.balances.length === 0 ? (
            <Card
              className="p-8 text-center border"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
            >
              {t("noBalanceData")}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {balanceSummary.balances.map((b) => {
                const net = Number(b.net_balance);
                const isPositive = net > 0.005;
                const isNegative = net < -0.005;

                return (
                  <Card
                    key={b.user_id}
                    className="p-5 border"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold border"
                          style={{
                            background: "var(--bg-elevated)",
                            borderColor: "var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {getInitials(b.user_name)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {b.user_name}
                          </h4>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {b.email}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                          {t("netBalance")}
                        </span>
                        <span
                          className={`text-base font-bold flex items-center justify-end gap-1 ${
                            isPositive ? "text-emerald-500" : isNegative ? "text-rose-500" : ""
                          }`}
                          style={!isPositive && !isNegative ? { color: "var(--text-secondary)" } : {}}
                        >
                          {isPositive && <ArrowUpRight className="h-4 w-4" />}
                          {isNegative && <ArrowDownLeft className="h-4 w-4" />}
                          {formatCurrency(Math.abs(net), group.currency)}
                        </span>
                      </div>
                    </div>

                    <div
                      className="mt-4 pt-3 border-t flex items-center justify-between text-xs"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                    >
                      <span>{t("totalPaid")}: {formatCurrency(b.total_paid, group.currency)}</span>
                      <span>{t("totalOwed")}: {formatCurrency(b.total_owed, group.currency)}</span>
                    </div>

                    {isNegative && b.user_id === currentUser?.id && (
                      <div className="mt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleOpenSettle(undefined, Math.abs(net))}
                        >
                          {t("settleMyShare")}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: Debt Simplification */}
      {activeTab === "debts" && (
        <div className="space-y-4">
          <div>
            <h3
              className="text-base font-semibold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
              {t("debtSimplificationTitle")}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {t("debtSimplificationDesc")}
            </p>
          </div>

          {debtsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border p-5 flex items-center justify-between"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : !debtSimplification || debtSimplification.simplified_transactions?.length === 0 ? (
            <Card
              className="p-12 text-center border"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
            >
              <Scale className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
              <h4 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {t("allDebtsSettled")}
              </h4>
              <p className="mt-1 text-xs max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
                {t("allDebtsSettledDesc")}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {debtSimplification.simplified_transactions?.map((tx, idx) => {
                const isCurrentUserPayer = tx.payer_id === currentUser?.id;

                return (
                  <Card
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border gap-4"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold border"
                        style={{
                          background: "var(--bg-elevated)",
                          borderColor: "var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {getInitials(tx.payer_name)}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {tx.payer_name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {t("owes")}
                      </span>
                      <ArrowRight className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold border"
                        style={{
                          background: "var(--bg-elevated)",
                          borderColor: "var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {getInitials(tx.receiver_name)}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {tx.receiver_name}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <span className="text-lg font-bold text-emerald-500">
                        {formatCurrency(tx.amount, debtSimplification.currency)}
                      </span>
                      {isCurrentUserPayer && (
                        <Button size="sm" onClick={() => handleOpenSettle(tx.receiver_id, Number(tx.amount))}>
                          {t("settleNow")}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: Members */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("groupMembersTitle")}
            </h3>
            <Button size="sm" onClick={() => setAddMemberOpen(true)} className="gap-1.5 text-xs">
              <UserPlus className="h-3.5 w-3.5" />
              {t("addMember")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {group.members.map((member) => (
              <Card
                key={member.id}
                className="p-4 border"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-xs border"
                      style={{
                        background: "var(--accent-subtle)",
                        color: "var(--accent)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      {getInitials(member.first_name || member.email)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {member.first_name ? `${member.first_name} ${member.last_name || ""}` : "Member"}
                      </h4>
                      <p
                        className="text-xs truncate max-w-[160px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <Badge variant={member.role === "ADMIN" ? "info" : "outline"} className="text-[10px]">
                    {member.role}
                  </Badge>
                </div>
                <div
                  className="mt-3 pt-2 border-t text-[10px]"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
                >
                  {t("joined")} {formatDate(member.joined_at)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddMemberDialog
        groupId={group.id}
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
      />

      <RecordSettlementDialog
        groupId={group.id}
        currency={group.currency}
        members={group.members}
        currentUserId={currentUser?.id}
        defaultReceiverId={settleReceiverId}
        defaultAmount={settleAmount}
        isOpen={settleOpen}
        onClose={() => setSettleOpen(false)}
      />
    </div>
  );
}
