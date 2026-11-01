"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/services/api/auth.service";

const resetPasswordSchema = z.object({
  password: z.string().min(10, "Password must be at least 10 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const [ui, setUi] = useState({ done: false, isSubmitting: false });
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) return;

    try {
      setUi({ ...ui, isSubmitting: true });
      await authService.resetPassword(token, data.password);
      setUi({ done: true, isSubmitting: false });
      toast.success("Password updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
      setUi({ ...ui, isSubmitting: false });
    }
  };

  if (!token) {
    return (
      <div className="text-center pt-2 px-6 pb-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-6 mt-6">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="font-display text-[24px] font-bold tracking-tight text-gray-900">Invalid link</h2>
        <p className="mt-3 text-[14px] text-gray-500 leading-relaxed mx-auto max-w-[320px]">
          This password reset link is invalid or has expired. Please request a new one.
        </p>

        <div className="mt-8 space-y-3">
          <button onClick={() => router.push("/forgot-password")} className="h-[46px] w-full rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-[14px] font-medium text-white shadow-sm transition">
            Request new link
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!ui.done ? (
            <>
              <Link href="/login" className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition mb-6 w-fit">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>

              <h1 className="font-display text-[24px] font-bold tracking-tight text-gray-900">Set a new password</h1>
              <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">
                Use at least 10 characters with numbers and symbols.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...register("password")}
                      type="password"
                      placeholder="New password"
                      className="w-full h-[46px] pl-10 pr-4 text-[14px] bg-white border border-gray-200 rounded-lg outline-none transition focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...register("confirmPassword")}
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full h-[46px] pl-10 pr-4 text-[14px] bg-white border border-gray-200 rounded-lg outline-none transition focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-[11px] text-red-500">{errors.confirmPassword.message}</p>}
                </div>

                <button type="submit" disabled={ui.isSubmitting} className="h-[46px] w-full rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-[14px] font-medium text-white shadow-sm transition mt-2 disabled:opacity-50">
                  {ui.isSubmitting ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center pt-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="font-display text-[24px] font-bold tracking-tight text-gray-900">Password updated</h2>
              <p className="mt-3 text-[14px] text-gray-500 leading-relaxed mx-auto max-w-[320px]">
                You can now sign in with your new password.
              </p>

              <div className="mt-8 space-y-3">
                <button onClick={() => router.push("/login")} className="h-[46px] w-full rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-[14px] font-medium text-white shadow-sm transition">
                  Back to sign in
                </button>
              </div>
            </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen bg-[#0B1319] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[540px] bg-white rounded-[24px] overflow-hidden shadow-2xl relative flex flex-col">

        {/* Top Background Half with Wave */}
        <div className="relative h-[250px] w-full bg-gradient-to-br from-[#18242A] to-[#0E1519]">
          <div className="absolute top-8 left-8 flex items-center gap-2 text-white">
            <img src="/grovyn-logo-transparent.png" alt="Logo" width={22} height={22} className="object-contain drop-shadow-md" />
            <span className="font-display font-semibold tracking-wide text-[16px] drop-shadow-md">Grovyn</span>
          </div>
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[60px] text-white" fill="currentColor">
            <path d="M0,40 C480,100 960,0 1440,40 L1440,100 L0,100 Z" />
          </svg>
        </div>

        {/* Overlapping center badge */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[240px] -translate-y-1/2 w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 z-10">
          <img src="/grovyn-logo-transparent.png" alt="Logo" width={34} height={34} className="object-contain" />
        </div>

        <div className="pt-14 pb-12 px-8 md:px-12 bg-white relative z-0 flex flex-col">
          <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-gray-200"></div></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
