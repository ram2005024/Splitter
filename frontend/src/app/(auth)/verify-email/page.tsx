"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema, VerifyEmailFormData } from "@/features/auth/schemas";
import { useVerifyEmail, useResendVerification } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, KeyRound } from "lucide-react";
import { NormalizedError } from "@/lib/api/errors";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailParam,
      code: "",
    },
  });

  const currentEmail = watch("email");

  const onSubmit = async (data: VerifyEmailFormData) => {
    setVerifyError(null);
    setResendSuccess(null);
    try {
      await verifyMutation.mutateAsync(data);
      router.push("/login?verified=true");
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setVerifyError(error?.message || "Invalid verification code. Please check and try again.");
    }
  };

  const handleResend = async () => {
    if (!currentEmail) {
      setVerifyError("Please enter your registered email address.");
      return;
    }
    setVerifyError(null);
    setResendSuccess(null);
    try {
      await resendMutation.mutateAsync(currentEmail);
      setResendSuccess("A new verification code has been dispatched to your email.");
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setVerifyError(error?.message || "Failed to resend verification code. Please wait a moment.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 6-digit verification code sent to your registered email address
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {verifyError && (
            <Alert variant="error" title="Verification Failed">
              {verifyError}
            </Alert>
          )}

          {resendSuccess && (
            <Alert variant="success" title="Code Resent">
              {resendSuccess}
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
              label="6-Digit OTP Code"
              type="text"
              placeholder="123456"
              maxLength={8}
              className="tracking-widest text-center text-lg font-mono"
              error={errors.code?.message}
              {...register("code")}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={verifyMutation.isPending}
            >
              Verify &amp; Activate Account
            </Button>
          </form>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {resendMutation.isPending ? "Resending code..." : "Resend code"}
            </button>

            <Link
              href="/login"
              className="transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
