"use client";

import { errorMessage } from "@/lib/error-message";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MessageCircle,
  Moon,
  Palette,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/app.store";
import { Role } from "@/constants/enums";
import { useReports } from "@/hooks/useReports";
import { organizationService } from "@/services/api/organization.service";
import { SITE_URL, careersPath, embedSnippet, fetchListing, type EmbedOptions } from "@/lib/careers";
import { copyText } from "@/lib/copy-text";
import { buildTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { BrowserFrame, CareersPagePreview, WidgetPreview } from "./CareersPreview";

const ABOUT_MAX = 2000;
const HEX = /^#[0-9a-fA-F]{6}$/;

// ─── Small building blocks ────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, value: string) => {
    if (await copyText(value)) {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } else {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };
  return { copied, copy };
}

function Panel({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("surface-card p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={id} className="text-[14px] font-semibold tracking-tight">
            {title}
          </h3>
          {description && <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Segmented control (radio group) used by the widget options. */
function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium">{label}</div>
      <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-border bg-surface-2 p-0.5">
        {options.map((o) => {
          const active = o.value === value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium transition",
                active ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="font-display text-[22px] font-semibold tabular-nums tracking-tight">{value}</span>
        {hint && <span className="text-[12px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/** Settings → Careers & embed. */
export function CareersSettings({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const workspace = useAppStore((s) => s.workspace);
  const role = useAppStore((s) => s.role);
  const isAdmin = role === Role.ADMINISTRATOR;
  const { copied, copy } = useCopy();

  // Saved settings
  const settingsQuery = useQuery({
    queryKey: ["organization", "careers"],
    queryFn: organizationService.getCareersSettings,
  });
  const slug = settingsQuery.data?.slug;

  // What candidates can see right now, straight from the public API.
  const careersLive = useQuery({
    queryKey: ["public-careers", slug, "careers"],
    queryFn: () => fetchListing(slug!),
    enabled: !!slug,
    staleTime: 30_000,
  });
  const embedLive = useQuery({
    queryKey: ["public-careers", slug, "embed"],
    queryFn: () => fetchListing(slug!, "embed"),
    enabled: !!slug,
    staleTime: 30_000,
  });
  const reports = useReports({ enabled: isAdmin });
  const bySource = isAdmin ? reports.data?.applicationsBySource ?? [] : [];
  const appsFrom = (type: string) => bySource.find((r) => r.sourceType === type)?.applications ?? 0;

  // About draft
  const [about, setAbout] = useState("");
  useEffect(() => {
    if (settingsQuery.data) setAbout(settingsQuery.data.about ?? "");
  }, [settingsQuery.data]);
  const savedAbout = settingsQuery.data?.about ?? "";
  const dirty = savedAbout !== about.trim();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: () => organizationService.updateCareersSettings({ about: about.trim() || null }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["organization", "careers"], saved);
      toast.success("Saved. The public page picks it up within a minute.");
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save the careers page")),
  });

  // Widget options
  const brandAccent = useMemo(() => {
    if (!workspace) return "#374151";
    const b = workspace.branding;
    return buildTheme(
      {
        themePreset: b.themePreset,
        primaryColor: b.primaryColor,
        secondaryColor: b.secondaryColor,
        fontPreset: b.fontPreset,
        radiusPreset: b.radiusPreset,
        sidebarStyle: b.sidebarStyle,
      },
      "light"
    ).tokens["--primary"];
  }, [workspace]);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [accentMode, setAccentMode] = useState<"brand" | "custom">("brand");
  const [customColor, setCustomColor] = useState("#A8320C");
  const [limit, setLimit] = useState<"all" | "3" | "5" | "10">("all");
  const [scheme, setScheme] = useState<"light" | "auto">("light");
  const embedOpts: EmbedOptions = {
    layout,
    color: accentMode === "custom" && HEX.test(customColor) ? customColor : null,
    limit: limit === "all" ? null : Number(limit),
    scheme,
  };

  // Preview
  const [view, setView] = useState<"careers" | "widget">("careers");
  const [previewDark, setPreviewDark] = useState(false);

  if (settingsQuery.isLoading || !workspace) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        <div className="space-y-6">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-[520px] w-full" />
      </div>
    );
  }
  if (settingsQuery.error || !slug) {
    return <div className="surface-card mt-4 p-6 text-[13px] text-muted-foreground">Couldn&apos;t load careers settings. Try again shortly.</div>;
  }

  const url = SITE_URL + careersPath(slug);
  const snippet = embedSnippet(slug, embedOpts);
  const tracked = (source: string, medium: string) => {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", medium);
    return u.toString();
  };
  const orgName = workspace.branding.displayName || workspace.organization.name;
  const careersCount = careersLive.data?.jobs.length;
  const embedCount = embedLive.data?.jobs.length;
  const shareText = `We're hiring at ${orgName}. See our open roles:`;

  const shareTargets = [
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: ArrowUpRight,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(tracked("linkedin", "social"))}`,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${tracked("whatsapp", "social")}`)}`,
    },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(`Open roles at ${orgName}`)}&body=${encodeURIComponent(`${shareText}\n\n${tracked("email", "email")}`)}`,
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      {/* ── Left: settings ─────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-6">
        {/* Status */}
        <section aria-labelledby="careers-status" className="surface-card overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium",
                  careersCount
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border bg-secondary text-muted-foreground"
                )}
              >
                <span className={cn("size-1.5 rounded-full", careersCount ? "bg-success" : "bg-muted-foreground")} aria-hidden="true" />
                {careersCount === undefined ? "Checking…" : careersCount ? "Live" : "Live, no open roles"}
              </span>
            </div>
            <h3 id="careers-status" className="mt-3 font-display text-[20px] font-semibold tracking-tight">
              Your careers page
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Open jobs are listed automatically. Candidates apply without an account, and each application is tagged with
              where they found you.
            </p>

            <div className="mt-5 flex min-w-0 flex-col gap-2 2xl:flex-row">
              <input
                readOnly
                value={url}
                aria-label="Careers page link"
                onFocus={(e) => e.currentTarget.select()}
                className="input h-10 min-w-0 shrink-0 font-mono text-[12.5px] 2xl:flex-1"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => copy("url", url)} className="flex-1 2xl:flex-none">
                  {copied === "url" ? <Check className="text-success" /> : <Copy />} {copied === "url" ? "Copied" : "Copy link"}
                </Button>
                <Button asChild className="flex-1 2xl:flex-none">
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink /> Open
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border bg-surface-2/40 p-5 sm:grid-cols-2 sm:p-6">
            <Stat label="On careers page" value={careersCount ?? "–"} hint={careersCount === 1 ? "open role" : "open roles"} />
            <Stat label="In website widget" value={embedCount ?? "–"} hint={embedCount === 1 ? "open role" : "open roles"} />
            {isAdmin && (
              <>
                <Stat label="Via careers page" value={reports.isLoading ? "–" : appsFrom("CAREERS_PAGE")} hint="applications" />
                <Stat label="Via your website" value={reports.isLoading ? "–" : appsFrom("COMPANY_WEBSITE")} hint="applications" />
              </>
            )}
          </div>
          <p className="border-t border-border px-5 py-3 text-[12px] text-muted-foreground sm:px-6">
            To take a single job off the page or widget, use the <span className="font-medium text-foreground">Distribution</span> tab on that job.{" "}
            <Link href="/jobs" className="font-medium text-primary hover:underline">
              Go to jobs
            </Link>
          </p>
        </section>

        {/* Company introduction */}
        <Panel
          id="careers-about-title"
          title="Company introduction"
          description="Shown under the heading at the top of your careers page and in search results. Tell candidates who you are and why they should join."
          action={
            <Link
              href="/settings?tab=branding"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Palette className="size-3.5" /> Logo &amp; colours
            </Link>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (dirty) save.mutate();
            }}
          >
            <label htmlFor="careers-about" className="sr-only">
              Company introduction
            </label>
            <textarea
              id="careers-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && dirty && canEdit) save.mutate();
              }}
              maxLength={ABOUT_MAX}
              rows={6}
              readOnly={!canEdit}
              placeholder={`e.g. ${orgName} builds… We're a team of 40 across Bengaluru and Pune, and we care about…`}
              aria-describedby="careers-about-help"
              className="input min-h-[150px] resize-y py-2.5 text-[13.5px] leading-relaxed"
            />
            <div id="careers-about-help" className="mt-1.5 flex justify-between gap-3 text-[11.5px] text-muted-foreground">
              <span>
                {canEdit
                  ? "Plain text. Line breaks are kept. The first 160 characters are used as the search description."
                  : "Only people who can manage branding can change this."}
              </span>
              <span className={cn("tabular-nums", about.length > ABOUT_MAX * 0.9 && "text-warning")}>
                {about.length}/{ABOUT_MAX}
              </span>
            </div>

            {canEdit && (
              <div
                className={cn(
                  "mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4 transition-opacity",
                  !dirty && "opacity-60"
                )}
              >
                <span className="mr-auto text-[12px] text-muted-foreground" aria-live="polite">
                  {dirty ? "Unsaved changes" : "All changes saved"}
                </span>
                <Button type="button" variant="ghost" size="sm" disabled={!dirty || save.isPending} onClick={() => setAbout(savedAbout)}>
                  Discard
                </Button>
                <Button type="submit" size="sm" disabled={!dirty || save.isPending}>
                  {save.isPending && <Loader2 className="animate-spin" />} Save
                </Button>
              </div>
            )}
          </form>
        </Panel>

        {/* Share */}
        <Panel
          id="careers-share-title"
          title="Share your careers page"
          description="Each button opens the app with a tracked link, so applications from it show the right source in Reports."
        >
          <div className="flex flex-wrap gap-2">
            {shareTargets.map((t) => (
              <Button key={t.key} asChild variant="outline">
                <a href={t.href} target="_blank" rel="noopener noreferrer">
                  <t.icon /> {t.label}
                </a>
              </Button>
            ))}
          </div>
        </Panel>

        {/* Website widget */}
        <Panel
          id="careers-widget-title"
          title="Show jobs on your own website"
          description="A small script that lists your open roles on any page of your site. It updates itself when you open or close jobs."
          action={
            <Button type="button" variant="ghost" size="sm" onClick={() => setView("widget")} className="xl:hidden">
              Preview
            </Button>
          }
        >
          <ol className="space-y-6">
            <li className="grid gap-4 sm:grid-cols-[28px_minmax(0,1fr)]">
              <StepNumber n={1} />
              <div className="space-y-4">
                <div className="text-[13px] font-medium">Choose how it looks</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Segmented
                    label="Layout"
                    value={layout}
                    onChange={(v) => {
                      setLayout(v);
                      setView("widget");
                    }}
                    options={[
                      { value: "list", label: "List", icon: List },
                      { value: "grid", label: "Cards", icon: LayoutGrid },
                    ]}
                  />
                  <Segmented
                    label="Roles shown"
                    value={limit}
                    onChange={(v) => {
                      setLimit(v);
                      setView("widget");
                    }}
                    options={[
                      { value: "all", label: "All" },
                      { value: "3", label: "3" },
                      { value: "5", label: "5" },
                      { value: "10", label: "10" },
                    ]}
                  />
                  <Segmented
                    label="Dark mode"
                    value={scheme}
                    onChange={(v) => {
                      setScheme(v);
                      setView("widget");
                    }}
                    options={[
                      { value: "light", label: "Always light", icon: Sun },
                      { value: "auto", label: "Follow visitor", icon: Moon },
                    ]}
                  />
                  <div>
                    <div className="mb-1.5 text-[12px] font-medium">Accent colour</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div role="radiogroup" aria-label="Accent colour" className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
                        {(["brand", "custom"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            role="radio"
                            aria-checked={accentMode === m}
                            onClick={() => {
                              setAccentMode(m);
                              setView("widget");
                            }}
                            className={cn(
                              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium transition",
                              accentMode === m ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span
                              className="size-3 rounded-full border border-black/10"
                              style={{ backgroundColor: m === "brand" ? brandAccent : HEX.test(customColor) ? customColor : "#ffffff" }}
                              aria-hidden="true"
                            />
                            {m === "brand" ? "Brand" : "Custom"}
                          </button>
                        ))}
                      </div>
                      {accentMode === "custom" && (
                        <span className="inline-flex items-center gap-1.5">
                          <input
                            type="color"
                            aria-label="Custom accent colour picker"
                            value={HEX.test(customColor) ? customColor.toLowerCase() : "#000000"}
                            onChange={(e) => setCustomColor(e.target.value.toUpperCase())}
                            className="h-8 w-9 cursor-pointer rounded-md border border-border bg-surface p-0.5"
                          />
                          <input
                            aria-label="Custom accent colour hex"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value.trim())}
                            maxLength={7}
                            className={cn("input h-8 w-[92px] font-mono text-[12px] uppercase", !HEX.test(customColor) && "border-destructive")}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>

            <li className="grid gap-4 sm:grid-cols-[28px_minmax(0,1fr)]">
              <StepNumber n={2} />
              <div>
                <div className="mb-2 text-[13px] font-medium">Copy the code</div>
                <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
                  <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                    <span className="font-mono text-[11px] text-muted-foreground">HTML</span>
                    <Button
                      type="button"
                      size="xs"
                      variant={copied === "snippet" ? "secondary" : "default"}
                      onClick={() => copy("snippet", snippet)}
                      aria-label="Copy embed code"
                    >
                      {copied === "snippet" ? <Check /> : <Copy />} {copied === "snippet" ? "Copied" : "Copy code"}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed">
                    <code className="whitespace-pre-wrap break-all">{snippet}</code>
                  </pre>
                </div>
              </div>
            </li>

            <li className="grid gap-4 sm:grid-cols-[28px_minmax(0,1fr)]">
              <StepNumber n={3} />
              <div>
                <div className="text-[13px] font-medium">Paste it into your site</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Put it in your page&apos;s HTML where the list should appear. On a site builder, use a custom HTML or embed
                  block. Applications from the widget are tagged <span className="font-medium text-foreground">Company website</span>.
                </p>
                <details className="mt-3 text-[12.5px] text-muted-foreground">
                  <summary className="cursor-pointer font-medium text-foreground">Render into an existing element</summary>
                  <p className="mt-2">
                    Add <code className="rounded bg-surface-2 px-1 font-mono text-[11.5px]">data-target=&quot;#jobs&quot;</code> to the
                    script tag and the list is placed inside the element with that id instead of next to the script.
                  </p>
                </details>
              </div>
            </li>
          </ol>
        </Panel>
      </div>

      {/* ── Right: live preview ─────────────────────────────────────────── */}
      <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
        <section aria-labelledby="careers-preview-title" className="surface-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 id="careers-preview-title" className="text-[14px] font-semibold tracking-tight">
                Preview
              </h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {view === "careers"
                  ? dirty
                    ? "Showing your unsaved introduction."
                    : "What candidates see right now."
                  : "The real widget, as it runs on your site."}
              </p>
            </div>
            <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Preview appearance">
              {([false, true] as const).map((d) => (
                <button
                  key={String(d)}
                  type="button"
                  onClick={() => setPreviewDark(d)}
                  aria-pressed={previewDark === d}
                  aria-label={d ? "Dark" : "Light"}
                  className={cn(
                    "grid h-7 w-8 place-items-center rounded transition",
                    previewDark === d ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div role="tablist" aria-label="Preview" className="mt-4 grid grid-cols-2 rounded-lg border border-border bg-surface-2 p-0.5">
            {(
              [
                ["careers", "Careers page"],
                ["widget", "Website widget"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "h-8 rounded-md text-[12.5px] font-medium transition",
                  view === v ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {view === "careers" ? (
              <BrowserFrame url={url}>
                <CareersPagePreview
                  branding={workspace.branding}
                  about={about}
                  jobs={careersLive.data?.jobs ?? []}
                  loading={careersLive.isLoading}
                  dark={previewDark}
                />
              </BrowserFrame>
            ) : (
              <BrowserFrame url="your-company.com/careers">
                <WidgetPreview snippet={snippet} dark={previewDark} />
              </BrowserFrame>
            )}
          </div>
          {view === "widget" && scheme === "light" && previewDark && (
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              The widget stays light on dark sites unless &quot;Dark mode&quot; is set to Follow visitor.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="hidden size-7 place-items-center rounded-full border border-border bg-surface-2 text-[12px] font-semibold text-muted-foreground sm:grid"
    >
      {n}
    </span>
  );
}
