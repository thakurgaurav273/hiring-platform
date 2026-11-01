"use client";

import { Avatar } from "@/components/app-shell";
import { Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import { THEME_OPTIONS } from "@/constants/settings.constants";

/** Shared card wrapper used by all tab sections */
export function SettingsCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="text-[13px] font-semibold">{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Reusable form field label wrapper */
export function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/** Profile tab */
export function ProfileSection() {
  const user = useAppStore((s) => s.user)();
  return (
    <SettingsCard
      title="My Profile"
      action={
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-[13px] font-medium text-primary hover:underline">View profile</Link>
          <Link href="/settings/change-password" className="text-[13px] font-medium text-primary hover:underline">Change password</Link>
        </div>
      }
    >
      <div className="flex items-center gap-4 py-4 px-2">
        <Avatar name={user.name} seed={user.email} size={64} />
        <div>
          <h3 className="text-lg font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="mt-2 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-foreground">{user.role}</span>
        </div>
      </div>
    </SettingsCard>
  );
}

/** Theme tab */
export function ThemeSection() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  return (
    <SettingsCard title="Appearance">
      <div className="grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.i;
          const active = theme === opt.v;
          return (
            <button
              key={opt.v}
              onClick={() => { setTheme(opt.v); toast.success(`Theme: ${opt.l}`); }}
              className={
                "relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition " +
                (active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                  : "border-border bg-surface-2 hover:border-border-strong hover:bg-surface")
              }
            >
              <div className="flex w-full items-center justify-between">
                <div className={"grid h-8 w-8 place-items-center rounded-md " + (active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={"grid h-4 w-4 place-items-center rounded-full border " + (active ? "border-primary bg-primary" : "border-border-strong")}>
                  {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </span>
              </div>
              <div className="text-[13px] font-semibold">{opt.l}</div>
              <div className="text-[11.5px] leading-relaxed text-muted-foreground">{opt.d}</div>
            </button>
          );
        })}
      </div>
    </SettingsCard>
  );
}

const NOTIFICATION_PREFS = [
  { id: "newApplications", label: "New applications" },
  { id: "stageChanges", label: "Stage changes" },
  { id: "interviewReminders", label: "Interview reminders" }
] as const;

export function NotificationsSection() {
  const user = useAppStore((s) => s.user)();
  const updateAuthUser = useAppStore((s) => s.updateAuthUser);
  const prefs = user.notificationPreferences || {};

  const handleToggle = async (id: string, checked: boolean) => {
    const newPrefs = { ...prefs, [id]: checked };
    // Optimistically update the store
    updateAuthUser({ notificationPreferences: newPrefs });
    
    try {
      const { usersService } = await import("@/services/api/users.service");
      await usersService.updateProfile({ notificationPreferences: newPrefs });
      toast.success("Notification preferences updated");
    } catch (error) {
      // Revert on error
      updateAuthUser({ notificationPreferences: prefs });
      toast.error("Failed to update preferences");
    }
  };

  return (
    <SettingsCard title="Notification preferences">
      <div className="space-y-3">
        {NOTIFICATION_PREFS.map((n) => {
          // Default to true if not explicitly set
          const isChecked = prefs[n.id] !== false;
          
          return (
            <label key={n.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3">
              <div>
                <div className="text-[13px] font-medium">{n.label}</div>
                <div className="text-[11.5px] text-muted-foreground">Email + in-app</div>
              </div>
              <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={(e) => handleToggle(n.id, e.target.checked)}
                className="h-4 w-4 accent-[color:var(--color-accent)]" 
              />
            </label>
          );
        })}
      </div>
    </SettingsCard>
  );
}
