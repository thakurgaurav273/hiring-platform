"use client";

import { MapPin, Phone, Star, Video } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import { INTERVIEW_TYPE_LABELS } from "@/constants/filters.config";
import type { Interview } from "@/services/api/interviews.service";
import { cn } from "@/lib/utils";
import { endOf, feedbackProgress, fullName, liveState, placeIsPhone, placeIsVideo, timeOf, TYPE_TONE } from "./interview-utils";

export function TypeBadge({ type }: { type: Interview["type"] }) {
  return (
    <span className={cn("tone-soft inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium", TYPE_TONE[type])}>
      {INTERVIEW_TYPE_LABELS[type] ?? type}
    </span>
  );
}

export function PanelStack({ interview, max = 3 }: { interview: Interview; max?: number }) {
  const people = interview.panelists.map((p) => p.interviewer).filter(Boolean);
  const shown = people.slice(0, max);
  const names = people.map(fullName).join(", ");
  return (
    <div className="flex min-w-0 items-center gap-2" title={names}>
      <div className="flex shrink-0 -space-x-1.5">
        {shown.map((p) => (
          <span key={p.id} className="rounded-full ring-2 ring-surface">
            <Avatar name={fullName(p)} seed={p.email} size={22} url={p.avatarUrl} />
          </span>
        ))}
        {people.length > max && (
          <span className="grid size-[22px] place-items-center rounded-full bg-secondary text-[10px] font-medium ring-2 ring-surface">+{people.length - max}</span>
        )}
      </div>
      <span className="truncate text-[12px] text-muted-foreground">
        {people.length === 1 ? fullName(people[0]) : `${people[0] ? people[0].firstName : ""} +${people.length - 1}`}
      </span>
      <span className="sr-only">Panel: {names}</span>
    </div>
  );
}

function Place({ interview: i }: { interview: Interview }) {
  const Icon = placeIsVideo(i) ? Video : placeIsPhone(i) ? Phone : MapPin;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground">
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{i.location || (i.meetingLink ? "Video call" : "Location to be confirmed")}</span>
    </span>
  );
}

/** Upcoming interview row: time, candidate, round, panel, where, and a join button when it's close. */
export function UpcomingRow({ interview: i, onOpen }: { interview: Interview; onOpen: () => void }) {
  const c = i.application?.candidate;
  const live = liveState(i);
  const start = new Date(i.scheduledAt);
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
        className={cn(
          "group grid cursor-pointer grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40 focus-visible:outline-none md:grid-cols-[84px_minmax(0,1.5fr)_110px_minmax(0,1fr)_minmax(0,1fr)_168px]",
          live?.tone === "live" && "bg-success/[0.04]"
        )}
      >
        <div className="row-span-2 md:row-span-1">
          <div className="text-[13.5px] font-semibold tabular-nums">{timeOf(start)}</div>
          <div className="text-[11.5px] tabular-nums text-muted-foreground">{i.durationMins} min</div>
        </div>

        <div className="flex min-w-0 items-center gap-2.5">
          {c && <Avatar name={fullName(c)} seed={c.email} size={30} />}
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-medium group-hover:text-primary">{c ? fullName(c) : "Candidate"}</div>
            <div className="truncate text-[12px] text-muted-foreground">{i.application?.job.title}</div>
          </div>
        </div>

        <div className="justify-self-end md:justify-self-start">
          <TypeBadge type={i.type} />
        </div>

        <div className="col-start-2 col-end-4 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 md:col-auto md:block">
          <span className="md:hidden">
            <Place interview={i} />
          </span>
          <PanelStack interview={i} />
        </div>

        <div className="hidden min-w-0 md:block">
          <Place interview={i} />
        </div>

        <div className="col-start-2 col-end-4 flex items-center justify-end gap-2 md:col-auto" onClick={(e) => e.stopPropagation()}>
          {live && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
                live.tone === "live" ? "tone-soft [--tone:var(--color-success)]" : "tone-soft [--tone:var(--color-warning)]"
              )}
            >
              {live.tone === "live" && <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />}
              {live.label}
            </span>
          )}
          {i.meetingLink && (
            <a
              href={i.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition",
                live ? "bg-primary text-primary-foreground hover:bg-primary-hover" : "text-primary hover:bg-primary/10"
              )}
            >
              <Video className="size-3.5" aria-hidden="true" /> Join
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

/** Past or cancelled interview row: date, candidate, round, panel, feedback status. */
export function PastRow({ interview: i, onOpen }: { interview: Interview; onOpen: () => void }) {
  const c = i.application?.candidate;
  const start = new Date(i.scheduledAt);
  const fb = feedbackProgress(i);
  const cancelled = i.status === "CANCELLED";
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
        className="group grid cursor-pointer grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40 focus-visible:outline-none md:grid-cols-[84px_minmax(0,1.5fr)_110px_minmax(0,1fr)_170px]"
      >
        <div className="row-span-2 md:row-span-1">
          <div className="text-[13px] font-medium tabular-nums">{start.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>
          <div className="text-[11.5px] tabular-nums text-muted-foreground">
            {timeOf(start)}–{timeOf(endOf(i))}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2.5">
          {c && <Avatar name={fullName(c)} seed={c.email} size={30} />}
          <div className="min-w-0">
            <div className={cn("truncate text-[13.5px] font-medium group-hover:text-primary", cancelled && "text-muted-foreground line-through decoration-muted-foreground/50")}>
              {c ? fullName(c) : "Candidate"}
            </div>
            <div className="truncate text-[12px] text-muted-foreground">{i.application?.job.title}</div>
          </div>
        </div>
        <div className="justify-self-end md:justify-self-start">
          <TypeBadge type={i.type} />
        </div>
        <div className="col-start-2 min-w-0 md:col-auto">
          <PanelStack interview={i} />
        </div>
        <div className="col-start-3 justify-self-end md:col-auto">
          {cancelled ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Cancelled</span>
          ) : fb.complete ? (
            <span className="inline-flex items-center gap-1.5 text-[12px]">
              <span className="tone-soft rounded-full px-2 py-0.5 text-[11px] font-medium [--tone:var(--color-success)]">
                {fb.submitted}/{fb.expected} feedback
              </span>
              {fb.avg !== null && (
                <span className="inline-flex items-center gap-0.5 tabular-nums text-muted-foreground">
                  <Star className="size-3 fill-warning text-warning" aria-hidden="true" />
                  {fb.avg.toFixed(1)}
                  <span className="sr-only">average rating</span>
                </span>
              )}
            </span>
          ) : (
            <span className="tone-soft rounded-full px-2 py-0.5 text-[11px] font-medium [--tone:var(--color-warning)]">
              Awaiting {fb.expected - fb.submitted} of {fb.expected}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
