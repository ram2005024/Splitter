"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/features/auth/hooks";
import { useTheme } from "@/providers/theme-provider";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import { LogoIcon } from "@/components/ui/logo";
import { getInitials } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Scale,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Languages,
} from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const navLinks: { nameKey: TranslationKey; href: string; icon: React.ElementType }[] = [
    { nameKey: "navDashboard", href: "/dashboard", icon: LayoutDashboard },
    { nameKey: "navGroups", href: "/groups", icon: Users },
    { nameKey: "navBalances", href: "/balances", icon: Scale },
    { nameKey: "navProfile", href: "/profile", icon: UserIcon },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand: signature S monogram logo */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
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
                style={{ color: "var(--text-link)" }}
              >
                {t("navWorkspace")}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all"
                  style={{
                    background: isActive ? "var(--bg-elevated)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: isActive ? "var(--border-default)" : "transparent",
                  }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
                  />
                  {t(item.nameKey)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: language switch + theme toggle + user menu */}
        <div className="relative flex items-center gap-2">
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
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all hover:bg-[var(--bg-elevated)] active:scale-95 cursor-pointer"
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

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 rounded-full border p-1.5 pr-3 text-left transition-colors focus:outline-none hover:bg-[var(--bg-elevated)] cursor-pointer"
              style={{ borderColor: "var(--border-default)" }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-xs font-semibold text-white shadow-inner">
                {getInitials(user?.full_name)}
              </div>
              <span
                className="hidden sm:inline-block text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.first_name || "Account"}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5"
                style={{ color: "var(--text-muted)" }}
              />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div
                  className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border p-2 shadow-2xl animate-scaleUp"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border-default)",
                  }}
                >
                  <div
                    className="px-3 py-2 border-b mb-1"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user?.full_name}
                    </p>
                    <p
                      className="text-[11px] truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {user?.email}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors hover:bg-[var(--bg-elevated)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <UserIcon
                      className="h-4 w-4"
                      style={{ color: "var(--text-muted)" }}
                    />
                    {t("navManageProfile")}
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logoutMutation.mutate();
                    }}
                    disabled={logoutMutation.isPending}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    {logoutMutation.isPending ? t("loggingOut") : t("navLogout")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div
        className="flex md:hidden border-t px-2 py-1 justify-around"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-surface)",
        }}
      >
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors"
              style={{
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon className="h-4 w-4" />
              {t(item.nameKey)}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
