"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMyGroups } from "@/features/groups/hooks";
import { useLanguage } from "@/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { JoinGroupDialog } from "@/components/groups/join-group-dialog";
import {
  Users,
  PlusCircle,
  KeyRound,
  ArrowRight,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

function GroupsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="rounded-2xl border p-6 flex flex-col justify-between space-y-5"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded-md mt-2" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
          <div
            className="pt-4 border-t flex items-center justify-between"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GroupsPage() {
  const { data: groups, isLoading, error } = useMyGroups();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const filteredGroups = groups?.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.invite_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t("expenseGroups")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("expenseGroupsDesc")}
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
            {t("joinByCode")}
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-2 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            {t("createGroup")}
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="max-w-md">
        <Input
          placeholder={t("searchGroupPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Group Cards Grid */}
      {isLoading ? (
        <GroupsSkeleton />
      ) : error ? (
        <Card
          className="p-6 text-center border"
          style={{
            borderColor: "rgba(239, 68, 68, 0.2)",
            background: "var(--bg-surface)",
            color: "var(--text-danger)",
          }}
        >
          {t("failedToLoadGroups")}
        </Card>
      ) : !filteredGroups || filteredGroups.length === 0 ? (
        <Card
          className="p-12 text-center border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <Users
            className="mx-auto h-12 w-12 mb-3 opacity-40"
            style={{ color: "var(--text-secondary)" }}
          />
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {searchTerm ? t("noMatchingGroups") : t("noGroupsJoined")}
          </h3>
          <p
            className="mt-1 text-xs max-w-sm mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            {searchTerm ? t("noMatchingGroupsDesc") : t("noGroupsJoinedDesc")}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              {t("createGroup")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)}>
              {t("joinWithCode")}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => (
            <Card
              key={group.id}
              className="group relative flex flex-col justify-between p-6 transition-all shadow-sm hover:shadow-md border"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="capitalize text-xs font-medium">
                    {group.group_type}
                  </Badge>

                  <button
                    onClick={() => handleCopyCode(group.invite_code)}
                    title="Click to copy invite code"
                    className="flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer"
                    style={{
                      background: "var(--accent-subtle)",
                      color: "var(--accent)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    {copiedCode === group.invite_code ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500">{t("copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>{t("inviteCode")}: {group.invite_code}</span>
                      </>
                    )}
                  </button>
                </div>

                <h3
                  className="mt-3 text-lg font-semibold transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  {group.name}
                </h3>

                {group.description && (
                  <p
                    className="mt-1 text-xs line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {group.description}
                  </p>
                )}

                <p
                  className="mt-3 text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("createdOn")} {formatDate(group.created_at)}
                </p>
              </div>

              <div
                className="mt-6 pt-4 border-t flex items-center justify-between"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div
                  className="flex items-center gap-3 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 opacity-60" />
                    {group.members_count} {t("membersCount")}
                  </span>
                  <span>&bull;</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {group.currency}
                  </span>
                </div>

                <Link href={`/groups/${group.id}`}>
                  <Button size="sm" className="gap-1.5 text-xs">
                    {t("viewDetails")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

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
