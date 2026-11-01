"use client";

import Link from "next/link";
import { ArrowUpRight, Cookie, FileText, LifeBuoy, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { PoweredBy } from "@/components/brand";
import { ROLE_LABELS, SectionHeader, SettingsCard } from "@/features/settings/SettingsSections";

/** Product information and platform attribution. Platform-controlled, not editable by organizations. */
export function AboutSection() {
  const workspace = useAppStore((s) => s.workspace);
  const role = useAppStore((s) => s.authUser?.role);
  const { platformName, productName, productTagline, version, platformUrl, supportEmail, logoUrl } = PLATFORM_BRANDING;

  const details: [string, React.ReactNode][] = [
    ["Version", <span key="v" className="font-mono">{version}</span>],
    ["Workspace", workspace ? workspace.branding.displayName : "–"],
    ["Workspace address", workspace ? <span key="s" className="font-mono">{workspace.organization.slug}</span> : "–"],
    ["Your role", role ? ROLE_LABELS[role] ?? role : "–"],
  ];

  const legal = [
    { href: "/terms", label: "Terms of Service", icon: FileText },
    { href: "/privacy", label: "Privacy Policy", icon: ShieldCheck },
    { href: "/cookies", label: "Cookie Policy", icon: Cookie },
  ];

  return (
    <div>
      <SectionHeader title="About" description={`Information about ${productName} and your workspace.`} />

      <div className="space-y-6">
        <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- static platform logo
            <img src={logoUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary font-display text-[22px] font-semibold text-primary-foreground">
              {productName.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-[19px] font-semibold tracking-tight">{productName}</span>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[11px]">v{version}</span>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{productTagline}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Built by{" "}
              {platformUrl ? (
                <a href={platformUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
                  {platformName}
                </a>
              ) : (
                <span className="font-medium text-foreground">{platformName}</span>
              )}
            </p>
          </div>
        </div>

        <SettingsCard title="Details">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px] text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 text-[13.5px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </SettingsCard>

        <SettingsCard title="Legal and support">
          <div className="grid gap-3 sm:grid-cols-3">
            {legal.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition hover:border-border-strong hover:bg-surface-2"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground" aria-hidden="true">
                  <l.icon className="size-4" />
                </span>
                <span className="flex-1 text-[13px] font-medium">{l.label}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground transition group-hover:text-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-[13px] transition hover:border-border-strong hover:bg-surface-2"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground" aria-hidden="true">
                <LifeBuoy className="size-4" />
              </span>
              <span className="flex-1">
                <span className="font-medium">Contact support</span>
                <span className="ml-2 text-muted-foreground">{supportEmail}</span>
              </span>
            </a>
          )}
        </SettingsCard>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[11.5px] text-muted-foreground">
          <PoweredBy placement="about" />
          <span>
            © {new Date().getFullYear()} {platformName}
          </span>
        </div>
      </div>
    </div>
  );
}
