"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { STAGES, canMoveStage } from "@/lib/mock-data";
import { Search } from "lucide-react";
import { Filters, multi, single, useResolvedFilters, type FilterValues } from "@/components/filters";
import { PIPELINE_FILTERS } from "@/constants/filters.config";
import { Input } from "@/components/ui/input";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/skeletons";
import { useCandidates, useUpdateCandidateStage } from "@/hooks/useCandidates";
import { useJobs } from "@/hooks/useJobs";
import { PipelineColumn } from "@/features/pipeline/PipelineColumn";
import { CandidateStage } from "@/constants/enums";
import type { Stage, Candidate } from "@/lib/types";


export default function PipelinePage() {
  return (
    <Guard section="pipeline">
      <PipelineInner />
    </Guard>
  );
}

function PipelineInner() {
  const role = useAppStore((s) => s.role);
  const { mutateAsync: updateStage } = useUpdateCandidateStage();
  const { data: jobsData } = useJobs({ limit: 100 });
  const visibleJobs = useMemo(() => jobsData?.data?.jobs || [], [jobsData]);
  const scopedJobIds = useMemo(() => new Set(visibleJobs.map((j: any) => j.id)), [visibleJobs]);


  // Combined UI state
  const filterData = useMemo(() => ({ jobs: visibleJobs }), [visibleJobs]);
  const [ui, setUi] = useState({
    q: "",
    filters: {} as FilterValues,
    dragOver: null as Stage | null,
    loading: true,
  });
  const { q, dragOver, loading } = ui;
  const set = <K extends keyof typeof ui>(k: K, v: typeof ui[K]) =>
    setUi(f => ({ ...f, [k]: v }));
  // The job is a required filter: it falls back to the first job in the
  // selected department, so the board always shows one job.
  const { values: filters } = useResolvedFilters(PIPELINE_FILTERS, filterData, ui.filters);
  const validJobId = single(filters, "job") ?? "";
  const stageF = (multi(filters, "stage") ?? []) as Stage[];

  const { data: candidatesData, isLoading: loadingData } = useCandidates({ jobId: validJobId, limit: 100 });

  const candidates = useMemo(() => {
    const apps = candidatesData?.data?.candidates || [];
    return apps.map((app: any) => ({
      id: app.candidate.id,
      name: `${app.candidate.firstName} ${app.candidate.lastName}`,
      title: app.candidate.firstName, // for search mapping
      jobId: app.job.id,
      stage: app.currentStage,
      email: app.candidate.email,
      avatarSeed: app.candidate.email,
    })) as unknown as Candidate[];
  }, [candidatesData]);

  useEffect(() => { const t = setTimeout(() => set("loading", false), 450); return () => clearTimeout(t); }, []);


  const filtered = useMemo(
    () =>
      candidates.filter((c: any) => {

        if (!scopedJobIds.has(c.jobId)) return false;
        if (c.jobId !== validJobId) return false;
        if (stageF.length > 0 && !stageF.includes(c.stage)) return false;
        if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [candidates, validJobId, stageF, q, scopedJobIds],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageHeader
        breadcrumbs={[{ label: "Workspace" }, { label: "Hiring pipeline" }]}
        title="Hiring pipeline"
        description="Track progress and move candidates across the hiring funnel"
      />

      {/* Filter bar */}
      <div className="border-b border-border bg-background/60 px-4 py-3 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={q} onChange={(e) => set("q", e.target.value)} placeholder="Search in this job…" aria-label="Search candidates in this job" className="pl-9" />
          </div>
          <Filters config={PIPELINE_FILTERS} data={filterData} value={filters} onChange={(v) => set("filters", v)} />
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-6 md:px-8">
        <div className="flex h-full gap-3 pt-6">
          {loading && <div className="flex h-full gap-3 pt-6"><Skeleton.PipelineColumn count={6} /></div>}
          {!loading && STAGES.map((s) => {
            const cards = filtered.filter((c) => c.stage === s);
            return (
              <PipelineColumn
                key={s}
                stage={s}
                cards={cards}
                isDragOver={dragOver === s}
                role={role}
                onDragOver={() => set("dragOver", s)}
                onDragLeave={() => setUi((f) => ({ ...f, dragOver: f.dragOver === s ? null : f.dragOver }))}
                onDrop={(id, targetStage) => {
                  const c = candidates.find((cand: any) => cand.id === id);
                  if (c) {
                    if (!canMoveStage(c.stage, targetStage)) {
                      toast.error("Backwards movement not allowed");
                    } else {
                      updateStage({ id, stage: targetStage })
                        .then(() => toast.success(`Moved to ${targetStage}`))
                        .catch((e: any) => toast.error(e.response?.data?.message || "Failed to update stage"));
                    }
                  }
                  set("dragOver", null);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
