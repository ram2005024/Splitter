"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useMyGroups } from "@/features/groups/hooks";
import { useGroupBalances } from "@/features/expenses/hooks";
import { useSimplifyDebts } from "@/features/settlements/hooks";
import { useLanguage } from "@/providers/language-provider";
import { RecordSettlementDialog } from "@/components/settlements/record-settlement-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Scale,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function GroupBalanceSectionSkeleton() {
  return (
    <div
      className="rounded-2xl border p-6 space-y-6 shadow-xl"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}
          >
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Settlement Rows */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

function GroupBalanceSection({
  groupId,
  groupName,
  currency,
}: {
  groupId: string;
  groupName: string;
  currency: string;
}) {
  const currentUser = useAuthStore((state) => state.user);
  const { t } = useLanguage();
  const { data: balanceSummary, isLoading: balancesLoading } = useGroupBalances(groupId);
  const { data: debtSimplification, isLoading: debtsLoading } = useSimplifyDebts(groupId);

  const [settleOpen, setSettleOpen] = useState(false);
  const [settleReceiverId, setSettleReceiverId] = useState<string | undefined>(undefined);
  const [settleAmount, setSettleAmount] = useState<number | undefined>(undefined);

  const myBalance = balanceSummary?.balances.find((b) => b.user_id === currentUser?.id);
  const netAmount = myBalance ? Number(myBalance.net_balance) : 0;
  const isOwed = netAmount > 0.005;
  const isOwing = netAmount < -0.005;

  const myTransfersToPay = debtSimplification?.simplified_transactions?.filter(
    (tx) => tx.payer_id === currentUser?.id
  );
  const myTransfersToReceive = debtSimplification?.simplified_transactions?.filter(
    (tx) => tx.receiver_id === currentUser?.id
  );

  if (balancesLoading) {
    return <GroupBalanceSectionSkeleton />;
  }

  return (
    <div
      className="rounded-2xl border p-6 space-y-6 shadow-xl"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
    >
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {groupName}
            </h3>
            <Badge variant="outline">{currency}</Badge>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {t("totalSpending")}:{" "}
            {formatCurrency(balanceSummary?.total_group_spending || 0, currency)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/groups/${groupId}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              {t("goToGroup")}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => {
              setSettleReceiverId(myTransfersToPay?.[0]?.receiver_id);
              setSettleAmount(myTransfersToPay?.[0] ? Number(myTransfersToPay[0].amount) : undefined);
              setSettleOpen(true);
            }}
          >
            {t("recordPayment")}
          </Button>
        </div>
      </div>

      {/* Net Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="group relative p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {t("youAreOwed")}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-2 tracking-tight">
            {isOwed ? formatCurrency(netAmount, currency) : formatCurrency(0, currency)}
          </p>
        </div>

        <div
          className="group relative p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {t("youOwe")}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <ArrowDownLeft className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-500 mt-2 tracking-tight">
            {isOwing ? formatCurrency(Math.abs(netAmount), currency) : formatCurrency(0, currency)}
          </p>
        </div>

        <div
          className="group relative p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {t("netPosition")}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
              <Scale className="h-3.5 w-3.5" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold mt-2 tracking-tight ${
              isOwed ? "text-emerald-500" : isOwing ? "text-rose-500" : ""
            }`}
            style={!isOwed && !isOwing ? { color: "var(--text-primary)" } : {}}
          >
            {isOwed && "+"}
            {formatCurrency(netAmount, currency)}
          </p>
        </div>
      </div>

      {/* Suggested Simplified Transfers for the user */}
      <div className="space-y-3 pt-2">
        <h4
          className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
          {t("optimalSteps")}
        </h4>

        {debtsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : (!myTransfersToPay || myTransfersToPay.length === 0) &&
          (!myTransfersToReceive || myTransfersToReceive.length === 0) ? (
          <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>
            {t("allSettled")}
          </p>
        ) : (
          <div className="space-y-2">
            {myTransfersToPay?.map((tx, idx) => (
              <div
                key={`pay-${idx}`}
                className="flex items-center justify-between p-3.5 rounded-xl border"
                style={{
                  borderColor: "rgba(244,63,94,0.25)",
                  background: "rgba(244,63,94,0.06)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <ArrowDownLeft className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {t("youOweTo")}{" "}
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {tx.receiver_name}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rose-500">
                    {formatCurrency(tx.amount, currency)}
                  </span>
                  <Button
                    size="sm"
                    className="h-8 text-xs px-2.5"
                    onClick={() => {
                      setSettleReceiverId(tx.receiver_id);
                      setSettleAmount(Number(tx.amount));
                      setSettleOpen(true);
                    }}
                  >
                    {t("pay")}
                  </Button>
                </div>
              </div>
            ))}

            {myTransfersToReceive?.map((tx, idx) => (
              <div
                key={`rec-${idx}`}
                className="flex items-center justify-between p-3.5 rounded-xl border"
                style={{
                  borderColor: "rgba(16,185,129,0.25)",
                  background: "rgba(16,185,129,0.06)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {tx.payer_name}
                    </span>{" "}
                    {t("owesYou")}
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-500">
                  {formatCurrency(tx.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settle Dialog */}
      <RecordSettlementDialog
        groupId={groupId}
        currency={currency}
        members={balanceSummary?.balances.map((b) => ({
          id: b.user_id,
          user_id: b.user_id,
          role: "MEMBER",
          first_name: b.user_name,
          email: b.email,
          joined_at: "",
        })) || []}
        currentUserId={currentUser?.id}
        defaultReceiverId={settleReceiverId}
        defaultAmount={settleAmount}
        isOpen={settleOpen}
        onClose={() => setSettleOpen(false)}
      />
    </div>
  );
}

export default function BalancesPage() {
  const { data: groups, isLoading } = useMyGroups();
  const { t } = useLanguage();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      <div
        className="pb-6 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5"
          style={{ color: "var(--text-primary)" }}
        >
          <Scale className="h-7 w-7" style={{ color: "var(--accent)" }} />
          {t("navBalances")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("balancesSubtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <GroupBalanceSectionSkeleton />
          <GroupBalanceSectionSkeleton />
        </div>
      ) : !groups || groups.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center shadow-xl"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          <Users
            className="mx-auto h-12 w-12 mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("noGroupsFound")}
          </h3>
          <p className="mt-1 text-xs max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
            {t("noGroupsDesc")}
          </p>
          <Link href="/groups" className="mt-4 inline-block">
            <Button size="sm">{t("navGroups")}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <GroupBalanceSection
              key={group.id}
              groupId={group.id}
              groupName={group.name}
              currency={group.currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
