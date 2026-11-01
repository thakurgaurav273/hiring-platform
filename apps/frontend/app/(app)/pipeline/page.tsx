"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { STAGES, canMoveStage } from "@/lib/mock-data";
import { Search, Briefcase, Building, Filter, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/skeletons";
import { useCandidates, useUpdateCandidateStage } from "@/hooks/useCandidates";
import { useJobs } from "@/hooks/useJobs";
import { ROLE_KEYS } from "@/constants/roles.constants";
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

  const departments = useMemo(() => Array.from(new Set(visibleJobs.map((j: any) => j.department))), [visibleJobs]);

  // Combined UI state
  const [ui, setUi] = useState({
    department: "All",
    q: "",
    jobId: "", // Default empty, handles dynamically below
    stageF: [] as Stage[],
    dragOver: null as Stage | null,
    showFilters: false,
    loading: true,
  });

  const { department, q, jobId, stageF, dragOver, showFilters, loading } = ui;
  const set = <K extends keyof typeof ui>(k: K, v: typeof ui[K]) =>
    setUi(f => ({ ...f, [k]: v }));

  const filteredJobs = useMemo(() => {
    if (department === "All") return visibleJobs;
    return visibleJobs.filter((j: any) => j.department === department);
  }, [visibleJobs, department]);

  const validJobId = useMemo(
    () => filteredJobs.find((j: any) => j.id === jobId) ? jobId : (filteredJobs[0]?.id ?? ""),
    [filteredJobs, jobId]
  );

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
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => set("q", e.target.value)} placeholder="Search in this job…" className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[12.5px] outline-none focus:border-ring" />
            </div>
            <button
              onClick={() => set("showFilters", !showFilters)}
              className={"inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition " + (showFilters ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface hover:bg-secondary")}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2 shadow-xs">
              {role === ROLE_KEYS.ADMINISTRATOR && (
                <FilterSelect label="Department" icon={Building} value={department} onChange={(v) => set("department", v)}
                  options={[{ v: "All", l: "All departments" }, ...departments.map((d) => ({ v: d, l: d }))]}
                />
              )}
              <FilterSelect label="Job opening" icon={Briefcase} value={validJobId} onChange={(v) => set("jobId", v)}
                options={filteredJobs.map((j) => ({ v: j.id, l: j.title }))}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[12px] font-medium hover:bg-secondary">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" /> Stage
                    {stageF.length > 0 && (
                      <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                        {stageF.length}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-0">
                  <div className="max-h-64 overflow-y-auto p-1">
                    {STAGES.map((s) => (
                      <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-[12px] hover:bg-secondary">
                        <input
                          type="checkbox"
                          checked={stageF.includes(s)}
                          onChange={() => set("stageF", stageF.includes(s) ? stageF.filter(x => x !== s) : [...stageF, s])}
                          className="h-4 w-4 accent-[var(--color-primary)]"
                        />
                        <span className="truncate">{String(s).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {stageF.length > 0 && (
                <button onClick={() => set("stageF", [])} className="text-[11px] text-muted-foreground hover:text-foreground ml-1 font-medium underline underline-offset-2">Clear filters</button>
              )}
            </div>
          )}
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

function FilterSelect({ label, icon: Icon, value, onChange, options }: { label: string; icon?: React.ElementType; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface pl-2.5 pr-1.5 text-[12px]">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className="text-muted-foreground">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="cursor-pointer bg-transparent pr-1 text-[12px] font-medium outline-none">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
