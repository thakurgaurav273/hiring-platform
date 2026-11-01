"use client";

import { ArrowRight, Briefcase, Lock, MapPin, Search } from "lucide-react";
import { themeStyle } from "@/lib/theme";
import { OrgMark } from "@/components/brand";
import { EMPLOYMENT_LABELS, type PublicJobSummary } from "@/lib/careers";
import type { OrganizationBranding } from "@/lib/theme/types";

/** Browser window chrome around a preview, showing the address candidates see. */
export function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground">
          <Lock className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
        </span>
      </div>
      {children}
    </div>
  );
}

/**
 * Scaled-down replica of the public careers page, themed with the
 * organization's branding and showing the draft About text and the jobs
 * that are actually live.
 */
export function CareersPagePreview({
  branding,
  about,
  jobs,
  loading,
  dark,
}: {
  branding: OrganizationBranding;
  about: string;
  jobs: PublicJobSummary[];
  loading: boolean;
  dark: boolean;
}) {
  const name = branding.displayName || branding.organizationName;
  const shown = jobs.slice(0, 4);
  return (
    <div
      style={themeStyle(
        {
          themePreset: branding.themePreset,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          fontPreset: branding.fontPreset,
          radiusPreset: branding.radiusPreset,
          sidebarStyle: "solid",
        },
        dark ? "dark" : "light"
      )}
      className="pointer-events-none select-none bg-background text-foreground"
    >
      <div aria-hidden="true">
        <div className="flex h-11 items-center gap-2 border-b border-border bg-surface px-5">
          <OrgMark name={name} logoUrl={branding.logoUrl} size={22} />
          <span className="font-display text-[12.5px] font-semibold tracking-tight">{name}</span>
          <span className="ml-auto text-[10.5px] text-muted-foreground">Careers</span>
        </div>
        <div className="px-5 pb-6 pt-6">
          <div className="font-display text-[22px] font-semibold leading-tight tracking-tight">Work at {name}</div>
          <p className="mt-2 line-clamp-4 whitespace-pre-line text-[11.5px] leading-relaxed text-muted-foreground">
            {about.trim() || "Explore open roles and apply in a few minutes. No account needed."}
          </p>
          <div className="mt-5 text-[12px] font-semibold">
            Open roles <span className="text-muted-foreground">({jobs.length})</span>
          </div>
          <div className="mt-2 flex h-7 items-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-2.5 text-[10.5px] text-muted-foreground">
            <Search className="size-3" /> Search roles
          </div>
          {loading ? (
            <div className="mt-3 space-y-px overflow-hidden rounded-[var(--radius-card)] border border-border">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 animate-pulse bg-surface-2" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="mt-3 rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface p-5 text-center">
              <div className="text-[11.5px] font-medium">No open roles right now</div>
              <div className="mt-0.5 text-[10.5px] text-muted-foreground">Check back soon.</div>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
              {shown.map((job) => (
                <li key={job.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] font-semibold">{job.title}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2.5 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="size-2.5" /> {job.department}
                      </span>
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-2.5" /> {job.location}
                        </span>
                      )}
                      <span>{EMPLOYMENT_LABELS[job.employmentType]}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-primary">
                    View <ArrowRight className="size-3" />
                  </span>
                </li>
              ))}
              {jobs.length > shown.length && (
                <li className="px-3.5 py-2 text-center text-[10.5px] text-muted-foreground">+ {jobs.length - shown.length} more</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Runs the real embed.js inside a sandboxed frame, so the preview is exactly
 * what visitors to the customer's website get. The sandbox has no
 * same-origin access to this app.
 */
export function WidgetPreview({ snippet, dark }: { snippet: string; dark: boolean }) {
  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="${dark ? "dark" : "light"}">
<style>
  html,body{margin:0;background:${dark ? "#0b0f17" : "#ffffff"};color:${dark ? "#e5e7eb" : "#111827"};font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  .site{padding:22px 22px 28px}
  .bar{display:flex;align-items:center;gap:8px;margin-bottom:18px}
  .logo{width:18px;height:18px;border-radius:5px;background:${dark ? "#374151" : "#e5e7eb"}}
  .nav{height:7px;width:46px;border-radius:4px;background:${dark ? "#1f2937" : "#f3f4f6"}}
  h1{font-size:17px;margin:0 0 4px;font-weight:650;letter-spacing:-.01em}
  p{font-size:12px;margin:0 0 16px;opacity:.6}
</style></head><body><div class="site">
<div class="bar"><span class="logo"></span><span class="nav"></span><span class="nav"></span><span class="nav"></span></div>
<h1>Join our team</h1><p>Your website's own content around the widget.</p>
${snippet}
</div></body></html>`;
  return (
    <iframe
      title="Website widget preview"
      srcDoc={doc}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      className="block h-[380px] w-full border-0"
      // An iframe's prefers-color-scheme follows its element's color-scheme,
      // which lets data-scheme="auto" be previewed in both modes.
      style={{ colorScheme: dark ? "dark" : "light" }}
      // Re-mount when the snippet changes so the widget re-runs with new options.
      key={snippet + String(dark)}
    />
  );
}
