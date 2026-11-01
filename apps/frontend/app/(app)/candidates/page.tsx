"use client";

import { PageHeader } from "@/components/app-shell";
import { Guard } from "@/components/access-restricted";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/skeletons";
import { CandidateRow } from "@/features/candidates/CandidateRow";
import { Filters, multi, useResolvedFilters, type FilterValues } from "@/components/filters";
import { CANDIDATE_FILTERS } from "@/constants/filters.config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const visibleJobs = useMemo(() => jobsData?.data?.jobs || [], [jobsData]);


  const filterData = useMemo(() => ({ jobs: visibleJobs }), [visibleJobs]);
  const [ui, setUi] = useState({
    q: "",
    filters: {} as FilterValues,
    page: 1,
  });
  const { q, page } = ui;
  const { values: filters } = useResolvedFilters(CANDIDATE_FILTERS, filterData, ui.filters);
  const setQ = (v: string) => setUi((f) => ({ ...f, q: v, page: 1 }));
  const setFilters = (v: FilterValues) => setUi((f) => ({ ...f, filters: v, page: 1 }));
  const setPage = (fn: (p: number) => number) => setUi((f) => ({ ...f, page: fn(f.page) }));

  // Fetch from backend
  const { data, isLoading } = useCandidates({
    page,
    limit: 20,
    search: q || undefined,
    department: multi(filters, "department"),
    stage: multi(filters, "stage") as Stage[] | undefined,
    jobId: multi(filters, "job"),
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


  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Workspace" }, { label: "Candidates" }]}
        title="Candidates"
        description="Review and screen active applications for open positions"
      />

      <div className="px-4 py-6 md:px-8">
        {/* Search + filter toolbar */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, title…"
                aria-label="Search candidates"
                className="pl-9"
              />
            </div>
            <Filters config={CANDIDATE_FILTERS} data={filterData} value={filters} onChange={setFilters} />
          </div>
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
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-7 bg-surface text-[12px]">Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 bg-surface text-[12px]">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
