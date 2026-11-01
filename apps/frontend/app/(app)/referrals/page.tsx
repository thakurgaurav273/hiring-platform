"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, MapPin, Search, UserPlus, Users } from "lucide-react";
import { PageHeader, Avatar } from "@/components/app-shell";
import { Guard } from "@/components/access-restricted";
import { Filters, useResolvedFilters, type FilterValues } from "@/components/filters";
import { ListToolbar, SearchField } from "@/components/list-toolbar";
import { TableCard, TablePagination, paginate, usePageSize } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageBadge } from "@/components/stage-badge";
import { REFERRAL_JOB_FILTERS } from "@/constants/filters.config";
import { JobStatus } from "@/constants/enums";
import { EMPLOYMENT_LABELS } from "@/lib/careers";
import { useAppStore } from "@/store/app.store";
import { useJobs } from "@/hooks/useJobs";
import { useCandidates } from "@/hooks/useCandidates";

export default function ReferralsPage() {
  return (
    <Guard section="referrals">
      <ReferralsDashboard />
    </Guard>
  );
}

function EmptyState({ icon: Icon, title, body, action }: { icon: typeof Search; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-[13.5px] font-medium">{title}</p>
      <p className="max-w-sm text-[12.5px] text-muted-foreground">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function ReferralsDashboard() {
  const router = useRouter();
  const user = useAppStore((s) => s.authUser);
  const [tab, setTab] = useState<"jobs" | "mine">("jobs");

  const { data: jobsData, isLoading: jobsLoading } = useJobs({ status: JobStatus.OPEN, isReferral: true });
  const openJobs = useMemo(() => jobsData?.data.jobs || [], [jobsData]);

  const [page, setPage] = useState(1);
  const [refSize, setRefSize] = usePageSize("my-referrals");
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({ referredBy: user?.id, page, limit: refSize });
  const myReferrals = candidatesData?.data?.candidates || [];
  const pagination = candidatesData?.data?.pagination;
  const referralTotal = pagination?.total ?? myReferrals.length;
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsSize, setJobsSize] = usePageSize("referral-roles");

  const [q, setQ] = useState("");
  const [rawFilters, setRawFilters] = useState<FilterValues>({});
  const filterData = useMemo(
    () => ({
      departments: openJobs.map((j) => j.department),
      locations: openJobs.map((j) => j.location).filter(Boolean) as string[],
    }),
    [openJobs]
  );
  const { values: filters } = useResolvedFilters(REFERRAL_JOB_FILTERS, filterData, rawFilters);
  const deptF = filters.department ?? [];
  const locF = filters.location ?? [];
  const query = q.trim().toLowerCase();
  const results = openJobs.filter(
    (j) =>
      (!query ||
        j.title.toLowerCase().includes(query) ||
        j.department.toLowerCase().includes(query) ||
        (j.skills ?? []).some((s) => s.toLowerCase().includes(query)) ||
        j.description.toLowerCase().includes(query)) &&
      (deptF.length === 0 || deptF.includes(j.department)) &&
      (locF.length === 0 || (!!j.location && locF.includes(j.location)))
  );
  const filtering = !!query || deptF.length > 0 || locF.length > 0;
  const pagedRoles = paginate(results, jobsPage, jobsSize);
  useEffect(() => setJobsPage(1), [query, rawFilters]);

  return (
    <div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "jobs" | "mine")} className="flex flex-col gap-0 lg:h-[calc(100vh-4rem)]">
        <PageHeader
          title="Referrals"
          description="Refer people from your network and follow how they're doing."
          actions={
            <Link
              href="/referrals/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:bg-primary-hover"
            >
              <UserPlus className="size-3.5" /> Refer someone
            </Link>
          }
          tabs={
            <TabsList variant="line" className="gap-0 rounded-none bg-transparent p-0">
              <TabsTrigger value="jobs" className="rounded-none px-3 pb-2.5 pt-1 text-[13px]">
                Open roles
                <span className="ml-1.5 rounded-full bg-secondary px-1.5 text-[11px] tabular-nums text-muted-foreground">{openJobs.length}</span>
              </TabsTrigger>
              <TabsTrigger value="mine" className="rounded-none px-3 pb-2.5 pt-1 text-[13px]">
                My referrals
                {referralTotal > 0 && (
                  <span className="ml-1.5 rounded-full bg-secondary px-1.5 text-[11px] tabular-nums text-muted-foreground">{referralTotal}</span>
                )}
              </TabsTrigger>
            </TabsList>
          }
        />

        <TabsContent value="jobs" className="mt-0 flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5 md:px-8">
            <ListToolbar
              className="shrink-0"
              search={<SearchField value={q} onChange={setQ} placeholder="Search roles, skills or teams" label="Search open roles" />}
            >
              <Filters config={REFERRAL_JOB_FILTERS} data={filterData} value={filters} onChange={setRawFilters} />
            </ListToolbar>

            <TableCard
              footer={
                !jobsLoading && results.length > 0 ? (
                  <TablePagination
                    page={pagedRoles.page}
                    pageSize={jobsSize}
                    total={results.length}
                    noun={results.length === 1 ? "role" : "roles"}
                    onPageChange={setJobsPage}
                    onPageSizeChange={(n) => {
                      setJobsSize(n);
                      setJobsPage(1);
                    }}
                  />
                ) : undefined
              }
            >
              {jobsLoading ? (
                <div className="divide-y divide-border">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="mt-2 h-3 w-72" />
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                filtering ? (
                  <EmptyState
                    icon={Search}
                    title="No roles match your search"
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
                ) : (
                  <EmptyState icon={Briefcase} title="No open roles right now" body="When your team opens a role for referrals, it shows up here." />
                )
              ) : (
                <ul className="divide-y divide-border">
                  {pagedRoles.rows.map((j) => (
                    <li key={j.id}>
                      <div
                        role="link"
                        tabIndex={0}
                        onClick={() => router.push(`/referrals/job/${j.id}`)}
                        onKeyDown={(e) => e.key === "Enter" && router.push(`/referrals/job/${j.id}`)}
                        className="group flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40 focus-visible:outline-none"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13.5px] font-medium group-hover:text-primary">{j.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="size-3" aria-hidden="true" /> {j.department}
                            </span>
                            {j.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" aria-hidden="true" /> {j.location}
                              </span>
                            )}
                            <span>{EMPLOYMENT_LABELS[j.employmentType] ?? j.employmentType}</span>
                            <span className="sm:hidden">· Posted {new Date(j.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                          </div>
                        </div>
                        <span className="hidden shrink-0 text-[12px] text-muted-foreground sm:block">
                          Posted {new Date(j.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                        <span className="hidden shrink-0 items-center gap-1 text-[12.5px] font-medium text-primary sm:inline-flex">
                          Refer <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TableCard>
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-0 flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5 md:px-8">
            <TableCard
              header={
                <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_140px] gap-4 px-4 py-2.5 md:grid">
                <div>Candidate</div>
                <div>Role</div>
                <div>Referred</div>
                <div className="text-right">Stage</div>
              </div>
              }
              footer={
                !candidatesLoading && referralTotal > 0 ? (
                  <TablePagination
                    page={page}
                    pageSize={refSize}
                    total={referralTotal}
                    noun={referralTotal === 1 ? "referral" : "referrals"}
                    onPageChange={setPage}
                    onPageSizeChange={(n) => {
                      setRefSize(n);
                      setPage(1);
                    }}
                  />
                ) : undefined
              }
            >
              {candidatesLoading ? (
                <Skeleton.Row count={3} />
              ) : myReferrals.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No referrals yet"
                  body="Know someone who'd be great here? Refer them and you can follow their progress on this tab."
                  action={
                    <Button asChild size="sm">
                      <Link href="/referrals/new">
                        <UserPlus /> Refer someone
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {myReferrals.map((app) => {
                    const c = app.candidate;
                    const job = app.job;
                    return (
                      <li
                        key={app.id ?? `${c.id}-${app.jobId}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_140px]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={`${c.firstName} ${c.lastName}`} seed={c.email} size={32} />
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-medium">
                              {c.firstName} {c.lastName}
                            </div>
                            <div className="truncate text-[12px] text-muted-foreground">{c.email}</div>
                          </div>
                        </div>
                        <div className="order-last col-span-2 truncate text-[12.5px] text-muted-foreground md:order-none md:col-span-1">
                          {job?.title ?? "–"}
                        </div>
                        <div className="hidden text-[12.5px] text-muted-foreground md:block">
                          {new Date(app.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div className="justify-self-end">
                          <StageBadge stage={app.currentStage as any} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TableCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
