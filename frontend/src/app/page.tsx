"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
  PieChart,
  Users,
  Receipt,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div
      className="flex min-h-screen flex-col transition-colors duration-200"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="info" className="mb-6 px-3 py-1 gap-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Gen Financial Splitter &amp; Settlement Engine
          </Badge>

          <h1
            className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
            style={{ color: "var(--text-primary)" }}
          >
            Split group bills effortlessly.{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
              Settle with mathematical elegance.
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Eliminate messy IOUs, awkward dinner calculations, and circular debt webs. Splitter tracks
            shared expenses with exact penny precision and simplifies balances into the minimum transfers.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto gap-2 px-8 shadow-md">
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                Sign In to Workspace
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <Card
              className="border transition-all shadow-sm hover:shadow-md"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
            >
              <CardHeader className="space-y-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  <PieChart className="h-5 w-5" />
                </div>
                <CardTitle className="text-base" style={{ color: "var(--text-primary)" }}>
                  Multiple Split Types
                </CardTitle>
                <CardDescription className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Equal split with penny-rounding, exact amounts, percentages, or proportional shares.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="border transition-all shadow-sm hover:shadow-md"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
            >
              <CardHeader className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Scale className="h-5 w-5" />
                </div>
                <CardTitle className="text-base" style={{ color: "var(--text-primary)" }}>
                  Debt Simplification
                </CardTitle>
                <CardDescription className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Greedy cash-flow algorithm minimizes transfers so 10 debts settle in 2 clean payments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="border transition-all shadow-sm hover:shadow-md"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
            >
              <CardHeader className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                  <Users className="h-5 w-5" />
                </div>
                <CardTitle className="text-base" style={{ color: "var(--text-primary)" }}>
                  Collaborative Groups
                </CardTitle>
                <CardDescription className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Create groups with custom currencies, 8-character invite codes, or direct email invites.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="border transition-all shadow-sm hover:shadow-md"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
            >
              <CardHeader className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-base" style={{ color: "var(--text-primary)" }}>
                  Bank-Grade Security
                </CardTitle>
                <CardDescription className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  HttpOnly refresh cookies, rotating JWTs, Redis lockout protection, and instant revocation.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Algorithm Showcase */}
      <section
        id="algorithm"
        className="py-20 border-b"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="success" className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Algorithm Tested &amp; Proven
              </Badge>
              <h2
                className="text-3xl font-bold sm:text-4xl"
                style={{ color: "var(--text-primary)" }}
              >
                How Debt Simplification Works
              </h2>
              <p
                className="text-sm sm:text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Imagine Bob owes Alice $40, and Alice owes Charlie $40. Instead of 2 separate money
                transfers, our greedy graph reduction connects Bob directly to Charlie with a single $40
                payment.
              </p>
              <ul className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Calculates net credits and debits per user across all group expenses
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Sorts creditors and debtors and iteratively resolves maximal pairs
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Reduces transaction overhead, bank transfer fees, and group confusion
                </li>
              </ul>
            </div>

            <Card
              className="border p-8 shadow-sm"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
            >
              <div
                className="flex items-center justify-between pb-4 border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Example Trip Settlement
                </span>
                <Badge variant="outline" className="text-xs">
                  3 Transfers → 2 Transfers
                </Badge>
              </div>

              <div className="mt-6 space-y-3">
                <div
                  className="flex items-center justify-between rounded-xl border p-3 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>Bob</span>
                    <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>Charlie</span>
                  </div>
                  <span className="font-semibold text-emerald-500">$60.00</span>
                </div>

                <div
                  className="flex items-center justify-between rounded-xl border p-3 text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>David</span>
                    <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>Charlie</span>
                  </div>
                  <span className="font-semibold text-emerald-500">$40.00</span>
                </div>
              </div>

              <div
                className="mt-6 pt-4 border-t flex items-center justify-between text-xs"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Total Net Outstanding:</span>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                  $100.00 settled in 2 steps
                </span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="mt-auto border-t py-8 transition-colors"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-center gap-2">
            <LogoIcon size="sm" />
            <span>&copy; {new Date().getFullYear()} Splitter. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
              Login
            </Link>
            <Link href="/register" className="hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
              Sign Up
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || ""}/docs`}
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-secondary)" }}
            >
              API Swagger
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
