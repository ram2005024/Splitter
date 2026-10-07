"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { LogoIcon } from "@/components/ui/logo";
import { NormalizedError } from "@/lib/api/errors";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";
  const verified = searchParams.get("verified") === "true";

  const [authError, setAuthError] = useState<string | null>(null);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      await loginMutation.mutateAsync(data);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as NormalizedError;
      if (error?.status === 403 && error?.message?.toLowerCase().includes("verify")) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        setAuthError(error?.message || "Invalid credentials. Please try again.");
      }
    }
  };

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 transition-colors"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <Card
        className="w-full max-w-md border shadow-xl"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center">
            <LogoIcon size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Welcome Back
          </CardTitle>
          <CardDescription style={{ color: "var(--text-secondary)" }}>
            Sign in to manage and split your group expenses
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {sessionExpired && (
            <Alert variant="warning" title="Session Expired">
              Your secure session has expired. Please log in again to continue.
            </Alert>
          )}

          {verified && (
            <Alert variant="success" title="Email Verified">
              Your account has been verified! You can now log in below.
            </Alert>
          )}

          {authError && (
            <Alert variant="error" title="Login Failed">
              {authError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="alice@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--accent)" }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </form>

          <div className="text-center text-xs pt-2" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
