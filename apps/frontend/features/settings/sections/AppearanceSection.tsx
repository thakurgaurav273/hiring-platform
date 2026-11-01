"use client";

import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import { useTheme } from "@/components/theme-provider";
import { useUpdateAppearance } from "@/hooks/useWorkspace";
import { PLATFORM_BRANDING, buildTheme, type AppearanceMode, type ThemeSettings } from "@/lib/theme";
import { SectionHeader, SettingsCard } from "@/features/settings/SettingsSections";
import { cn } from "@/lib/utils";

type Choice = AppearanceMode | null;

const LABELS: Record<AppearanceMode, string> = { light: "Light", dark: "Dark", system: "Match device" };

/** Tiny app window drawn with the workspace's real light or dark palette. */
function Thumb({ settings, mode }: { settings: ThemeSettings; mode: "light" | "dark" }) {
  const t = buildTheme(settings, mode).tokens;
  const c = (k: string) => t[`--${k}` as `--${string}`];
  return (
    <div className="flex h-full w-full" style={{ background: c("background") }}>
      <div className="w-[26%] space-y-1 p-1.5" style={{ background: c("sidebar") }}>
        <div className="h-1.5 w-3/4 rounded-sm" style={{ background: c("sidebar-foreground"), opacity: 0.7 }} />
        <div className="h-1.5 w-full rounded-sm" style={{ background: c("sidebar-accent") }} />
        <div className="h-1.5 w-2/3 rounded-sm" style={{ background: c("sidebar-foreground"), opacity: 0.3 }} />
        <div className="h-1.5 w-3/4 rounded-sm" style={{ background: c("sidebar-foreground"), opacity: 0.3 }} />
      </div>
      <div className="flex-1 space-y-1.5 p-2">
        <div className="h-2 w-1/2 rounded-sm" style={{ background: c("foreground"), opacity: 0.85 }} />
        <div className="rounded-[3px] border p-1.5" style={{ background: c("surface"), borderColor: c("border") }}>
          <div className="h-1.5 w-2/3 rounded-sm" style={{ background: c("muted-foreground"), opacity: 0.6 }} />
          <div className="mt-1 h-1.5 w-1/3 rounded-sm" style={{ background: c("primary") }} />
        </div>
        <div className="h-1.5 w-3/4 rounded-sm" style={{ background: c("muted-foreground"), opacity: 0.35 }} />
      </div>
    </div>
  );
}

export function AppearanceSection() {
  const workspace = useAppStore((s) => s.workspace);
  const { mode, settings } = useTheme();
  const update = useUpdateAppearance();
  const personal: Choice = workspace?.preferences.appearance ?? null;
  const orgDefault: AppearanceMode = workspace?.branding.defaultAppearance ?? PLATFORM_BRANDING.defaultAppearance;

  const select = (value: Choice) => {
    if (value === personal || update.isPending) return;
    update.mutate(value, {
      onSuccess: () => toast.success(value ? `Appearance set to ${LABELS[value].toLowerCase()}` : "Following your organization's default"),
    });
  };

  const options: { v: Choice; label: string; description: string; preview: AppearanceMode }[] = [
    {
      v: null,
      label: "Organization default",
      description: `${LABELS[orgDefault]}, chosen by your administrator.`,
      preview: orgDefault,
    },
    { v: "light", label: "Light", description: "Bright and clear, best in daylight.", preview: "light" },
    { v: "dark", label: "Dark", description: "Easier on the eyes in low light.", preview: "dark" },
    { v: "system", label: "Match device", description: "Follows your computer or phone setting.", preview: "system" },
  ];

  return (
    <div>
      <SectionHeader
        title="Appearance"
        description={`Choose how ${PLATFORM_BRANDING.productName} looks for you. This only changes your own view; your organization's colours and logo stay the same.`}
      />
      <SettingsCard
        title="Theme"
        description={<>Showing <span className="font-medium text-foreground">{mode}</span> mode right now.</>}
        action={update.isPending ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Saving" /> : undefined}
      >
        <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {options.map((o) => {
            const active = personal === o.v;
            return (
              <button
                key={o.v ?? "org"}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => select(o.v)}
                disabled={update.isPending}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-wait",
                  active ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-border-strong"
                )}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border" aria-hidden="true">
                  {o.preview === "system" ? (
                    <div className="flex h-full">
                      <div className="w-1/2 overflow-hidden">
                        <div className="h-full w-[200%]">
                          <Thumb settings={settings} mode="light" />
                        </div>
                      </div>
                      <div className="relative w-1/2 overflow-hidden">
                        <div className="h-full w-[200%] -translate-x-1/2">
                          <Thumb settings={settings} mode="dark" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Thumb settings={settings} mode={o.preview} />
                  )}
                </div>
                <div className="flex flex-1 items-start gap-2 bg-surface p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{o.label}</div>
                    <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{o.description}</div>
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border-strong"
                    )}
                    aria-hidden="true"
                  >
                    {active && <Check className="size-2.5" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
}
