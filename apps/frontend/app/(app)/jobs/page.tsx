"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { candidatesForJob } from "@/lib/mock-data";
import { useAppStore } from "@/store/app.store";
import { useJobs, useDeleteJob } from "@/hooks/useJobs";
import type { Job } from "@/services/api/jobs.service";
import { Plus, Search } from "lucide-react";
import { Filters, single, useResolvedFilters, type FilterValues } from "@/components/filters";
import { JOB_FILTERS } from "@/constants/filters.config";
import { Input } from "@/components/ui/input";
import { useMemo, useState, useEffect } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/skeletons";
import { JobTableRow } from "@/features/jobs/JobTableRow";
import { useRouter } from "next/navigation";
import { JobStatus, Role } from "@/constants/enums";


export default function JobsPage() {
  return (
    <Guard section="jobs">
      <JobsInner />
    </Guard>
  );
}

function JobsInner() {
  const router = useRouter();
  const role = useAppStore((s) => s.role);
  const [ui, setUi] = useState({
    q: "",
    filters: {} as FilterValues,
    deleteJob: null as Job | null,
  });
  // Departments come from an unfiltered request so the list doesn't shrink
  // to the department that is currently selected.
  const { data: allJobsData } = useJobs({ limit: 100 });
  const departments = useMemo(
    () => Array.from(new Set((allJobsData?.data?.jobs ?? []).map((j) => j.department).filter(Boolean))),
    [allJobsData]
  );
  const filterData = useMemo(() => ({ departments }), [departments]);
  const { values: filters } = useResolvedFilters(JOB_FILTERS, filterData, ui.filters);
  const { data, isLoading } = useJobs({
    search: ui.q || undefined,
    status: single(filters, "status") as JobStatus | undefined,
    department: single(filters, "department"),
  });
  const deleteMutation = useDeleteJob();
  const jobs = data?.data?.jobs || [];


  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Workspace" }, { label: "Jobs" }]}
        title="Jobs"
        description="Manage active job postings and openings"
        actions={
          <>
            {[Role.ADMINISTRATOR, Role.HIRING_MANAGER].includes(role) && (
              <Link href="/jobs/new" className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground shadow-sm transition hover:bg-[color:var(--color-primary-hover)]">
                <Plus className="h-3.5 w-3.5" />
                New job
              </Link>
            )}
          </>
        }
      />

      <div className="w-full">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={ui.q} onChange={(e) => setUi(p => ({ ...p, q: e.target.value }))} placeholder="Search jobs, departments…" aria-label="Search jobs" className="pl-9" />
          </div>
          <Filters config={JOB_FILTERS} data={filterData} value={filters} onChange={(v) => setUi(p => ({ ...p, filters: v }))} />
        </div>
        <div className="mt-2 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-y border-border bg-secondary/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Job Name</th>
                  {role === Role.ADMINISTRATOR && <th className="px-5 py-3 font-semibold hidden sm:table-cell">Department</th>}
                  <th className="px-5 py-3 font-semibold hidden md:table-cell">Posted By</th>
                  <th className="px-5 py-3 font-semibold hidden lg:table-cell">Openings</th>
                  <th className="px-5 py-3 font-semibold text-right">Posted On</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <Skeleton.Table count={5} role={role} />}
                {!isLoading && jobs.map((j: Job) => (
                  <JobTableRow key={j.id} job={j} role={role} onDelete={(val) => setUi(p => ({ ...p, deleteJob: val as any }))} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>



      <AlertDialog open={!!ui.deleteJob} onOpenChange={(o) => !o && setUi(p => ({ ...p, deleteJob: null }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{ui.deleteJob?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the job and detach all {ui.deleteJob ? candidatesForJob(ui.deleteJob.id).length : 0} candidates from it. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (ui.deleteJob) {
                await deleteMutation.mutateAsync(ui.deleteJob.id);
                toast.success("Job deleted");
                setUi(p => ({ ...p, deleteJob: null }));
              }
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

