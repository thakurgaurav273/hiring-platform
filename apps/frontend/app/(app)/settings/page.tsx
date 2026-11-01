"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Globe, Info, KeyRound, Palette, Sun, User, Users, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Guard } from "@/components/access-restricted";
import { useAppStore } from "@/store/app.store";
import { ProfileSection } from "@/features/settings/sections/ProfileSection";
import { SecuritySection } from "@/features/settings/sections/SecuritySection";
import { AppearanceSection } from "@/features/settings/sections/AppearanceSection";
import { NotificationsSection } from "@/features/settings/sections/NotificationsSection";
import { MembersSection } from "@/features/settings/sections/MembersSection";
import { AboutSection } from "@/features/settings/sections/AboutSection";
import { BrandingSettings } from "@/features/settings/branding/BrandingSettings";
import { CareersSettings } from "@/features/settings/careers/CareersSettings";
import { SectionHeader } from "@/features/settings/SettingsSections";
import { cn } from "@/lib/utils";

/** URL keys (?tab=…). Kept stable so existing links keep working. */
const TABS = ["profile", "security", "appearance", "notifications", "branding", "careers", "users", "about"] as const;
type Tab = (typeof TABS)[number];

interface NavItem {
  tab: Tab;
  label: string;
  icon: LucideIcon;
  show: boolean;
  /** Wide sections use the full content width; the rest are capped for readability. */
  wide?: boolean;
}

export default function SettingsPage() {
  return (
    <Guard section="settings">
      {/* useSearchParams (for ?tab=) requires a Suspense boundary */}
      <Suspense fallback={null}>
        <SettingsInner />
      </Suspense>
    </Guard>
  );
}

function SettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const can = useAppStore((s) => s.can);
  const canManageBranding = useAppStore((s) => !!s.workspace?.permissions.canManageBranding);
  const orgName = useAppStore((s) => s.workspace?.branding.displayName);

  const allGroups: { label: string; items: NavItem[] }[] = [
    {
      label: "Account",
      items: [
        { tab: "profile", label: "Profile", icon: User, show: true },
        { tab: "security", label: "Password & security", icon: KeyRound, show: true },
        { tab: "appearance", label: "Appearance", icon: Sun, show: true },
        { tab: "notifications", label: "Notifications", icon: Bell, show: true },
      ],
    },
    {
      label: orgName ? `Organization · ${orgName}` : "Organization",
      items: [
        { tab: "branding", label: "Branding", icon: Palette, show: canManageBranding, wide: true },
        { tab: "careers", label: "Careers & embed", icon: Globe, show: canManageBranding || can("jobs"), wide: true },
        { tab: "users", label: "Members", icon: Users, show: can("users") },
      ],
    },
    { label: "Robin Talent", items: [{ tab: "about", label: "About", icon: Info, show: true }] },
  ];
  const groups = allGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.show) }))
    .filter((g) => g.items.length > 0);

  const visible = groups.flatMap((g) => g.items);
  const requested = searchParams.get("tab") as Tab | null;
  const current = visible.find((i) => i.tab === requested) ?? visible[0];

  // Normalise unknown or forbidden tabs in the URL.
  useEffect(() => {
    if (requested !== current.tab) router.replace(`/settings?tab=${current.tab}`, { scroll: false });
  }, [requested, current.tab, router]);

  const select = (tab: Tab) => router.replace(`/settings?tab=${tab}`, { scroll: false });

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Settings" }]}
        title="Settings"
        description="Manage your account and how your organization uses Robin Talent."
      />

      <div className="px-4 py-6 md:px-8 lg:py-8">
        <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10">
          {/* Mobile: section picker */}
          <div className="lg:hidden">
            <label htmlFor="settings-section" className="sr-only">
              Settings section
            </label>
            <select id="settings-section" value={current.tab} onChange={(e) => select(e.target.value as Tab)} className="input h-11 font-medium">
              {groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((i) => (
                    <option key={i.tab} value={i.tab}>
                      {i.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Desktop: grouped side navigation */}
          <nav aria-label="Settings" className="hidden lg:block">
            <div className="sticky top-6 space-y-6">
              {groups.map((g) => (
                <div key={g.label}>
                  <div className="mb-1.5 truncate px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground" title={g.label}>
                    {g.label}
                  </div>
                  <ul className="space-y-0.5">
                    {g.items.map((i) => {
                      const active = i.tab === current.tab;
                      return (
                        <li key={i.tab}>
                          <button
                            type="button"
                            onClick={() => select(i.tab)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                              active ? "bg-surface text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                          >
                            <i.icon className={cn("size-4 shrink-0", active ? "text-primary" : "")} aria-hidden="true" />
                            {i.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className={cn("min-w-0", !current.wide && "max-w-3xl")}>
            {current.tab === "profile" && <ProfileSection />}
            {current.tab === "security" && <SecuritySection />}
            {current.tab === "appearance" && <AppearanceSection />}
            {current.tab === "notifications" && <NotificationsSection />}
            {current.tab === "users" && <MembersSection />}
            {current.tab === "about" && <AboutSection />}
            {current.tab === "branding" && (
              <>
                <SectionHeader
                  title="Branding"
                  description="Your logo, name and colours across the app, invitation emails and your careers page. Changes apply to everyone in the organization."
                />
                <BrandingSettings />
              </>
            )}
            {current.tab === "careers" && (
              <>
                <SectionHeader
                  title="Careers & embed"
                  description="Your public careers page, how to share it, and the jobs widget for your own website."
                />
                <CareersSettings canEdit={canManageBranding} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
