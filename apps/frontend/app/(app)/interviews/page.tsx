"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck2, CalendarClock, CalendarRange, CalendarX2, CheckCircle2, ClipboardList, Search } from "lucide-react";
import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { Filters, useResolvedFilters, type FilterValues } from "@/components/filters";
import { ListToolbar, SearchField } from "@/components/list-toolbar";
import { TableCard, TablePagination, paginate, usePageSize } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/skeletons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INTERVIEW_FILTERS } from "@/constants/filters.config";
import { Role } from "@/constants/enums";
import { useAppStore } from "@/store/app.store";
import { useInterviews } from "@/hooks/useInterviews";
import type { Interview } from "@/services/api/interviews.service";
import { PastRow, UpcomingRow } from "@/features/interviews/InterviewRow";
import { InterviewDrawer } from "@/features/interviews/InterviewDrawer";
import { dayLabel, dayOffset, feedbackProgress, fullName, groupByDay, timeOf } from "@/features/interviews/interview-utils";
import { cn } from "@/lib/utils";

type View = "upcoming" | "past" | "cancelled";
const VIEWS: View[] = ["upcoming", "past", "cancelled"];

export default function InterviewsPage() {
  return (
    <Guard section="interviews">
      <Suspense fallback={null}>
        <InterviewsInner />
      </Suspense>
    </Guard>
  );
}

