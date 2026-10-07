"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useMyGroups } from "@/features/groups/hooks";
import { useLanguage } from "@/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { JoinGroupDialog } from "@/components/groups/join-group-dialog";
import {
  Users,
  PlusCircle,
  KeyRound,
  ArrowRight,
  TrendingUp,
  Receipt,
  Scale,
} from "lucide-react";

function MetricCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-5 shadow-xl"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-9 w-16" />
      <Skeleton className="mt-2 h-3 w-44" />
    </div>
  );
}

function GroupCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-6 shadow-xl space-y-4"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="pt-3 border-t flex items-center justify-between"
        style={{ borderColor: "var(--border-subtle)" }}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: groups, isLoading, error } = useMyGroups();
  const { t } = useLanguage();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t("welcomeBack")}, {user?.first_name || t("friend")}
          </h1>
          <p className="mt-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
            {t("welcomeSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setJoinOpen(true)}
            className="gap-2"
          >
            <KeyRound className="h-4 w-4" />
            {t("joinWithCode")}
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-2 shadow-md hover:shadow-lg transition-all"
            style={{ boxShadow: "0 4px 14px var(--accent-shadow)" }}
          >
            <PlusCircle className="h-4 w-4" />
            {t("newGroup")}
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("activeGroups")}
                </span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "var(--bg-muted)", color: "var(--accent)" }}
                >
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span
                  className="text-3xl font-extrabold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {groups?.length || 0}
                </span>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {t("activeGroupsDesc")}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("settlementEngine")}
                </span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}
                >
                  <Scale className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--success)" }}
                >
                  Greedy Min-Cash-Flow
                </span>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {t("settlementEngineDesc")}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("baseCurrency")}
                </span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}
                >
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.profile?.default_currency || "NPR"}
                </span>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {t("baseCurrencyDesc")}
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Group List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {t("yourExpenseGroups")}
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {t("yourExpenseGroupsDesc")}
            </p>
          </div>

          <Link
            href="/groups"
            className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: "var(--text-link)" }}
          >
            {t("viewAllGroups")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <GroupCardSkeleton key={n} />
            ))}
          </div>
        ) : error ? (
          <Card
            className="p-6 text-center"
            style={{ borderColor: "rgba(244,63,94,0.3)", color: "var(--danger)" }}
          >
            {t("failedToLoadGroups")}
          </Card>
        ) : !groups || groups.length === 0 ? (
          <Card className="p-12 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
              style={{ background: "var(--bg-muted)", color: "var(--accent)" }}
            >
              <Receipt className="h-7 w-7" />
            </div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("noGroupsYet")}
            </h3>
            <p className="mt-1 text-xs max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
              {t("noGroupsYetDesc")}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                {t("createAGroup")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)}>
                {t("joinWithCode")}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="group/card relative flex flex-col justify-between p-6 hover:shadow-2xl transition-all"
                style={{ cursor: "default" }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline">
                      {group.group_type}
                    </Badge>
                    <span
                      className="font-mono text-[11px] px-2 py-0.5 rounded border"
                      style={{
                        color: "var(--text-link)",
                        background: "var(--bg-muted)",
                        borderColor: "var(--border-default)",
                      }}
                    >
                      {t("groupInviteCode")}: {group.invite_code}
                    </span>
                  </div>

                  <h3
                    className="mt-3 text-lg font-semibold transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {group.name}
                  </h3>

                  {group.description && (
                    <p className="mt-1 text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {group.description}
                    </p>
                  )}
                </div>

                <div
                  className="mt-6 pt-4 border-t flex items-center justify-between"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {group.members_count} {t("membersCount")}
                    </span>
                    <span>•</span>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                      {group.currency}
                    </span>
                  </div>

                  <Link href={`/groups/${group.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs font-semibold p-0"
                      style={{ color: "var(--text-link)" }}
                    >
                      {t("openGroup")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateGroupDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <JoinGroupDialog
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
      />
    </div>
  );
}
