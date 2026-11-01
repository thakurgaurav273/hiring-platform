"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/services/api/auth.service";
import {
  AuthButton,
  AuthHeading,
  AuthInput,
  AuthLoading,
  AuthShell,
  AuthStatus,
} from "@/components/auth/auth-shell";

const resetPasswordSchema = z
  .object({
    password: z.string().min(10, "Password must be at least 10 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) return;
    try {
      await authService.resetPassword(token, data.password);
      setDone(true);
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Failed to reset password");
    }
  };

  if (!token) {
    return (
      <AuthStatus
        tone="error"
        title="Invalid link"
        action={<AuthButton onClick={() => router.push("/forgot-password")}>Request a new link</AuthButton>}
      >
        This password reset link is invalid or has expired. Please request a new one.
      </AuthStatus>
    );
  }

  if (done) {
    return (
      <AuthStatus
        tone="success"
        title="Password updated"
        action={<AuthButton onClick={() => router.push("/login")}>Back to sign in</AuthButton>}
      >
        You can now sign in with your new password.
      </AuthStatus>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="mb-6 inline-flex w-fit items-center gap-2 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
      <AuthHeading title="Set a new password" description="Use at least 10 characters with numbers and symbols." />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        <AuthInput
          id="password"
          label="New password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.password?.message}
          {...register("password")}
        />
        <AuthInput
          id="confirmPassword"
          label="Confirm new password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <AuthButton type="submit" loading={isSubmitting} loadingText="Updating…">
          Update password
        </AuthButton>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthLoading label="Loading…" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
