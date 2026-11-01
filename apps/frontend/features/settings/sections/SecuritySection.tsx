"use client";

import { errorMessage } from "@/lib/error-message";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/api/auth.service";
import { useAppStore } from "@/store/app.store";
import { SectionHeader, SettingsCard, SettingsField } from "@/features/settings/SettingsSections";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters").max(128, "Keep it under 128 characters"),
    confirmPassword: z.string().min(1, "Re-enter the new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })
  .refine((d) => d.newPassword !== d.currentPassword, { message: "Choose a password you haven't been using", path: ["newPassword"] });
type Values = z.infer<typeof schema>;

/** Guidance only: the server requires 8+ characters, the rest are recommendations. */
const CHECKS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8, required: true },
  { label: "Upper- and lower-case letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordInput({ id, autoComplete, invalid, describedBy, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; describedBy?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="input pr-10"
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function SecuritySection() {
  const email = useAppStore((s) => s.authUser?.email);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });

  const change = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      reset();
      toast.success("Password changed. Use the new one next time you sign in.");
    },
    onError: (e) => {
      const msg = errorMessage(e, "Couldn't change your password");
      if (/old password|current password/i.test(msg)) {
        setError("currentPassword", { message: "That isn't your current password" }, { shouldFocus: true });
      } else {
        toast.error(msg);
      }
    },
  });

  const pw = watch("newPassword") ?? "";
  const score = CHECKS.filter((c) => c.test(pw)).length;
  const strength = pw.length === 0 ? null : score <= 1 ? "Weak" : score <= 3 ? "Fair" : "Strong";

  return (
    <div>
      <SectionHeader title="Password & security" description="Keep your account secure with a strong password you don't use anywhere else." />

      <form onSubmit={handleSubmit((v) => change.mutate(v))} noValidate>
        {/* Lets password managers associate the new password with the account. */}
        <input type="text" name="username" autoComplete="username" value={email ?? ""} readOnly hidden />
        <SettingsCard
          title="Change password"
          description="You'll need your current password."
          footer={
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={change.isPending}>
                {change.isPending && <Loader2 className="animate-spin" />} Update password
              </Button>
            </div>
          }
        >
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
            <div className="space-y-5">
              <SettingsField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
                <PasswordInput id="currentPassword" autoComplete="current-password" invalid={!!errors.currentPassword} describedBy={errors.currentPassword ? "currentPassword-error" : undefined} {...register("currentPassword")} />
              </SettingsField>
              <SettingsField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
                <PasswordInput id="newPassword" autoComplete="new-password" invalid={!!errors.newPassword} describedBy={errors.newPassword ? "newPassword-error" : "password-checks"} {...register("newPassword")} />
              </SettingsField>
              <SettingsField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <PasswordInput id="confirmPassword" autoComplete="new-password" invalid={!!errors.confirmPassword} describedBy={errors.confirmPassword ? "confirmPassword-error" : undefined} {...register("confirmPassword")} />
              </SettingsField>
            </div>

            <div id="password-checks" className="rounded-lg border border-border bg-surface-2/60 p-4 md:self-start">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium">Strength</span>
                <span
                  className={cn(
                    "text-[12px] font-medium",
                    strength === "Strong" ? "text-success" : strength === "Fair" ? "text-warning" : strength === "Weak" ? "text-destructive" : "text-muted-foreground"
                  )}
                  aria-live="polite"
                >
                  {strength ?? "–"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 rounded-full",
                      i < score ? (score <= 1 ? "bg-destructive" : score <= 3 ? "bg-warning" : "bg-success") : "bg-border"
                    )}
                  />
                ))}
              </div>
              <ul className="mt-3 space-y-1.5 text-[12px]">
                {CHECKS.map((c) => {
                  const ok = c.test(pw);
                  return (
                    <li key={c.label} className={cn("flex items-center gap-2", ok ? "text-foreground" : "text-muted-foreground")}>
                      <span
                        className={cn("grid size-4 shrink-0 place-items-center rounded-full border", ok ? "border-success bg-success text-white" : "border-border-strong")}
                        aria-hidden="true"
                      >
                        {ok && <Check className="size-2.5" />}
                      </span>
                      <span className="min-w-0">
                        {c.label}
                        {c.required && <span className="ml-1 text-[11px] text-muted-foreground">(required)</span>}
                      </span>
                      <span className="sr-only">{ok ? "met" : "not met"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </SettingsCard>
      </form>
    </div>
  );
}
