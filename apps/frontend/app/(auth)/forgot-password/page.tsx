"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WaveDivider } from "@/assets/svgs/wave-divider";
import { authService } from "@/services/api/auth.service";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [ui, setUi] = useState({ sent: false, submittedEmail: "", isSubmitting: false });
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    try {
      setUi({ ...ui, isSubmitting: true });
      await authService.forgotPassword(data.email);
      setUi({ submittedEmail: data.email, sent: true, isSubmitting: false });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
      setUi({ ...ui, isSubmitting: false });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0B1319] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[540px] bg-white rounded-[24px] overflow-hidden shadow-2xl relative flex flex-col">

        {/* Top Background Half with Wave */}
        <div className="relative h-[250px] w-full bg-gradient-to-br from-[#18242A] to-[#0E1519]">
          <div className="absolute top-8 left-8 flex items-center gap-2 text-white">
            <img src="/grovyn-logo-transparent.png" alt="Logo" width={22} height={22} className="object-contain drop-shadow-md" />
            <span className="font-display font-semibold tracking-wide text-[16px] drop-shadow-md">Grovyn</span>
          </div>
          <WaveDivider />
        </div>

        {/* Overlapping center badge */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[240px] -translate-y-1/2 w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 z-10">
          <img src="/grovyn-logo-transparent.png" alt="Logo" width={34} height={34} className="object-contain" />
        </div>

        {/* Bottom White Half */}
        <div className="pt-14 pb-12 px-8 md:px-12 bg-white relative z-0 flex flex-col">
          {!ui.sent ? (
            <>
              <Link href="/login" className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition mb-6 w-fit">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>

              <h1 className="font-display text-[24px] font-bold tracking-tight text-gray-900">Reset your password</h1>
              <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">
                Enter the email tied to your Grovyn workspace and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register("email")}
                    placeholder="you@company.com"
                    type="email"
                    className="w-full h-[46px] pl-10 pr-4 text-[14px] bg-white border border-gray-200 rounded-lg outline-none transition focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}

                <button
                  type="submit"
                  disabled={ui.isSubmitting}
                  className="h-[46px] w-full rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-[14px] font-medium text-white shadow-sm transition mt-2 disabled:opacity-50"
                >
                  {ui.isSubmitting ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center pt-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="font-display text-[24px] font-bold tracking-tight text-gray-900">Check your inbox</h2>
              <p className="mt-3 text-[14px] text-gray-500 leading-relaxed mx-auto max-w-[320px]">
                If an account exists with this email, a password reset link has been sent to <span className="font-medium text-gray-900">{ui.submittedEmail || "your email"}</span>. It expires in 24 hours.
              </p>

              <div className="mt-8 space-y-3">
                <button onClick={() => router.push("/login")} className="h-[46px] w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[14px] font-medium transition shadow-sm">
                  Back to login
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
