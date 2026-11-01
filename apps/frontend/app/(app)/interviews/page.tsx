"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader, Avatar } from "@/components/app-shell";
import { Calendar, Video, MapPin } from "lucide-react";
import { Skeleton } from "@/components/skeletons";
import { useInterviews } from "@/hooks/useInterviews";

export default function InterviewsPage() {
  return (
    <Guard section="interviews">
      <InterviewsInner />
    </Guard>
  );
}

function InterviewsInner() {
  const { data: upcomingData, isLoading: loadingUpcoming } = useInterviews({ status: "SCHEDULED", orderBy: "asc" });
  const { data: pastData, isLoading: loadingPast } = useInterviews({ status: "COMPLETED", orderBy: "desc" });

  const upcoming = upcomingData?.interviews || [];
  const past = pastData?.interviews || [];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Workspace" }, { label: "Interviews" }]}
        title="Interviews"
        description="Manage active interview loops and panel assignments"
      />
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Upcoming</div>
          <div className="surface-card divide-y divide-border">
            {loadingUpcoming && <Skeleton.InterviewRow count={4} variant="upcoming" />}
            {!loadingUpcoming && upcoming.map((i) => {
              const c = i.application?.candidate;
              const j = i.application?.job;
              const dateObj = new Date(i.scheduledAt);
              const month = dateObj.toLocaleDateString(undefined, { month: "short" });
              const day = dateObj.getDate();
              const timeString = dateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
              const interviewerNames = i.panelists?.map((p: any) => `${p.interviewer?.firstName} ${p.interviewer?.lastName}`).join(", ") || "Unknown";
              const isVideo = i.location?.toLowerCase().includes("meet") || i.location?.toLowerCase().includes("zoom");

              if (!c) return null;
              return (
                <Link key={i.id} href={`/candidates/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-secondary/40">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary/10 text-primary">
                    <div className="text-center leading-none">
                      <div className="text-[9px] font-medium uppercase tracking-[0.1em]">{month}</div>
                      <div className="font-display text-[15px] font-semibold">{day}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Avatar name={`${c.firstName} ${c.lastName}`} seed={c.email} size={22} />
                      <div className="truncate text-[13px] font-medium">{c.firstName} {c.lastName}</div>
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium capitalize">{i.type.toLowerCase()}</span>
                    </div>
                    <div className="mt-1 truncate text-[11.5px] text-muted-foreground">{j?.title} · with {interviewerNames}</div>
                  </div>
                  <div className="text-right text-[11.5px] text-muted-foreground">
                    <div className="tabular-nums">{timeString}</div>
                    <div className="mt-0.5 flex items-center justify-end gap-1">
                      {!isVideo ? <MapPin className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                      {i.location}
                    </div>
                  </div>
                </Link>
              );
            })}
            {!loadingUpcoming && upcoming.length === 0 && (
              <div className="p-8 text-center text-[13px] text-muted-foreground">No upcoming interviews found.</div>
            )}
          </div>

          <div className="mt-8 mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Recently completed</div>
          <div className="surface-card divide-y divide-border">
            {loadingPast && <Skeleton.InterviewRow count={3} variant="completed" />}
            {!loadingPast && past.map((i) => {
              const c = i.application?.candidate;
              const dateObj = new Date(i.scheduledAt);
              const dateStr = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              const interviewerNames = i.panelists?.map((p: any) => p.interviewer?.firstName).join(", ") || "Unknown";

              if (!c) return null;
              return (
                <Link key={i.id} href={`/candidates/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-secondary/40">
                  <Avatar name={`${c.firstName} ${c.lastName}`} seed={c.email} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{c.firstName} {c.lastName}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground capitalize">{i.type.toLowerCase()} · {interviewerNames} · {dateStr}</div>
                  </div>
                  <span className="rounded-full bg-[oklch(0.94_0.05_155)] px-2 py-0.5 text-[10.5px] font-medium text-[oklch(0.36_0.09_155)]">Completed</span>
                </Link>
              );
            })}
            {!loadingPast && past.length === 0 && (
              <div className="p-8 text-center text-[13px] text-muted-foreground">No completed interviews.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
