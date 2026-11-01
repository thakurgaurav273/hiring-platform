"use client";

import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { Guard } from "@/components/access-restricted";
import { Search, Filter, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/skeletons";
import { CandidateRow } from "@/features/candidates/CandidateRow";
import { CandidateFilters } from "@/features/candidates/CandidateFilters";
import { Role } from "@/constants/enums";
import type { Stage } from "@/lib/types";
import { useCandidates } from "@/hooks/useCandidates";
import { useJobs } from "@/hooks/useJobs";

export default function CandidatesPage() {
  return (
    <Guard section="candidates">
      <CandidatesInner />
    </Guard>
  );
}

function CandidatesInner() {
  const { data: jobsData } = useJobs({ limit: 100 });
  const visibleJobs = jobsData?.data?.jobs || [];
  const role = useAppStore((s) => s.role);

  const scopedJobIds = useMemo(() => new Set(visibleJobs.map((j) => j.id)), [visibleJobs]);
  const departments = useMemo(() => Array.from(new Set(visibleJobs.map((j) => j.department).filter(Boolean))), [visibleJobs]);

  const [ui, setUi] = useState({
    q: "",
    stageF: [] as Stage[],
    jobF: [] as string[],
    deptF: [] as string[],
    page: 1,
    showFilters: false,
  });

  const { q, stageF, jobF, deptF, page, showFilters } = ui;

  const setQ = (v: string) => setUi((f) => ({ ...f, q: v, page: 1 }));
  const setStageF = (v: Stage[]) => setUi((f) => ({ ...f, stageF: v, page: 1 }));
  const setJobF = (v: string[]) => setUi((f) => ({ ...f, jobF: v, page: 1 }));
  const setDeptF = (v: string[]) => setUi((f) => ({ ...f, deptF: v, page: 1 }));
  const setPage = (fn: (p: number) => number) => setUi((f) => ({ ...f, page: fn(f.page) }));
  const setShowFilters = (v: boolean) => setUi((f) => ({ ...f, showFilters: v }));

  const filteredJobsForFilter = useMemo(() => {
    if (deptF.length === 0) return visibleJobs;
    return visibleJobs.filter((j) => deptF.includes(j.department));
  }, [visibleJobs, deptF]);

  // Fetch from backend
  const { data, isLoading } = useCandidates({
    page,
    limit: 20,
    search: q || undefined,
    department: deptF.length > 0 ? deptF : undefined,
    stage: stageF.length > 0 ? stageF : undefined,
    jobId: jobF.length > 0 ? jobF : undefined,
  });

  const candidatesRes = data?.data?.candidates ?? [];
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const rows = useMemo(() => {
    return candidatesRes.map((app: any) => ({
      id: app.candidate.id,
      name: `${app.candidate.firstName} ${app.candidate.lastName}`,
      jobId: app.job.id,
      jobTitle: app.job.title,
      location: app.candidate.location,
      referredBy: app.candidate.referredBy,
      appliedAt: app.createdAt,
      stage: app.currentStage,
      avatarSeed: app.candidate.email,
    }));
  }, [candidatesRes]);

  const hasActiveFilters = stageF.length > 0 || jobF.length > 0 || deptF.length > 0;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Workspace" }, { label: "Candidates" }]}
        title="Candidates"
        description="Review and screen active applications for open positions"
      />

      <div className="px-4 py-6 md:px-8">
        {/* Search + filter toolbar */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, title…"
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={"inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition " + (showFilters ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface hover:bg-secondary")}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters{" "}
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground">
                  {stageF.length + jobF.length + deptF.length}
                </span>
              )}
            </button>
            <button onClick={() => { setDeptF([]); setStageF([]); setJobF([]); }} className="text-[11px] text-muted-foreground hover:text-foreground ml-1 font-medium underline underline-offset-2">Clear all filters</button>
          </div>

          {showFilters && (
            <CandidateFilters
              role={role}
              departments={departments}
              filteredJobsForFilter={filteredJobsForFilter}
              stageF={stageF}
              jobF={jobF}
              deptF={deptF}
              setStageF={setStageF}
              setJobF={setJobF}
              setDeptF={setDeptF}
            />
          )}
        </div>

        {/* Table */}
        <div className="surface-card overflow-hidden">
          <div className="hidden lg:grid grid-cols-6 gap-x-4 border-b border-border bg-surface-2 px-5 py-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <div>Candidate Name</div>
            <div>Job</div>
            <div>Location</div>
            <div>Referred By</div>
            <div>Referred On</div>
            <div className="text-right">Stage</div>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {isLoading ? (
              <Skeleton.Row count={6} />
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-[13px]">No candidates found.</div>
            ) : (
              rows.map((c: any) => <CandidateRow key={c.id} candidate={c} />)
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
            <div>Page {page} of {totalPages} {pagination?.total ? `(${pagination.total} total)` : ""}</div>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-7 rounded-md border border-border bg-surface px-2.5 text-[12px] hover:bg-secondary disabled:opacity-40">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 rounded-md border border-border bg-surface px-2.5 text-[12px] hover:bg-secondary disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
