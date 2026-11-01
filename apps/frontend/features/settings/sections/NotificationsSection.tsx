"use client";

import { errorMessage } from "@/lib/error-message";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, GitBranch, Info, UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app.store";
import { usersService } from "@/services/api/users.service";
import { SectionHeader, SettingsCard } from "@/features/settings/SettingsSections";

/**
 * Preferences the server actually honours (see notification.service.ts and
 * cron.service.ts). A missing key means "on".
 */
const PREFS = [
  {
    id: "newApplications",
    icon: UserPlus,
    label: "New applications and referrals",
    description: "When someone applies or is referred to a job you're on, or in your department.",
  },
  {
    id: "stageChanges",
    icon: GitBranch,
    label: "Candidate stage changes",
    description: "When a candidate on one of your jobs moves to a new stage.",
  },
  {
    id: "interviewReminders",
    icon: CalendarClock,
    label: "Interview reminders",
    description: "Before interviews where you're on the panel.",
  },
] as const;

type PrefId = (typeof PREFS)[number]["id"];

export function NotificationsSection() {
  const authUser = useAppStore((s) => s.authUser);
  const updateAuthUser = useAppStore((s) => s.updateAuthUser);
  const [saving, setSaving] = useState<PrefId | null>(null);
  const prefs = authUser?.notificationPreferences ?? {};

  const toggle = async (id: PrefId, on: boolean) => {
    const previous = prefs;
    const next = { ...prefs, [id]: on };
    updateAuthUser({ notificationPreferences: next });
    setSaving(id);
    try {
      const saved = await usersService.updateProfile({ notificationPreferences: next });
      updateAuthUser({ notificationPreferences: saved.notificationPreferences ?? next });
    } catch (e: any) {
      updateAuthUser({ notificationPreferences: previous });
      toast.errorerrorMessage(e, "Couldn't update notifications");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Notifications"
        description="Choose what you're notified about. Notifications appear under the bell in the top bar, and as browser push notifications if you've allowed them."
      />

      <SettingsCard title="Activity" description="Changes save as soon as you flip a switch." bodyClassName="px-0 pb-0 pt-3 sm:px-0 sm:pb-0">
        <ul className="divide-y divide-border border-t border-border">
          {PREFS.map((p) => {
            const on = prefs[p.id] !== false;
            const id = `pref-${p.id}`;
            return (
              <li key={p.id} className="flex items-start gap-4 px-5 py-4 sm:px-6">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground" aria-hidden="true">
                  <p.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <label htmlFor={id} className="block cursor-pointer text-[13.5px] font-medium">
                    {p.label}
                  </label>
                  <p id={`${id}-desc`} className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {saving === p.id && <span className="text-[11.5px] text-muted-foreground">Saving…</span>}
                  <Switch
                    id={id}
                    checked={on}
                    onCheckedChange={(v) => toggle(p.id, v)}
                    disabled={saving !== null}
                    aria-describedby={`${id}-desc`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </SettingsCard>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-surface-2/60 px-4 py-3 text-[12.5px] text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Some updates are always sent because they need your action: interviews you&apos;re scheduled for, hiring team
          invitations, new mail on candidates and job updates.
        </p>
      </div>
    </div>
  );
}
