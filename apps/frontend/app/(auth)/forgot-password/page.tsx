"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authService } from "@/services/api/auth.service";
import { AuthButton, AuthHeading, AuthInput, AuthShell, AuthStatus } from "@/components/auth/auth-shell";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    try {
      await authService.forgotPassword(data.email);
      setSentTo(data.email);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Failed to send reset link");
    }
  };

  return (
    <AuthShell>
      {sentTo === null ? (
        <>
          <Link
            href="/login"
            className="mb-6 inline-flex w-fit items-center gap-2 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
          <AuthHeading
            title="Reset your password"
            description="Enter the email for your workspace account and we'll send you a reset link."
          />
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
            <AuthInput
              id="email"
              label="Work email"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              autoFocus
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />
            <AuthButton type="submit" loading={isSubmitting} loadingText="Sending…">
              Send reset link
            </AuthButton>
          </form>
        </>
      ) : (
        <AuthStatus
          tone="success"
          title="Check your inbox"
          action={
            <AuthButton variant="outline" onClick={() => router.push("/login")}>
              Back to sign in
            </AuthButton>
          }
        >
          If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, we&apos;ve sent a
          password reset link. It expires in 24 hours.
        </AuthStatus>
      )}
    </AuthShell>
  );
}
