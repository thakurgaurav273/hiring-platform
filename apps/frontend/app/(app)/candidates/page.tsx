"use client";

import { PageHeader } from "@/components/app-shell";
import { Guard } from "@/components/access-restricted";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/skeletons";
import { CandidateRow } from "@/features/candidates/CandidateRow";
import { Filters, multi, useResolvedFilters, type FilterValues } from "@/components/filters";
import { CANDIDATE_FILTERS } from "@/constants/filters.config";
import { ListToolbar, SearchField } from "@/components/list-toolbar";
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
  const hasFilters = Object.values(filters).some((v) => v?.length);
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

      <div className="space-y-4 px-4 py-5 md:px-8">
        <ListToolbar
          search={<SearchField value={q} onChange={setQ} placeholder="Search by name or email" label="Search candidates" />}
          summary={isLoading ? null : `${pagination?.total ?? rows.length} ${(pagination?.total ?? rows.length) === 1 ? "candidate" : "candidates"}`}
        >
          <Filters config={CANDIDATE_FILTERS} data={filterData} value={filters} onChange={setFilters} />
        </ListToolbar>

        <div className="surface-card overflow-hidden">
          <div className="hidden grid-cols-6 gap-x-4 border-b border-border bg-surface-2/60 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground lg:grid">
            <div>Candidate</div>
            <div>Job</div>
            <div>Location</div>
            <div>Referred by</div>
            <div>Applied</div>
            <div className="text-right">Stage</div>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {isLoading ? (
              <Skeleton.Row count={6} />
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <p className="text-[13.5px] font-medium">{q || hasFilters ? "No candidates match your search" : "No candidates yet"}</p>
                <p className="text-[12.5px] text-muted-foreground">
                  {q || hasFilters ? "Try a different keyword or clear the filters." : "Applications from your careers page and referrals show up here."}
                </p>
              </div>
            ) : (
              rows.map((c: any) => <CandidateRow key={`${c.id}-${c.jobId}`} candidate={c} />)
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border bg-surface-2/40 px-4 py-2.5 text-[12px] text-muted-foreground">
              <div className="tabular-nums">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-7 text-[12px]">
                  Previous
                </Button>
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 text-[12px]">
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
