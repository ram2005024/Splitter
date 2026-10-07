"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormData } from "@/features/auth/schemas";
import { useRegister } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { User as UserIcon, Mail, Lock } from "lucide-react";
import { LogoIcon } from "@/components/ui/logo";
import { NormalizedError } from "@/lib/api/errors";

export default function RegisterPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitError(null);
    try {
      await registerMutation.mutateAsync(data);
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setSubmitError(error?.message || "Registration failed. Please verify your details.");
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
            Create an Account
          </CardTitle>
          <CardDescription style={{ color: "var(--text-secondary)" }}>
            Start splitting and settling shared expenses in seconds
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {submitError && (
            <Alert variant="error" title="Registration Failed">
              {submitError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Alice"
                icon={<UserIcon className="h-4 w-4" />}
                error={errors.first_name?.message}
                {...register("first_name")}
              />
              <Input
                label="Last Name"
                placeholder="Smith"
                error={errors.last_name?.message}
                {...register("last_name")}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="alice@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password1?.message}
              {...register("password1")}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password2?.message}
              {...register("password2")}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={registerMutation.isPending}
            >
              Sign Up
            </Button>
          </form>

          <div className="text-center text-xs pt-2" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              Log in
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
