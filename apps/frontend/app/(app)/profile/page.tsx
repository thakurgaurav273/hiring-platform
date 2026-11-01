"use client";

import { PageHeader, Avatar } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { Guard } from "@/components/access-restricted";
import { BackButton } from "@/components/back-button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Edit3, Save, Lock } from "lucide-react";
import { Skeleton } from "@/components/skeletons";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { usersService } from "@/services/api/users.service";
import { profileSchema, type ProfileFormValues } from "@/lib/schemas/profile.schema";
import Link from "next/link";
import { Card, Field } from "@/features/profile/ProfileSections";
import { Role } from "@/constants/enums";

export default function ProfilePage() {
  return (
    <Guard section="profile">
      <ProfileInner />
    </Guard>
  );
}

function ProfileInner() {
  const user = useAppStore((s) => s.user)();
  const [ui, setUi] = useState({ editing: false, loading: true, skillInput: "" });
  useEffect(() => { const t = setTimeout(() => setUi(p => ({ ...p, loading: false })), 450); return () => clearTimeout(t); }, []);

  const { register, handleSubmit, watch, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      address: user.address ?? "",
      title: user.title ?? "",
      department: user.department ?? "",
    },
  });

  const currentProfile = watch();
  const updateAuthUser = useAppStore(s => s.updateAuthUser);

  const { mutate, isPending } = useMutation({
    mutationFn: usersService.updateProfile,
    onSuccess: (data) => {
      setUi(p => ({ ...p, editing: false }));
      updateAuthUser({
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title,
        department: data.department,
        phone: data.phone,
        address: data.address,
      });
      toast.success("Profile saved successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  });

  const save: SubmitHandler<ProfileFormValues> = (data) => {
    const parts = data.name.trim().split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "";
    mutate({
      firstName,
      lastName,
      title: data.title,
      department: data.department,
      phone: data.phone,
      address: data.address,
    });
  };

  const readOnly = !ui.editing;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Account" }, { label: "Profile" }]}
        title="Your profile"
        actions={
          <div className="flex items-center gap-3">
            <Link href="/settings/change-password" className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium hover:bg-secondary">
              <Lock className="h-3.5 w-3.5" /> Change Password
            </Link>
            {ui.editing ? (
              <button onClick={handleSubmit(save)} className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90">
                <Save className="h-3.5 w-3.5" /> Save Changes
              </button>
            ) : (
              <button onClick={() => setUi(p => ({ ...p, editing: true }))} className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium hover:bg-secondary">
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </button>
            )}
          </div>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 space-y-4">
        <div className="mb-2 sm:mb-0">
          <BackButton fallback="/settings" label="Back to Settings" />
        </div>
        {ui.loading && <Skeleton.ProfilePage />}
        {!ui.loading && <>
          {/* Header card */}
          <div className="surface-card p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Avatar name={currentProfile.name} seed={currentProfile.email} size={80} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-[22px] font-semibold tracking-tight">{currentProfile.name}</div>
                <div className="text-[13px] text-muted-foreground">{currentProfile.title}</div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                  <span>{currentProfile.email}</span><span>·</span>
                  <span>{currentProfile.phone}</span><span>·</span>
                  <span>{currentProfile.address}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {user.role !== Role.ADMINISTRATOR && currentProfile.department && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-primary)]">{currentProfile.department}</span>
                )}
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{user.role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <Card title="Basic information">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Full name"><input readOnly={readOnly} {...register("name")} className="input" /></Field>
              <Field label="Email"><input readOnly type="email" {...register("email")} className="input bg-secondary/50 text-muted-foreground cursor-not-allowed" /></Field>
              <Field label="Job Title"><input readOnly={readOnly} {...register("title")} className="input" /></Field>
              <Field label="Contact Number"><input readOnly={readOnly} {...register("phone")} className="input" /></Field>
              {user.role !== Role.ADMINISTRATOR && (
                <Field label="Department"><input readOnly={readOnly} {...register("department")} className="input" placeholder="e.g. Design, Engineering" /></Field>
              )}
              <div className="md:col-span-2">
                <Field label="Address"><input readOnly={readOnly} {...register("address")} className="input" /></Field>
              </div>
            </div>
          </Card>
        </>}
      </div>

      <style>{`.input { height: 40px; width: 100%; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); padding: 0 12px; font-size: 13px; outline: none; } .input:focus { border-color: var(--color-ring); }`}</style>
    </div>
  );
}
