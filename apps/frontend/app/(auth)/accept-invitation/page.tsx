"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, CheckCircle2, AlertCircle, User, Mail, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usersService } from "@/services/api/users.service";

const acceptInvitationSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;

function AcceptInvitationForm() {
  const [ui, setUi] = useState({ done: false, isSubmitting: false, loadingInvite: true, inviteError: false, email: "" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { register, handleSubmit, formState: { errors } } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { name: "", password: "" }
  });

  useEffect(() => {
    if (!token) {
      setUi(p => ({ ...p, loadingInvite: false, inviteError: true }));
      return;
    }

    usersService.getInvitation(token)
      .then(data => {
        setUi(p => ({ ...p, loadingInvite: false, email: data.email }));
      })
      .catch(() => {
        setUi(p => ({ ...p, loadingInvite: false, inviteError: true }));
      });
  }, [token]);

  const onSubmit = async (data: AcceptInvitationValues) => {
    if (!token) return;

    try {
      setUi(p => ({ ...p, isSubmitting: true }));
      await usersService.acceptInvitation(token, data);
      setUi(p => ({ ...p, done: true, isSubmitting: false }));
      toast.success("Account created successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to accept invitation");
      setUi(p => ({ ...p, isSubmitting: false }));
    }
  };

  if (ui.loadingInvite) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-500">Loading invitation...</p>
      </div>
    );
  }

  if (ui.inviteError) {
    return (
      <div className="text-center pt-2 px-6 pb-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-6 mt-6">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="font-display text-[24px] font-bold tracking-tight text-gray-900">Invalid link</h2>
        <p className="mt-3 text-[14px] text-gray-500 leading-relaxed mx-auto max-w-[320px]">
          This invitation link is invalid or has expired. Please ask your administrator to send a new one.
        </p>

        <div className="mt-8 space-y-3">
          <button onClick={() => router.push("/login")} className="h-[46px] w-full rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-[14px] font-medium text-white shadow-sm transition">
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!ui.done ? (
        <>
          <h1 className="font-display text-[24px] font-bold tracking-tight text-gray-900 mt-2">Set up your account</h1>
          <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">
            Welcome to Grovyn Talent. Please provide your details to complete setup.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  disabled
                  value={ui.email}
                  className="w-full h-[46px] pl-10 pr-4 text-[14px] bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Full name"
                  className="w-full h-[46px] pl-10 pr-4 text-[14px] bg-white border border-gray-200 rounded-lg outline-none transition focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] text-gray-900 placeholder:text-gray-400"
                />
              </div>
              {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Create a password"
                  className="w-full h-[46px] pl-10 pr-4 text-[14px] bg-white border border-gray-200 rounded-lg outline-none transition focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] text-gray-900 placeholder:text-gray-400"
                />
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
            </div>

            <button disabled={ui.isSubmitting} className="h-[46px] w-full rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-[14px] font-medium text-white shadow-sm transition disabled:opacity-50 mt-6 inline-flex items-center justify-center gap-2">
              {ui.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Accept Invitation
            </button>
          </form>
        </>
      ) : (
        <div className="text-center pt-2 px-6 pb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center mb-6 mt-6">
            <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
          </div>
          <h2 className="font-display text-[24px] font-bold tracking-tight text-gray-900">Account created</h2>
          <p className="mt-3 text-[14px] text-gray-500 leading-relaxed mx-auto max-w-[320px]">
            You have successfully set up your account. You can now sign in using your email and password.
          </p>

          <div className="mt-8">
            <button onClick={() => router.push("/login")} className="h-[46px] w-full rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-[14px] font-medium text-white shadow-sm transition">
              Go to Sign in
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 lg:p-10 shadow-xl border border-gray-100">
        <Suspense fallback={<div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
          <AcceptInvitationForm />
        </Suspense>
      </div>
    </div>
  );
}
