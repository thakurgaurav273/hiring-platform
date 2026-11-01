"use client";

import { errorMessage } from "@/lib/error-message";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, ExternalLink, Globe, Code2, Link2, Pause, Play, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDistribution, useSetPublication } from "@/hooks/useDistribution";
import type { Destination, PublicationAction, PublicationStatus } from "@/services/api/distribution.service";
import { jobUrl } from "@/lib/careers";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/copy-text";

const STATUS_STYLE: Record<PublicationStatus, { label: string; className: string }> = {
  PUBLISHED: { label: "Published", className: "border-success/30 bg-success/10 text-success" },
  PAUSED: { label: "Paused", className: "border-warning/30 bg-warning/10 text-warning" },
  PENDING: { label: "Pending", className: "border-border bg-secondary text-muted-foreground" },
  FAILED: { label: "Failed", className: "border-destructive/30 bg-destructive/10 text-destructive" },
  UNPUBLISHED: { label: "Not published", className: "border-border bg-secondary text-muted-foreground" },
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null;

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyText(value)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };
  return (
    <div className="flex min-w-0 items-center gap-2">
      <input
        readOnly
        value={value}
        aria-label={label}
        onFocus={(e) => e.currentTarget.select()}
        className="h-8 min-w-0 flex-1 truncate rounded-md border border-border bg-background px-2.5 font-mono text-[11.5px] text-muted-foreground"
      />
      <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check className="text-success" /> : <Copy />}
        <span className="sr-only sm:not-sr-only">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}

const ICONS = { CAREERS_PAGE: Globe, WEBSITE_EMBED: Code2 } as const;

export function JobDistribution({ jobId, canManage }: { jobId: string; canManage: boolean }) {
  const { data, isLoading, error } = useDistribution(jobId);
  const setPublication = useSetPublication(jobId);
  const [busy, setBusy] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  if (error || !data) {
    return <div className="surface-card p-5 text-[13px] text-muted-foreground">Couldn&apos;t load distribution. Try again shortly.</div>;
  }

  const { job, organizationSlug, destinations } = data;
  const firstParty = destinations.filter((d) => d.kind === "first_party");
  const external = destinations.filter((d) => d.kind === "external");
  const publicUrl = jobUrl(organizationSlug, job);
  const isOpen = job.status === "OPEN";

  const run = (d: Destination, action: PublicationAction) => {
    setBusy(`${d.channel}:${action}`);
    setPublication.mutate(
      { channel: d.channel, action },
      {
        onSuccess: () =>
          toast.success(
            `${action === "publish" ? "Published on" : action === "pause" ? "Paused on" : "Removed from"} ${d.label.toLowerCase()}`
          ),
        onError: (e: any) => toast.error(errorMessage(e, "Couldn't update this destination")),
        onSettled: () => setBusy(null),
      }
    );
  };

  return (
    <div className="space-y-6">
      {!isOpen && (
        <div role="status" className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-[13px]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            This job is <strong>{job.status.replace("_", " ").toLowerCase()}</strong>, so it isn&apos;t accepting applications. Set it to
            Open to publish it.
          </span>
        </div>
      )}

      <section aria-labelledby="dist-robin" className="space-y-3">
        <div>
          <h2 id="dist-robin" className="text-[13px] font-semibold">Published by Robin Talent</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            These follow the job&apos;s status automatically. Pausing or unpublishing here lasts until the status next changes.
          </p>
        </div>

        {firstParty.map((d) => {
          const Icon = ICONS[d.channel as keyof typeof ICONS] ?? Globe;
          const status = STATUS_STYLE[d.status ?? "UNPUBLISHED"];
          const live = d.status === "PUBLISHED";
          return (
            <div key={d.channel} className="surface-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-medium">{d.label}</span>
                    <Badge variant="outline" className={cn("font-medium", status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-muted-foreground">
                    {d.publishedAt && <span>Published {fmt(d.publishedAt)}</span>}
                    {d.status === "PAUSED" && d.pausedAt && <span>Paused {fmt(d.pausedAt)}</span>}
                    {d.lastSyncedAt && <span>Last updated {fmt(d.lastSyncedAt)}</span>}
                    {!d.publishedAt && !d.lastSyncedAt && <span>Never published</span>}
                  </div>
                  {d.lastError && (
                    <p role="alert" className="mt-2 flex items-start gap-1.5 text-[12.5px] text-destructive">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {d.lastError}
                    </p>
                  )}
                </div>
                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    {!live && (
                      <Button
                        size="sm"
                        onClick={() => run(d, "publish")}
                        disabled={!isOpen || busy !== null}
                        title={!isOpen ? "Open the job to publish it" : undefined}
                      >
                        <Play /> {busy === `${d.channel}:publish` ? "Publishing…" : "Publish"}
                      </Button>
                    )}
                    {live && (
                      <Button size="sm" variant="outline" onClick={() => run(d, "pause")} disabled={busy !== null}>
                        <Pause /> {busy === `${d.channel}:pause` ? "Pausing…" : "Pause"}
                      </Button>
                    )}
                    {d.status && d.status !== "UNPUBLISHED" && (
                      <Button size="sm" variant="ghost" onClick={() => run(d, "unpublish")} disabled={busy !== null}>
                        <EyeOff /> {busy === `${d.channel}:unpublish` ? "Removing…" : "Unpublish"}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {d.channel === "CAREERS_PAGE" && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium">Job page</span>
                    {live && (
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <CopyField value={publicUrl} label="job page link" />
                </div>
              )}
              {d.channel === "WEBSITE_EMBED" && (
                <p className="mt-3 text-[12.5px] text-muted-foreground">
                  Shown in the jobs widget on your own website. Get the embed code in{" "}
                  <Link href="/settings?tab=careers" className="text-primary hover:underline">
                    Settings → Careers &amp; embed
                  </Link>
                  .
                </p>
              )}
            </div>
          );
        })}
      </section>

      <section aria-labelledby="dist-boards" className="space-y-3">
        <div>
          <h2 id="dist-boards" className="text-[13px] font-semibold">Job boards</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Direct posting to these boards isn&apos;t connected yet. Post the job yourself and use the tracked link, so applicants
            arrive here tagged with the right source.
          </p>
        </div>

        {external.map((d) => (
          <div key={d.channel} className="surface-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                <Link2 className="h-4 w-4" />
              </span>
              <span className="text-[13.5px] font-medium">{d.label}</span>
              <Badge variant="outline" className="border-border bg-secondary font-medium text-muted-foreground">
                Not connected
              </Badge>
            </div>
            {d.manualHint && <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{d.manualHint}</p>}
            {d.utmSource && (
              <div className="mt-3 space-y-1.5">
                <span className="text-[12px] font-medium">Tracked link for {d.label}</span>
                <CopyField
                  value={jobUrl(organizationSlug, job, { utm_source: d.utmSource, utm_medium: "job_board" })}
                  label={`${d.label} tracked link`}
                />
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
