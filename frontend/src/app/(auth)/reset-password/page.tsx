"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordFormData } from "@/features/auth/schemas";
import { useResetPassword } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, KeyRound, Lock } from "lucide-react";
import { NormalizedError } from "@/lib/api/errors";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [resetError, setResetError] = useState<string | null>(null);
  const resetMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      code: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setResetError(null);
    try {
      await resetMutation.mutateAsync(data);
      router.push("/login?verified=true");
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setResetError(error?.message || "Password reset failed. Please verify the OTP code.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
          <CardDescription>
            Enter the reset OTP sent to your email and your new password
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {resetError && (
            <Alert variant="error" title="Reset Failed">
              {resetError}
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

            <Input
              label="Reset Code (OTP)"
              type="text"
              placeholder="123456"
              icon={<KeyRound className="h-4 w-4" />}
              error={errors.code?.message}
              {...register("code")}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Min. 8 characters"
              icon={<Lock className="h-4 w-4" />}
              error={errors.new_password?.message}
              {...register("new_password")}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              icon={<Lock className="h-4 w-4" />}
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={resetMutation.isPending}
            >
              Reset &amp; Save Password
            </Button>
          </form>

          <div className="text-center text-xs pt-2" style={{ color: "var(--text-muted)" }}>
            <Link
              href="/login"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
