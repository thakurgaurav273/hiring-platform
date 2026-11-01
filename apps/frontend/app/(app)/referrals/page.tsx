"use client";

import { PageHeader, Avatar } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { Search as SearchIcon, Briefcase, MapPin, Clock, UserPlus } from "lucide-react";
import { Filters, useResolvedFilters, type FilterValues } from "@/components/filters";
import { REFERRAL_JOB_FILTERS } from "@/constants/filters.config";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { StageBadge } from "@/components/stage-badge";
import { JobStatus } from "@/constants/enums";
import { useJobs } from "@/hooks/useJobs";
import { useCandidates } from "@/hooks/useCandidates";

export default function ReferralsPage() {
  return (
    <Guard section="referrals">
      <ReferralsDashboard />
    </Guard>
  );
}

function ReferralsDashboard() {
  const router = useRouter();
  const user = useAppStore(s => s.authUser);

  const { data: jobsData, isLoading: jobsLoading } = useJobs({ status: JobStatus.OPEN, isReferral: true });
  const openJobs = useMemo(() => jobsData?.data.jobs || [], [jobsData]);

  const [page, setPage] = useState(1);
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({ referredBy: user?.id, page, limit: 15 });
  const myReferrals = candidatesData?.data?.candidates || [];
  const pagination = candidatesData?.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const [ui, setUi] = useState({
    q: "",
    filters: {} as FilterValues,
  });
  const filterData = useMemo(
    () => ({
      departments: openJobs.map((j) => j.department),
      locations: openJobs.map((j) => j.location).filter(Boolean) as string[],
    }),
    [openJobs]
  );
  const { values: filters } = useResolvedFilters(REFERRAL_JOB_FILTERS, filterData, ui.filters);
  const deptF = filters.department ?? [];
  const locF = filters.location ?? [];
  const results = openJobs.filter((j) =>
    (!ui.q || j.title.toLowerCase().includes(ui.q.toLowerCase()) || j.description.toLowerCase().includes(ui.q.toLowerCase())) &&
    (deptF.length === 0 || deptF.includes(j.department)) &&
    (locF.length === 0 || (!!j.location && locF.includes(j.location)))
  );

  return (
    <div>
      <Tabs defaultValue="jobs">
        <PageHeader
          breadcrumbs={[{ label: "Referrals" }]}
          title="Employee Referrals"
          description="Refer your network and track their progress"
          actions={
            <Link href="/referrals/new" className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90">
              <UserPlus className="h-3.5 w-3.5" /> Add Referral
            </Link>
          }
          tabs={
            <TabsList variant="line" className="gap-0 rounded-none bg-transparent p-0">
              <TabsTrigger value="jobs" className="rounded-none px-4 pb-3 pt-1 text-[13px]">Jobs</TabsTrigger>
              <TabsTrigger value="my-referrals" className="rounded-none px-4 pb-3 pt-1 text-[13px]">My Referrals</TabsTrigger>
            </TabsList>
          }
        />

        <div className="w-full">
          <TabsContent value="jobs" className="mt-0">
            <div className="px-4 pt-6 md:px-8">
              <div className="surface-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[240px] flex-1">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="search" value={ui.q} onChange={(e) => setUi(p => ({ ...p, q: e.target.value }))} placeholder="Search roles, skills, teams…" aria-label="Search open roles" className="pl-9" />
                  </div>
                  <Filters config={REFERRAL_JOB_FILTERS} data={filterData} value={filters} onChange={(v) => setUi(p => ({ ...p, filters: v }))} />
                </div>
              </div>
            <div className="mt-4 text-[12px] text-muted-foreground">Showing {results.length} of {openJobs.length} open roles</div>
            </div>

            {jobsLoading ? (
              <div className="px-4 py-8 md:px-8 text-center text-muted-foreground text-[13px]">Loading jobs...</div>
            ) : (
              <>
                <div className="mt-2 flex flex-col">
                  <div className="divide-y divide-border border-y border-border">
                    {results.map((j) => (
                      <div
                        key={j.id}
                        onClick={() => router.push(`/referrals/job/${j.id}`)}
                        className="group flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 py-5 md:px-8 transition hover:bg-secondary/40 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <Link href={`/referrals/job/${j.id}`} className="block text-[15px] font-medium text-foreground hover:underline group-hover:text-primary">
                            {j.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {j.department}</span>
                            {j.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {j.location}</span>}
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {j.employmentType}</span>
                          </div>
                        </div>
                        <div className="text-[12px] text-muted-foreground md:text-right shrink-0">
                          Posted {new Date(j.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {results.length === 0 && (
                  <div className="mt-10 grid place-items-center rounded-xl border border-dashed border-border p-10 text-center">
                    <div className="text-[13px] font-medium">No matching roles</div>
                    <div className="mt-1 text-[12px] text-muted-foreground">Try broadening your filters or searching a different keyword.</div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="my-referrals" className="mt-0">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
            {candidatesLoading ? (
              <div className="py-8 text-center text-muted-foreground text-[13px]">Loading referrals...</div>
            ) : myReferrals.length > 0 ? (
              <div>
              <div className="divide-y divide-border border-y border-border">
                {myReferrals.map((app) => {
                  const c = app.candidate;
                  const job = app.job;
                  return (
                    <div key={c.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                      {/* Candidate info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={`${c.firstName} ${c.lastName}`} seed={c.email} size={36} />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-foreground">{c.firstName} {c.lastName}</div>
                          <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{c.email}</div>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12.5px] text-muted-foreground sm:ml-auto sm:mr-6">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          {job?.title || app.jobId}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {new Date(app.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      {/* Stage */}
                      <div className="shrink-0">
                        <StageBadge stage={app.currentStage as any} />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-[12px] text-muted-foreground">
                  <div>Page {page} of {totalPages} {pagination?.total ? `(${pagination.total} total)` : ""}</div>
                  <div className="flex gap-1">
                    <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-7 rounded-md border border-border bg-surface px-2.5 text-[12px] hover:bg-secondary disabled:opacity-40">Previous</button>
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 rounded-md border border-border bg-surface px-2.5 text-[12px] hover:bg-secondary disabled:opacity-40">Next</button>
                  </div>
                </div>
              ) : null}
              </div>
            ) : (
              <div className="mt-10 grid place-items-center rounded-xl border border-dashed border-border p-10 text-center">
                <div className="text-[13px] font-medium">No referrals yet</div>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  Refer someone from your network to get started.{" "}
                  <Link href="/referrals/new" className="text-foreground underline">Add a referral</Link>
                </div>
              </div>
            )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
