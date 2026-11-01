"use client";

import { Filter, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StageBadge } from "@/components/stage-badge";
import { STAGES } from "@/lib/mock-data";
import { ROLE_KEYS } from "@/constants/roles.constants";
import type { Job, Stage } from "@/lib/types";

interface FilterPopProps {
  label: string;
  active: number;
  children: React.ReactNode;
}

function FilterPop({ label, active, children }: FilterPopProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[12.5px] font-medium hover:bg-secondary">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" /> {label}
          {active > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {active}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">{children}</PopoverContent>
    </Popover>
  );
}

interface CandidateFiltersProps {
  role: string;
  departments: string[];
  filteredJobsForFilter: any[];
  stageF: Stage[];
  jobF: string[];
  deptF: string[];
  setStageF: (v: Stage[]) => void;
  setJobF: (v: string[]) => void;
  setDeptF: (v: string[]) => void;
}

function toggleItem<T>(arr: T[], v: T, set: (a: T[]) => void) {
  set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
}

export function CandidateFilters({
  role,
  departments,
  filteredJobsForFilter,
  stageF,
  jobF,
  deptF,
  setStageF,
  setJobF,
  setDeptF,
}: CandidateFiltersProps) {
  const hasFilters = stageF.length > 0 || jobF.length > 0 || deptF.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2 shadow-xs">
      {role === ROLE_KEYS.ADMINISTRATOR && (
        <FilterPop label="Department" active={deptF.length}>
          <div className="max-h-64 overflow-y-auto p-1">
            {departments.map((d) => (
              <label key={d} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-[12.5px] hover:bg-secondary">
                <input
                  type="checkbox"
                  checked={deptF.includes(d)}
                  onChange={() => toggleItem(deptF, d, setDeptF)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <span className="truncate">{d}</span>
              </label>
            ))}
          </div>
        </FilterPop>
      )}

      <FilterPop label="Stage" active={stageF.length}>
        <div className="max-h-64 overflow-y-auto p-1">
          {STAGES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-[12.5px] hover:bg-secondary">
              <input
                type="checkbox"
                checked={stageF.includes(s)}
                onChange={() => toggleItem(stageF, s, setStageF)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <StageBadge stage={s} />
            </label>
          ))}
        </div>
      </FilterPop>

      <FilterPop label="Job" active={jobF.length}>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredJobsForFilter.map((j) => (
            <label key={j.id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-[12.5px] hover:bg-secondary">
              <input
                type="checkbox"
                checked={jobF.includes(j.id)}
                onChange={() => toggleItem(jobF, j.id, setJobF)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <span className="truncate">{j.title}</span>
            </label>
          ))}
        </div>
      </FilterPop>
    </div>
  );
}
