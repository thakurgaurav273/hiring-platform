"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Check, CheckCircle2, Clock, Copy, ExternalLink, Loader2, MapPin, Phone, Star, Video, XCircle } from "lucide-react";
import { Drawer } from "@/components/drawer";
import { Avatar } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateInterview } from "@/hooks/useInterviews";
import type { Interview } from "@/services/api/interviews.service";
import { copyText } from "@/lib/copy-text";
import { errorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { TypeBadge } from "./InterviewRow";
import { endOf, feedbackProgress, fullName, liveState, placeIsPhone, placeIsVideo, RECOMMENDATION_LABEL, RECOMMENDATION_TONE, timeOf } from "./interview-utils";

const STATUS_LABEL: Record<Interview["status"], string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESCHEDULED: "Rescheduled",
};

function Detail({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-[13px]">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function InterviewDrawer({
  interview,
  open,
  onOpenChange,
  canManage,
}: {
  interview: Interview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Administrators and hiring managers can complete or cancel. */
  canManage: boolean;
}) {
  const update = useUpdateInterview();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!interview) return null;

  const i = interview;
  const c = i.application?.candidate;
  const start = new Date(i.scheduledAt);
  const fb = feedbackProgress(i);
  const live = liveState(i);
  const started = start.getTime() <= Date.now();
  const PlaceIcon = placeIsVideo(i) ? Video : placeIsPhone(i) ? Phone : MapPin;

  const setStatus = (status: Interview["status"], done: string) =>
    update.mutate(
      { id: i.id, data: { status } },
      {
        onSuccess: () => {
          toast.success(done);
          setConfirmCancel(false);
          onOpenChange(false);
        },
        onError: (e) => toast.error(errorMessage(e, "Couldn't update the interview")),
      }
    );

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        title={INTERVIEW_TITLE(i)}
        description={c ? `${fullName(c)} · ${i.application?.job.title ?? ""}` : undefined}
        className="sm:max-w-[460px]"
        footer={
          <>
            {canManage && i.status === "SCHEDULED" && (
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmCancel(true)} disabled={update.isPending}>
                <XCircle /> Cancel interview
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              {canManage && i.status === "SCHEDULED" && started && (
                <Button variant="outline" onClick={() => setStatus("COMPLETED", "Marked as completed")} disabled={update.isPending}>
                  {update.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Mark completed
                </Button>
              )}
              {i.status === "SCHEDULED" && i.meetingLink ? (
                <Button asChild>
                  <a href={i.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Video /> Join call
                  </a>
                </Button>
              ) : (
                c && (
                  <Button asChild variant={i.status === "SCHEDULED" ? "default" : "outline"}>
                    <Link href={`/candidates/${c.id}`}>Open profile</Link>
                  </Button>
                )
              )}
            </div>
          </>
        }
      >
        <div className="space-y-6">
          {/* Candidate */}
          {c && (
            <Link href={`/candidates/${c.id}`} className="group flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-secondary/40">
              <Avatar name={fullName(c)} seed={c.email} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium group-hover:text-primary">{fullName(c)}</div>
                <div className="truncate text-[12px] text-muted-foreground">{c.email}</div>
              </div>
              <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </Link>
          )}

          {/* When & where */}
          <section aria-label="When and where" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={i.type} />
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  i.status === "COMPLETED" ? "tone-soft [--tone:var(--color-success)]" : i.status === "CANCELLED" ? "bg-secondary text-muted-foreground" : "tone-soft [--tone:var(--color-info)]"
                )}
              >
                {STATUS_LABEL[i.status]}
              </span>
              {live && <span className="tone-soft rounded-full px-2 py-0.5 text-[11px] font-medium [--tone:var(--color-warning)]">{live.label}</span>}
            </div>
            <Detail icon={CalendarClock}>
              <div className="font-medium">{start.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              <div className="text-muted-foreground">
                {timeOf(start)} – {timeOf(endOf(i))} · {i.durationMins} min
              </div>
            </Detail>
            <Detail icon={PlaceIcon}>
              <div className="font-medium">{i.location || (i.meetingLink ? "Video call" : "Location to be confirmed")}</div>
              {i.meetingLink && (
                <div className="mt-1 flex min-w-0 items-center gap-1.5">
                  <a href={i.meetingLink} target="_blank" rel="noopener noreferrer" className="truncate text-[12.5px] text-primary hover:underline">
                    {i.meetingLink.replace(/^https?:\/\//, "")}
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await copyText(i.meetingLink!)) {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }
                    }}
                    className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Copy meeting link"
                  >
                    {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              )}
            </Detail>
          </section>

          {/* Panel & feedback */}
          <section aria-labelledby="panel-title">
            <div className="mb-2 flex items-center justify-between">
              <h3 id="panel-title" className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Panel
              </h3>
              {i.status !== "CANCELLED" && (
                <span className="text-[12px] text-muted-foreground">
                  {fb.submitted}/{fb.expected} feedback
                  {fb.avg !== null && <> · {fb.avg.toFixed(1)} avg</>}
                </span>
              )}
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {i.panelists.map((p) => {
                const f = (i.feedbacks ?? []).find((x) => x.interviewerId === p.interviewerId);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar name={fullName(p.interviewer)} seed={p.interviewer.email} size={28} url={p.interviewer.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{fullName(p.interviewer)}</div>
                      <div className="truncate text-[11.5px] text-muted-foreground">{p.interviewer.email}</div>
                    </div>
                    {f ? (
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="inline-flex items-center gap-0.5 text-[12px] tabular-nums">
                          <Star className="size-3 fill-warning text-warning" aria-hidden="true" />
                          {f.rating}
                          <span className="sr-only">out of 5</span>
                        </span>
                        <span className={cn("tone-soft rounded-full px-2 py-0.5 text-[11px] font-medium", RECOMMENDATION_TONE[f.recommendation])}>
                          {RECOMMENDATION_LABEL[f.recommendation]}
                        </span>
                      </span>
                    ) : i.status === "CANCELLED" ? null : (
                      <span className="shrink-0 text-[11.5px] text-muted-foreground">{i.status === "SCHEDULED" && !started ? "Not yet" : "Pending"}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            {c && i.status === "COMPLETED" && (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Written comments are on the{" "}
                <Link href={`/candidates/${c.id}`} className="font-medium text-primary hover:underline">
                  candidate&apos;s profile
                </Link>
                .
              </p>
            )}
          </section>
        </div>
      </Drawer>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this interview?</AlertDialogTitle>
            <AlertDialogDescription>
              {c ? fullName(c) : "The candidate"}&apos;s {INTERVIEW_TITLE(i).toLowerCase()} on {start.toLocaleDateString(undefined, { day: "numeric", month: "short" })} at {timeOf(start)} will be marked as cancelled and the panel
              will be notified. The candidate isn&apos;t emailed automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={update.isPending}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={update.isPending}
              onClick={(e) => {
                e.preventDefault();
                setStatus("CANCELLED", "Interview cancelled");
              }}
            >
              {update.isPending && <Loader2 className="animate-spin" />} Cancel interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const TITLES: Record<Interview["type"], string> = {
  SCREENING: "Screening call",
  TECHNICAL: "Technical interview",
  HR: "HR interview",
  MANAGERIAL: "Managerial interview",
  FINAL: "Final interview",
};
function INTERVIEW_TITLE(i: Interview) {
  return TITLES[i.type] ?? "Interview";
}
