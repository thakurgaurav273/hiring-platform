"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarClock,
  ChartColumn,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
  SquareKanban,
  UsersRound,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/login.schema";
import { authService } from "@/services/api/auth.service";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: SquareKanban, title: "Visual pipeline", text: "Move candidates through every stage at a glance." },
  { icon: CalendarClock, title: "Interview scheduling", text: "Coordinate panels and collect feedback in one place." },
  { icon: UsersRound, title: "Employee referrals", text: "Let your team refer the people they trust." },
  { icon: ChartColumn, title: "Hiring reports", text: "Track funnel health and time-to-hire." },
];

const inputClass =
  "peer w-full h-11 pl-10 text-[14px] text-gray-900 bg-white border rounded-lg outline-none transition placeholder:text-gray-400 " +
  "focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10 disabled:bg-gray-50 disabled:text-gray-500";

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
      useAppStore.getState().setAuth(response.data.user, response.data.accessToken);
      toast.success(`Welcome back, ${response.data.user.firstName}!`);
      router.replace("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to sign in. Please check your credentials."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1319] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:p-3">
      {/* ── Brand panel ─────────────────────────────────────────── */}
      <section
        aria-label="About Grovyn Talent"
        className="relative overflow-hidden bg-gradient-to-br from-[#18242A] via-[#111C21] to-[#0B1319] text-white lg:rounded-2xl"
      >
        {/* Decorative background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#0F766E]/30 blur-[120px]" />
          <div className="absolute -bottom-40 right-[-120px] h-[380px] w-[380px] rounded-full bg-[#34C759]/15 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse at 30% 30%, black 20%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 30% 30%, black 20%, transparent 75%)",
            }}
          />
        </div>

        <div className="relative flex h-full flex-col px-6 py-6 sm:px-10 lg:px-12 lg:py-12">
          <Brand />

          {/* Desktop-only marketing content */}
          <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:py-12">
            <h1 className="font-display text-[44px] font-bold leading-[1.08] tracking-tight xl:text-[52px]">
              Great people
              <br />
              build great <span className="text-[#34C759]">teams.</span>
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">
              Streamline hiring, empower your teams, and drive impact together, all from one workspace.
            </p>

            <ul className="mt-10 grid max-w-md gap-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                    <Icon className="h-[18px] w-[18px] text-[#34C759]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-white/60">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="hidden items-center gap-2 text-[12px] font-medium text-white/60 lg:flex">
            <ShieldCheck className="h-4 w-4 text-[#34C759]" aria-hidden="true" />
            Secure. Private. Trusted by our teams.
          </p>
        </div>
      </section>

      {/* ── Form panel ──────────────────────────────────────────── */}
      <section className="relative -mt-4 flex min-h-[calc(100vh-72px)] items-center justify-center rounded-t-3xl bg-white px-6 py-12 sm:px-10 lg:mt-0 lg:min-h-0 lg:rounded-none lg:bg-transparent lg:py-8">
        <div className="w-full max-w-[400px] lg:rounded-2xl lg:bg-white lg:p-10 lg:shadow-2xl lg:shadow-black/30 xl:p-12">
          <h2 className="font-display text-[28px] font-bold tracking-tight text-gray-900 lg:text-[30px]">
            Welcome back
          </h2>
          <p className="mt-1.5 text-[14px] text-gray-500">Sign in to your Grovyn workspace.</p>

          {serverError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700"
            >
              <CircleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                Work email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoFocus
                  placeholder="you@company.com"
                  disabled={busy}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn(
                    inputClass,
                    "pr-4",
                    errors.email ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200"
                  )}
                  {...register("email", { onChange: clearServerError })}
                />
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#0F766E]"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-[12px] font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-[13px] font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="rounded text-[13px] font-semibold text-[#0F766E] hover:text-[#0D635C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/40"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={busy}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={cn(
                    inputClass,
                    "pr-11",
                    errors.password ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200"
                  )}
                  {...register("password", { onChange: clearServerError })}
                />
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#0F766E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/40"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-[12px] font-medium text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <label htmlFor="rememberMe" className="flex w-fit cursor-pointer select-none items-center gap-2.5">
              <input
                id="rememberMe"
                type="checkbox"
                disabled={busy}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/40 focus-visible:ring-offset-2"
                {...register("rememberMe")}
              />
              <span className="text-[13px] font-medium text-gray-600">Keep me signed in</span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#0D635C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0F766E]/30 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {redirecting ? "Redirecting…" : "Signing in…"}
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 border-t border-gray-100 pt-6 text-center text-[13px] text-gray-500">
            Access is by invitation only. Ask your administrator if you need an account.
          </p>

          <p className="mt-6 flex items-center justify-center gap-2 text-[12px] text-gray-400 lg:hidden">
            <ShieldCheck className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            Secure. Private. Trusted by our teams.
          </p>
        </div>
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/grovyn-logo-transparent.png"
        alt=""
        width={40}
        height={40}
        priority
        className="h-9 w-9 object-contain lg:h-10 lg:w-10"
      />
      <div>
        <p className="font-display text-[17px] font-bold leading-none tracking-tight">Grovyn Talent</p>
        <p className="mt-1 text-[12px] font-medium text-white/60">Internal Hiring Platform</p>
      </div>
    </div>
  );
}