function Stat({ icon: Icon, label, value, hint, tone }: { icon: typeof Search; label: string; value: React.ReactNode; hint?: string; tone?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 sm:px-4 sm:py-3">
      <span className={cn("tone-soft hidden size-9 shrink-0 place-items-center rounded-lg sm:grid", tone)} aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[12px] text-muted-foreground">{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[20px] font-semibold tabular-nums leading-tight">{value}</span>
          {hint && <span className="truncate text-[12px] text-muted-foreground">{hint}</span>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, action }: { icon: typeof Search; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-[13.5px] font-medium">{title}</p>
      <p className="max-w-sm text-[12.5px] text-muted-foreground">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function InterviewsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const role = useAppStore((s) => s.role);
  const canManage = role === Role.ADMINISTRATOR || role === Role.HIRING_MANAGER;
  const requested = params.get("view") as View | null;
  const view: View = requested && VIEWS.includes(requested) ? requested : "upcoming";
  const setView = (v: View) => router.replace(v === "upcoming" ? "/interviews" : `/interviews?view=${v}`, { scroll: false });

  const upcomingQ = useInterviews({ status: "SCHEDULED", orderBy: "asc", limit: 200 });
  const pastQ = useInterviews({ status: "COMPLETED", orderBy: "desc", limit: 200 });
  const cancelledQ = useInterviews({ status: "CANCELLED", orderBy: "desc", limit: 200 });
  const upcoming = useMemo(() => upcomingQ.data?.interviews ?? [], [upcomingQ.data]);
  const past = useMemo(() => pastQ.data?.interviews ?? [], [pastQ.data]);
  const cancelled = useMemo(() => cancelledQ.data?.interviews ?? [], [cancelledQ.data]);
  const all = useMemo(() => [...upcoming, ...past, ...cancelled], [upcoming, past, cancelled]);

  // Keep "In progress / Starts in" labels fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // Search + filters
  const [q, setQ] = useState("");
  const [rawFilters, setRawFilters] = useState<FilterValues>({});
  const filterData = useMemo(() => {
    const jobs = new Map<string, { id: string; title: string }>();
    const people = new Map<string, { id: string; name: string }>();
    for (const i of all) {
      if (i.application?.job) jobs.set(i.application.job.id, { id: i.application.job.id, title: i.application.job.title });
      for (const p of i.panelists) people.set(p.interviewerId, { id: p.interviewerId, name: fullName(p.interviewer) });
    }
    return { jobs: [...jobs.values()], interviewers: [...people.values()] };
  }, [all]);
  const { values: filters } = useResolvedFilters(INTERVIEW_FILTERS, filterData, rawFilters);
  const query = q.trim().toLowerCase();
  const matches = (i: Interview) => {
    const c = i.application?.candidate;
    if (query) {
      const hay = `${c ? fullName(c) : ""} ${c?.email ?? ""} ${i.application?.job.title ?? ""} ${i.panelists.map((p) => fullName(p.interviewer)).join(" ")}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    if (filters.type?.length && !filters.type.includes(i.type)) return false;
    if (filters.job?.length && !filters.job.includes(i.application?.job.id ?? "")) return false;
    if (filters.interviewer?.length && !i.panelists.some((p) => filters.interviewer.includes(p.interviewerId))) return false;
    if (filters.feedback?.length) {
      const fb = feedbackProgress(i);
      if (filters.feedback[0] === "awaiting" && (i.status !== "COMPLETED" || fb.complete)) return false;
      if (filters.feedback[0] === "complete" && !fb.complete) return false;
    }
    return true;
  };
  const filtering = !!query || Object.values(filters).some((v) => v?.length);

  const source = view === "upcoming" ? upcoming : view === "past" ? past : cancelled;
  const loading = view === "upcoming" ? upcomingQ.isLoading : view === "past" ? pastQ.isLoading : cancelledQ.isLoading;
  const shown = source.filter(matches);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("interviews");
  useEffect(() => setPage(1), [view, query, rawFilters]);
  const paged = paginate(shown, page, pageSize);
  const groups = groupByDay(paged.rows);

  // Stats (unfiltered)
  const now = new Date();
  const today = upcoming.filter((i) => dayOffset(new Date(i.scheduledAt), now) === 0);
  const nextToday = today.find((i) => new Date(i.scheduledAt).getTime() + i.durationMins * 60_000 > now.getTime());
  const thisWeek = upcoming.filter((i) => {
    const off = dayOffset(new Date(i.scheduledAt), now);
    return off >= 0 && off < 7;
  });
  const awaiting = past.filter((i) => !feedbackProgress(i).complete);
  const statsLoading = upcomingQ.isLoading || pastQ.isLoading;

  // Drawer
  const [openId, setOpenId] = useState<string | null>(null);
  const openInterview = all.find((i) => i.id === openId) ?? null;

  const count = (n: number) => <span className="ml-1.5 rounded-full bg-secondary px-1.5 text-[11px] tabular-nums text-muted-foreground">{n}</span>;

  return (
    <div className="flex flex-col lg:h-[calc(100vh-4rem)]">
      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="shrink-0">
        <PageHeader
          title="Interviews"
          description="Your interview schedule, panels and feedback."
          tabs={
            <TabsList variant="line" className="gap-0 rounded-none bg-transparent p-0">
              <TabsTrigger value="upcoming" className="rounded-none px-3 pb-2.5 pt-1 text-[13px]">
                Upcoming{!upcomingQ.isLoading && count(upcoming.length)}
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-none px-3 pb-2.5 pt-1 text-[13px]">
                Past{!pastQ.isLoading && count(past.length)}
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-none px-3 pb-2.5 pt-1 text-[13px]">
                Cancelled{!cancelledQ.isLoading && cancelled.length > 0 && count(cancelled.length)}
              </TabsTrigger>
            </TabsList>
          }
        />
      </Tabs>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5 md:px-8">
        {/* Summary */}
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          <Stat
            icon={CalendarClock}
            tone="[--tone:var(--color-primary)]"
            label="Today"
            value={statsLoading ? "–" : today.length}
            hint={nextToday ? `next at ${timeOf(new Date(nextToday.scheduledAt))}` : today.length ? "all done" : "nothing scheduled"}
          />
          <Stat icon={CalendarRange} tone="[--tone:var(--color-info)]" label="Next 7 days" value={statsLoading ? "–" : thisWeek.length} hint="interviews" />
          <Stat
            icon={ClipboardList}
            tone="[--tone:var(--color-warning)]"
            label="Awaiting feedback"
            value={statsLoading ? "–" : awaiting.length}
            hint={awaiting.length === 1 ? "interview" : "interviews"}
          />
          <Stat icon={CheckCircle2} tone="[--tone:var(--color-success)]" label="Completed" value={statsLoading ? "–" : past.length} hint="all time" />
        </div>

        <ListToolbar
          className="shrink-0"
          search={<SearchField value={q} onChange={setQ} placeholder="Search candidate, job or panel" label="Search interviews" />}
          summary={!loading && filtering ? `${shown.length} of ${source.length} match` : undefined}
        >
          <Filters config={INTERVIEW_FILTERS} data={filterData} value={filters} onChange={setRawFilters} />
        </ListToolbar>

        <TableCard
          header={
            view !== "upcoming" && !loading && shown.length > 0 ? (
              <div className="hidden grid-cols-[84px_minmax(0,1.5fr)_110px_minmax(0,1fr)_170px] gap-x-4 px-4 py-2.5 md:grid">
                <span>When</span>
                <span>Candidate</span>
                <span>Round</span>
                <span>Panel</span>
                <span className="text-right">{view === "past" ? "Feedback" : "Status"}</span>
              </div>
            ) : undefined
          }
          footer={
            !loading && shown.length > 0 ? (
              <TablePagination
                page={paged.page}
                pageSize={pageSize}
                total={shown.length}
                noun={shown.length === 1 ? "interview" : "interviews"}
                onPageChange={setPage}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
              />
            ) : undefined
          }
        >
          {loading ? (
            <Skeleton.InterviewRow count={5} variant={view === "upcoming" ? "upcoming" : "completed"} />
          ) : shown.length === 0 ? (
            filtering ? (
              <EmptyState
                icon={Search}
                title="No interviews match your search"
                body="Try a different keyword or clear the filters."
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQ("");
                      setRawFilters({});
                    }}
                  >
                    Clear search and filters
                  </Button>
                }
              />
            ) : view === "upcoming" ? (
              <EmptyState
                icon={CalendarClock}
                title="No upcoming interviews"
                body="Schedule an interview from a candidate's profile and it shows up here with the panel and meeting link."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href="/candidates">Go to candidates</Link>
                  </Button>
                }
              />
            ) : view === "past" ? (
              <EmptyState icon={CalendarCheck2} title="No completed interviews yet" body="Interviews move here once their time has passed." />
            ) : (
              <EmptyState icon={CalendarX2} title="No cancelled interviews" body="Cancelled interviews are kept here for reference." />
            )
          ) : view === "upcoming" ? (
            groups.map((g, gi) => {
              const label = dayLabel(g.date);
              return (
                <section key={g.key} aria-label={`${label.primary} ${label.secondary}`}>
                  <div className={cn("sticky top-0 z-10 flex items-baseline gap-2 border-b border-border bg-surface-2 px-4 py-2 text-[12px]", gi > 0 && "border-t")}>
                    <span className={cn("font-semibold", dayOffset(g.date) === 0 && "text-primary")}>{label.primary}</span>
                    {label.secondary && <span className="text-muted-foreground">{label.secondary}</span>}
                    <span className="ml-auto tabular-nums text-muted-foreground">
                      {g.items.length} {g.items.length === 1 ? "interview" : "interviews"}
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {g.items.map((i) => (
                      <UpcomingRow key={i.id} interview={i} onOpen={() => setOpenId(i.id)} />
                    ))}
                  </ul>
                </section>
              );
            })
          ) : (
            <>
              <ul className="divide-y divide-border">
                {paged.rows.map((i) => (
                  <PastRow key={i.id} interview={i} onOpen={() => setOpenId(i.id)} />
                ))}
              </ul>
            </>
          )}
        </TableCard>
      </div>

      <InterviewDrawer interview={openInterview} open={!!openInterview} onOpenChange={(o) => !o && setOpenId(null)} canManage={canManage} />
    </div>
  );
}
