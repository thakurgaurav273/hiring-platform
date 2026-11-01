
import { Bell, Search, Plus } from "lucide-react";
import { themeStyle } from "@/lib/theme/engine";
import type { ResolvedMode, ThemeSettings } from "@/lib/theme/types";
import { OrgMark } from "@/components/brand";
import { StageBadge } from "@/components/stage-badge";
import { CandidateStage } from "@/constants/enums";
import { cn } from "@/lib/utils";

const NAV = ["Dashboard", "Jobs", "Candidates", "Pipeline", "Interviews", "Reports"];

const ROWS = [
  { name: "Maya Thompson", role: "Product Designer", stage: CandidateStage.INTERVIEW_SCHEDULED },
  { name: "Arjun Mehta", role: "Backend Engineer", stage: CandidateStage.SHORTLISTED },
  { name: "Lena Fischer", role: "Data Analyst", stage: CandidateStage.HIRED },
  { name: "Tomás Ortega", role: "Sales Lead", stage: CandidateStage.TECHNICAL_ROUND },
  { name: "Priya Raman", role: "QA Engineer", stage: CandidateStage.OFFER_SENT },
];

/**
 * Live, self-contained preview of a theme. With `mode`, the theme's tokens are
 * scoped to this element inline (used for unsaved settings). Without `mode`,
 * it inherits tokens from an enclosing theme scope (used on the website).
 */
export function BrandingPreview({
  settings,
  mode,
  brand,
  tall,
}: {
  settings: ThemeSettings;
  mode?: ResolvedMode;
  /** Taller canvas, for layouts that place the preview beside tall controls. */
  tall?: boolean;
  brand: { name: string; logoUrl: string | null };
}) {
  const style = mode ? themeStyle(settings, mode) : undefined;

  return (
    <div
      style={style}
      className={cn("overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm", mode === "dark" && "dark")}
      aria-label={mode ? `Preview in ${mode} mode` : "Product preview"}
      role="img"
    >
      <div className={cn("flex text-[11px]", tall ? "min-h-[420px] lg:min-h-[680px]" : "min-h-[420px]")} aria-hidden="true">
        {/* Sidebar */}
        <aside className="hidden w-[150px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground sm:flex">
          <div className="flex h-11 items-center gap-2 border-b border-sidebar-border px-3">
            <OrgMark name={brand.name} logoUrl={brand.logoUrl} size={20} />
            <span className="truncate font-display text-[11.5px] font-semibold">{brand.name}</span>
          </div>
          <div className="flex flex-col gap-0.5 p-2">
            {NAV.map((item, i) => (
              <div
                key={item}
                className={cn(
                  "relative rounded-md px-2 py-1.5 font-medium",
                  i === 2 ? "bg-sidebar-accent text-sidebar-active-foreground" : "text-sidebar-foreground/80"
                )}
              >
                {i === 2 && <span className="absolute bottom-1 left-0 top-1 w-[2px] rounded-full bg-sidebar-primary" />}
                {item}
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-11 items-center gap-2 border-b border-border bg-background px-3">
            <span className="text-muted-foreground">{brand.name}</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Candidates</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden h-7 w-32 items-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-2 text-muted-foreground md:flex">
                <Search className="h-3 w-3" /> Search
              </div>
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </header>

          <div className="space-y-3 p-3">
            <div className="flex items-center justify-between">
              <div className="font-display text-[14px] font-semibold tracking-tight">Candidates</div>
              <div className="flex gap-1.5">
                <span className="inline-flex h-7 items-center rounded-[var(--radius-control)] border border-border bg-surface px-2.5 font-medium">
                  Export
                </span>
                <span className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-control)] bg-primary px-2.5 font-medium text-primary-foreground">
                  <Plus className="h-3 w-3" /> Add candidate
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ["Open roles", "12"],
                ["In pipeline", "248"],
                ["Hired (30d)", "9"],
              ].map(([label, value], i) => (
                <div key={label} className="rounded-[var(--radius-card)] border border-border bg-card p-2.5">
                  <div className="text-muted-foreground">{label}</div>
                  <div className="mt-1 font-display text-[16px] font-semibold">{value}</div>
                  <div className="mt-2 h-1 rounded-full bg-muted">
                    <div className="h-1 rounded-full" style={{ width: `${40 + i * 20}%`, background: `var(--color-chart-${i + 1})` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-7 min-w-[140px] flex-1 items-center rounded-[var(--radius-control)] border border-ring bg-surface px-2 ring-2 ring-ring/15">
                Product designer<span className="ml-px h-3 w-px animate-pulse bg-foreground" />
              </div>
              <StageBadge stage={CandidateStage.APPLIED} />
              <span className="tone-soft rounded-full px-2 py-0.5 font-medium [--tone:var(--color-warning)]">On hold</span>
              <span className="tone-soft rounded-full px-2 py-0.5 font-medium [--tone:var(--color-destructive)]">Rejected</span>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
              <div className="grid grid-cols-[1.4fr_1.2fr_1fr] border-b border-border bg-surface-2 px-2.5 py-1.5 font-medium text-muted-foreground">
                <span>Name</span>
                <span>Role</span>
                <span>Stage</span>
              </div>
              {ROWS.slice(0, tall ? 5 : 3).map((r) => (
                <div key={r.name} className="grid grid-cols-[1.4fr_1.2fr_1fr] items-center border-b border-border px-2.5 py-2 last:border-0">
                  <span className="truncate font-medium text-primary">{r.name}</span>
                  <span className="truncate text-muted-foreground">{r.role}</span>
                  <span>
                    <StageBadge stage={r.stage} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
