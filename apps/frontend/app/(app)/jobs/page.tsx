"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { useJobs, useDeleteJob } from "@/hooks/useJobs";
import type { Job } from "@/services/api/jobs.service";
import { Briefcase, Plus } from "lucide-react";
import { Filters, single, useResolvedFilters, type FilterValues } from "@/components/filters";
import { JOB_FILTERS } from "@/constants/filters.config";
import { ListToolbar, SearchField } from "@/components/list-toolbar";
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

      <div className="space-y-4 px-4 py-5 md:px-8">
        <ListToolbar
          search={<SearchField value={ui.q} onChange={(v) => setUi((p) => ({ ...p, q: v }))} placeholder="Search jobs or departments" label="Search jobs" />}
          summary={isLoading ? null : `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"}`}
        >
          <Filters config={JOB_FILTERS} data={filterData} value={filters} onChange={(v) => setUi((p) => ({ ...p, filters: v }))} />
        </ListToolbar>

        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border bg-surface-2/60 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Job</th>
                  {role === Role.ADMINISTRATOR && <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Department</th>}
                  <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Posted by</th>
                  <th scope="col" className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Openings</th>
                  <th scope="col" className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Applicants</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Posted</th>
                  <th scope="col" className="w-12 px-2 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <Skeleton.Table count={5} role={role} />}
                {!isLoading && jobs.map((j: Job) => (
                  <JobTableRow key={j.id} job={j} role={role} onDelete={(val) => setUi((p) => ({ ...p, deleteJob: val }))} />
                ))}
              </tbody>
            </table>
          </div>
          {!isLoading && jobs.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
                <Briefcase className="size-5" aria-hidden="true" />
              </span>
              <p className="text-[13.5px] font-medium">{ui.q || Object.values(filters).some((v) => v?.length) ? "No jobs match your search" : "No jobs yet"}</p>
              <p className="text-[12.5px] text-muted-foreground">
                {ui.q || Object.values(filters).some((v) => v?.length) ? "Try a different keyword or clear the filters." : "Create a job to start receiving applications."}
              </p>
              {!ui.q && !Object.values(filters).some((v) => v?.length) && [Role.ADMINISTRATOR, Role.HIRING_MANAGER].includes(role) && (
                <Link href="/jobs/new" className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:bg-primary-hover">
                  <Plus className="size-3.5" /> New job
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!ui.deleteJob} onOpenChange={(o) => !o && setUi(p => ({ ...p, deleteJob: null }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{ui.deleteJob?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the job and its {ui.deleteJob?._count?.applications ?? 0} {ui.deleteJob?._count?.applications === 1 ? "application" : "applications"}. This can&apos;t be undone.</AlertDialogDescription>
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

