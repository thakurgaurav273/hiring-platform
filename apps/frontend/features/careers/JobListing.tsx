"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Briefcase, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EMPLOYMENT_LABELS,
  jobPath,
  type CareersListing,
  type EmploymentType,
  type PublicJobSummary,
} from "@/lib/careers";

const ALL = "";

function Select({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input h-10 min-w-[160px] cursor-pointer pr-8">
        <option value={ALL}>All {label.toLowerCase()}s</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Job list with search and department / location / type filters. */
export function JobListing({
  orgSlug,
  jobs,
  filters,
}: {
  orgSlug: string;
  jobs: PublicJobSummary[];
  filters: CareersListing["filters"];
}) {
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [type, setType] = useState(ALL);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (!needle || [j.title, j.department, j.location ?? ""].some((v) => v.toLowerCase().includes(needle))) &&
        (!department || j.department === department) &&
        (!location || j.location === location) &&
        (!type || j.employmentType === type)
    );
  }, [jobs, q, department, location, type]);

  const filtering = !!(q || department || location || type);

  return (
    <section aria-labelledby="open-roles" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="open-roles" className="font-display text-[20px] font-semibold tracking-tight">
          Open roles <span className="text-muted-foreground">({jobs.length})</span>
        </h2>
      </div>

      {jobs.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search roles"
              aria-label="Search roles"
              className="h-10 pl-9"
            />
          </div>
          {filters.departments.length > 1 && (
            <Select id="f-dept" label="Department" value={department} onChange={setDepartment} options={filters.departments.map((d) => ({ value: d, label: d }))} />
          )}
          {filters.locations.length > 1 && (
            <Select id="f-loc" label="Location" value={location} onChange={setLocation} options={filters.locations.map((l) => ({ value: l, label: l }))} />
          )}
          {filters.employmentTypes.length > 1 && (
            <Select
              id="f-type"
              label="Type"
              value={type}
              onChange={setType}
              options={filters.employmentTypes.map((t) => ({ value: t, label: EMPLOYMENT_LABELS[t as EmploymentType] }))}
            />
          )}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface p-10 text-center">
          <p className="text-[15px] font-medium">No open roles right now</p>
          <p className="mt-1 text-[14px] text-muted-foreground">Check back soon. New positions are posted here first.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center text-[14px] text-muted-foreground">
          No roles match your filters.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface" aria-live={filtering ? "polite" : undefined}>
          {shown.map((job) => (
            <li key={job.id}>
              <Link
                href={jobPath(orgSlug, job)}
                className={cn(
                  "group flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-6"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[15.5px] font-semibold tracking-tight group-hover:text-primary">{job.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="size-3.5" aria-hidden="true" /> {job.department}
                    </span>
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden="true" /> {job.location}
                      </span>
                    )}
                    <span>{EMPLOYMENT_LABELS[job.employmentType]}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[13.5px] font-medium text-primary">
                  View role <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
