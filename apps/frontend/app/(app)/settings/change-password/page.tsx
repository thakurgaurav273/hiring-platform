"use client";

import { PageHeader } from "@/components/app-shell";
import { Guard } from "@/components/access-restricted";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/api/auth.service";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ChangePasswordPage() {
  return (
    <Guard section="settings">
      <ChangePasswordInner />
    </Guard>
  );
}

function ChangePasswordInner() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success("Password updated successfully");
      router.push("/settings");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  });

  const onSubmit = (data: PasswordFormValues) => {
    mutate(data);
  };

  return (
    <div>
      <PageHeader 
        breadcrumbs={[{ label: "Settings" }, { label: "Change Password" }]} 
        title="Change Password" 
      />

      <div className="mx-auto max-w-xl px-4 py-6 md:px-8">
        <button 
          onClick={() => router.back()} 
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to settings
        </button>

        <div className="surface-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">Current Password</label>
              <input 
                type="password" 
                {...register("currentPassword")} 
                className={`h-10 w-full rounded-lg border px-3 text-[13px] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary ${errors.currentPassword ? 'border-destructive bg-destructive/5' : 'border-border bg-surface'}`}
                placeholder="Enter current password"
              />
              {errors.currentPassword && <p className="mt-1 text-[11.5px] text-destructive">{errors.currentPassword.message}</p>}
            </div>

            <div className="h-px bg-border my-2" />

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">New Password</label>
              <input 
                type="password" 
                {...register("newPassword")} 
                className={`h-10 w-full rounded-lg border px-3 text-[13px] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary ${errors.newPassword ? 'border-destructive bg-destructive/5' : 'border-border bg-surface'}`}
                placeholder="Enter new password"
              />
              {errors.newPassword && <p className="mt-1 text-[11.5px] text-destructive">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">Re-type New Password</label>
              <input 
                type="password" 
                {...register("confirmPassword")} 
                className={`h-10 w-full rounded-lg border px-3 text-[13px] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary ${errors.confirmPassword ? 'border-destructive bg-destructive/5' : 'border-border bg-surface'}`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && <p className="mt-1 text-[11.5px] text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-[13px] font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50 w-full sm:w-auto"
              >
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
