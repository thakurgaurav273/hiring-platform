"use client";

import { Avatar } from "@/components/app-shell";
import { Building2, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import { THEME_OPTIONS } from "@/constants/settings.constants";
import { useTheme } from "@/components/theme-provider";
import { useUpdateAppearance } from "@/hooks/useWorkspace";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { PoweredBy } from "@/components/brand";
import type { AppearanceMode } from "@/lib/theme/types";

/** Shared card wrapper used by all tab sections */
export function SettingsCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"surface-card p-6 " + (className ?? "")} aria-label={title}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
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

/**
 * Personal appearance. Stored per user and never changes organization branding;
 * "Organization default" follows whatever the organization admin has chosen.
 */
export function ThemeSection() {
  const workspace = useAppStore((s) => s.workspace);
  const { mode } = useTheme();
  const updateAppearance = useUpdateAppearance();
  const personal = workspace?.preferences.appearance ?? null;
  const orgDefault = workspace?.branding.defaultAppearance ?? "system";
  const orgDefaultLabel = THEME_OPTIONS.find((o) => o.v === orgDefault)?.l ?? "System";

  const select = (value: AppearanceMode | null) => {
    if (value === personal) return;
    updateAppearance.mutate(value, {
      onSuccess: () => toast.success(value ? `Appearance: ${THEME_OPTIONS.find((o) => o.v === value)?.l}` : "Following organization default"),
    });
  };

  const options: { v: AppearanceMode | null; l: string; d: string; i: React.ElementType }[] = [
    { v: null, l: "Organization default", d: `Currently ${orgDefaultLabel.toLowerCase()}, set by your administrator.`, i: Building2 },
    ...THEME_OPTIONS,
  ];

  return (
    <SettingsCard
      title="My appearance"
      description={`Choose how ${PLATFORM_BRANDING.productName} looks for you. This only affects your account. Now showing ${mode} mode.`}
    >
      <div role="radiogroup" aria-label="Appearance" className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const Icon = opt.i;
          const active = personal === opt.v;
          return (
            <button
              key={opt.v ?? "org"}
              role="radio"
              aria-checked={active}
              disabled={updateAppearance.isPending}
              onClick={() => select(opt.v)}
              className={
                "relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition disabled:opacity-70 " +
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
                className="h-4 w-4 accent-[var(--color-primary)]" 
              />
            </label>
          );
        })}
      </div>
    </SettingsCard>
  );
}

/** About: product information and platform attribution (platform-controlled, not tenant-editable). */
export function AboutSection() {
  const workspace = useAppStore((s) => s.workspace);
  const { platformName, productName, productTagline, version, platformUrl, supportEmail } = PLATFORM_BRANDING;
  const rows: [string, React.ReactNode][] = [
    ["Product", productName],
    ["Version", version],
    ["Workspace", workspace ? workspace.branding.displayName : "—"],
    ["Provided by", platformUrl ? <a href={platformUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{platformName}</a> : platformName],
  ];
  if (supportEmail) rows.push(["Support", <a key="s" href={`mailto:${supportEmail}`} className="text-primary hover:underline">{supportEmail}</a>]);

  return (
    <SettingsCard title={`About ${productName}`} description={productTagline}>
      <dl className="divide-y divide-border rounded-lg border border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-[13px]">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-4 text-[12.5px]">
        <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
        <Link href="/cookies" className="font-medium text-primary hover:underline">Cookie Policy</Link>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <PoweredBy placement="about" />
        <span className="text-[11.5px] text-muted-foreground">
          © {new Date().getFullYear()} {platformName}
        </span>
      </div>
    </SettingsCard>
  );
}
