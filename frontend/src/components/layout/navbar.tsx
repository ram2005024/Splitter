"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/providers/theme-provider";
import { useLanguage } from "@/providers/language-provider";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, Sun, Moon, Languages } from "lucide-react";

export function Navbar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand: Shows signature S logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <LogoIcon size="md" />
          <div className="flex flex-col">
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Splitter
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Nepal
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/#features"
            className="transition-colors hover:opacity-100"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("navFeatures")}
          </Link>
          <Link
            href="/#algorithm"
            className="transition-colors hover:opacity-100"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("navDebtSimp")}
          </Link>
          <Link
            href="/#security"
            className="transition-colors hover:opacity-100"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("navSecurity")}
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          {/* Language Switcher Mode (Nepali & English) */}
          <button
            onClick={toggleLanguage}
            aria-label="Switch Language (English / नेपाली)"
            className="flex h-9 items-center gap-1.5 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--bg-elevated)] active:scale-95"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            title={language === "en" ? "नेपाली भाषामा स्विच गर्नुहोस्" : "Switch to English"}
          >
            <Languages className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>{language === "en" ? "ने" : "EN"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer hover:bg-[var(--bg-elevated)] active:scale-95"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                {t("navDashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("navLogin")}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-1.5">
                  {t("navSignup")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
