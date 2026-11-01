"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/login.schema";
import { authService } from "@/services/api/auth.service";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { AuthAlert, AuthButton, AuthHeading, AuthInput, AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  // Signed-in users have no reason to see this page.
  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const busy = isSubmitting || redirecting;
  const clearServerError = () => serverError && setServerError(null);

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await authService.login(data);
      if (!response.success) {
        setServerError(response.message || "Unable to sign in. Please try again.");
        return;
      }
      setRedirecting(true);
      // The workspace carries the organization's branding, so the theme
      // switches to it as soon as the session is stored.
      useAppStore.getState().setAuth(response.data.user, response.data.accessToken, response.data.workspace);
      toast.success(`Welcome back, ${response.data.user.firstName}!`);
      router.replace("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof Error && error.message ? error.message : "Unable to sign in. Please check your credentials."
      );
    }
  };

  return (
    <AuthShell>
      <AuthHeading title="Sign in" description={`Welcome back to ${PLATFORM_BRANDING.productName}.`} />

      {serverError && (
        <div className="mt-6">
          <AuthAlert>{serverError}</AuthAlert>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
        <AuthInput
          id="email"
          label="Work email"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="username"
          autoFocus
          placeholder="you@company.com"
          disabled={busy}
          error={errors.email?.message}
          {...register("email", { onChange: clearServerError })}
        />

        <AuthInput
          id="password"
          label="Password"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={busy}
          error={errors.password?.message}
          labelAction={
            <Link
              href="/forgot-password"
              className="rounded text-[13px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Forgot password?
            </Link>
          }
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register("password", { onChange: clearServerError })}
        />

        <label htmlFor="rememberMe" className="flex w-fit cursor-pointer select-none items-center gap-2.5">
          <input
            id="rememberMe"
            type="checkbox"
            disabled={busy}
            className="h-4 w-4 cursor-pointer rounded border-border accent-[var(--color-primary)]"
            {...register("rememberMe")}
          />
          <span className="text-[13px] text-muted-foreground">Keep me signed in</span>
        </label>

        <AuthButton type="submit" loading={busy} loadingText={redirecting ? "Redirecting…" : "Signing in…"}>
          Sign in
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </AuthButton>
      </form>

      <p className="mt-7 border-t border-border pt-5 text-center text-[13px] text-muted-foreground">
        Access is by invitation only. Ask your administrator if you need an account.
      </p>
    </AuthShell>
  );
}
