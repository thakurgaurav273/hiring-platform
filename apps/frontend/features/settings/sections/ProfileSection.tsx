"use client";

import { errorMessage } from "@/lib/error-message";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { usersService } from "@/services/api/users.service";
import { Role } from "@/constants/enums";
import { useMe } from "@/hooks/useMe";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FormFooter,
  ROLE_LABELS,
  SectionHeader,
  SettingsCard,
  SettingsField,
  useUnsavedChangesWarning,
} from "@/features/settings/SettingsSections";

const schema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(80, "Keep it under 80 characters"),
  lastName: z.string().trim().max(80, "Keep it under 80 characters"),
  title: z.string().trim().max(120, "Keep it under 120 characters"),
  department: z.string().trim().max(80, "Keep it under 80 characters"),
  phone: z
    .string()
    .trim()
    .max(40, "Keep it under 40 characters")
    .refine((v) => v === "" || /^[+()\d\s.-]{6,}$/.test(v), "Use digits, spaces and + ( ) - only"),
  address: z.string().trim().max(240, "Keep it under 240 characters"),
});
type Values = z.infer<typeof schema>;

export function ProfileSection() {
  const authUser = useAppStore((s) => s.authUser);
  const updateAuthUser = useAppStore((s) => s.updateAuthUser);
  const workspace = useAppStore((s) => s.workspace);
  const isAdmin = authUser?.role === Role.ADMINISTRATOR;
  const me = useMe();

  const fromUser = (): Values => ({
    firstName: authUser?.firstName ?? "",
    lastName: authUser?.lastName ?? "",
    title: authUser?.title ?? "",
    department: authUser?.department ?? "",
    phone: authUser?.phone ?? "",
    address: authUser?.address ?? "",
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: fromUser() });

  // Pick up changes made elsewhere (e.g. the profile page) when nothing is being edited.
  useEffect(() => {
    if (!isDirty) reset(fromUser());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);
  useUnsavedChangesWarning(isDirty);

  const save = useMutation({
    mutationFn: (v: Values) =>
      usersService.updateProfile({
        firstName: v.firstName,
        lastName: v.lastName,
        title: v.title,
        ...(isAdmin ? {} : { department: v.department }),
        phone: v.phone,
        address: v.address,
      }),
    onSuccess: (data) => {
      updateAuthUser({
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title,
        department: data.department,
        phone: data.phone,
        address: data.address,
      });
      reset({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        title: data.title ?? "",
        department: data.department ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
      });
      toast.success("Profile saved");
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save your profile")),
  });

  if (!authUser) return null;
  if (me.isLoading) {
    return (
      <div>
        <SectionHeader title="Profile" description="How you appear to teammates across the workspace, in interview invites and on activity." />
        <div className="space-y-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }
  const first = watch("firstName");
  const last = watch("lastName");
  const title = watch("title");
  const displayName = `${first} ${last}`.trim() || authUser.email;
  const err = (k: keyof Values) => errors[k]?.message;
  const describe = (k: keyof Values) => (errors[k] ? `${k}-error` : undefined);

  return (
    <div>
      <SectionHeader title="Profile" description="How you appear to teammates across the workspace, in interview invites and on activity." />

      <div className="space-y-6">
        <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <Avatar name={displayName} seed={authUser.email} size={64} url={authUser.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[19px] font-semibold tracking-tight">{displayName}</div>
            <div className="truncate text-[13px] text-muted-foreground">
              {title || "No job title yet"}
              {workspace && <> · {workspace.branding.displayName}</>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" aria-hidden="true" /> {authUser.email}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                {ROLE_LABELS[authUser.role] ?? authUser.role}
              </span>
              {!isAdmin && authUser.department && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{authUser.department}</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
          <SettingsCard
            title="Personal details"
            description="Your email is your sign-in and can't be changed here. Ask an administrator if it needs updating."
            footer={<FormFooter dirty={isDirty} saving={save.isPending} onDiscard={() => reset(fromUser())} />}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <SettingsField label="First name" htmlFor="firstName" error={err("firstName")}>
                <input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} aria-describedby={describe("firstName")} className="input" {...register("firstName")} />
              </SettingsField>
              <SettingsField label="Last name" htmlFor="lastName" error={err("lastName")} optional>
                <input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} aria-describedby={describe("lastName")} className="input" {...register("lastName")} />
              </SettingsField>
              <SettingsField label="Job title" htmlFor="title" error={err("title")} optional>
                <input id="title" autoComplete="organization-title" placeholder="e.g. Talent Partner" aria-invalid={!!errors.title} aria-describedby={describe("title")} className="input" {...register("title")} />
              </SettingsField>
              {isAdmin ? (
                <SettingsField label="Email" htmlFor="email">
                  <input id="email" value={authUser.email} readOnly className="input cursor-not-allowed bg-secondary/50 text-muted-foreground" />
                </SettingsField>
              ) : (
                <SettingsField
                  label="Department"
                  htmlFor="department"
                  error={err("department")}
                  hint="Decides which jobs and reports you see."
                  optional
                >
                  <input id="department" placeholder="e.g. Engineering" aria-invalid={!!errors.department} aria-describedby={errors.department ? "department-error" : "department-hint"} className="input" {...register("department")} />
                </SettingsField>
              )}
              <SettingsField label="Phone" htmlFor="phone" error={err("phone")} optional>
                <input id="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" aria-invalid={!!errors.phone} aria-describedby={describe("phone")} className="input" {...register("phone")} />
              </SettingsField>
              {!isAdmin && (
                <SettingsField label="Email" htmlFor="email">
                  <input id="email" value={authUser.email} readOnly className="input cursor-not-allowed bg-secondary/50 text-muted-foreground" />
                </SettingsField>
              )}
              <SettingsField label="Address" htmlFor="address" error={err("address")} optional className="sm:col-span-2">
                <input id="address" autoComplete="street-address" aria-invalid={!!errors.address} aria-describedby={describe("address")} className="input" {...register("address")} />
              </SettingsField>
            </div>
          </SettingsCard>
        </form>
      </div>
    </div>
  );
}
