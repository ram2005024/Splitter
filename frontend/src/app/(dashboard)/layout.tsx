"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppHeader } from "@/components/layout/app-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div
        className="flex min-h-screen flex-col transition-colors duration-200"
        style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
      >
        <AppHeader />
        <main className="flex-1 pb-16">{children}</main>

        {/* Site footer */}
        <footer
          className="border-t py-5 px-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Left: brand */}
            <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
              &copy; {new Date().getFullYear()} Splitter. All rights reserved.
            </p>

            {/* Right: author credit */}
            <p
              className="text-[11px] tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Created by{" "}
              <span
                className="font-semibold footer-credit-name"
                style={{ color: "var(--text-secondary)" }}
              >
                Cyrus
              </span>
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
