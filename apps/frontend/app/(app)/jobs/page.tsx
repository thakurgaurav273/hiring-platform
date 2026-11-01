"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { candidatesForJob } from "@/lib/mock-data";
import { useAppStore } from "@/store/app.store";
import { useJobs, useDeleteJob } from "@/hooks/useJobs";
import type { Job } from "@/services/api/jobs.service";
import { Plus, Search, Building } from "lucide-react";
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
import { getJobStatusLabel } from "@/lib/utils/formatters";


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
    status: "All" as "All" | JobStatus,
    department: "All",
    deleteJob: null as Job | null,
  });

  const { data, isLoading } = useJobs({
    search: ui.q || undefined,
    status: ui.status !== "All" ? ui.status : undefined,
    department: ui.department !== "All" ? ui.department : undefined,
  });
  const deleteMutation = useDeleteJob();

  const jobs = data?.data?.jobs || [];
  
  // We can derive departments from the current dataset, or we'd ideally fetch a distinct list from the backend
  const departments = useMemo(() => Array.from(new Set(jobs.map((j) => j.department))), [jobs]);


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
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={ui.q} onChange={(e) => setUi(p => ({ ...p, q: e.target.value }))} placeholder="Search jobs, departments…" className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
          </div>
          {role === Role.ADMINISTRATOR && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 h-9">
              <Building className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={ui.department}
                onChange={(e) => setUi(p => ({ ...p, department: e.target.value }))}
                className="bg-transparent text-[12.5px] font-medium outline-none cursor-pointer text-muted-foreground focus:text-foreground"
              >
                <option value="All">All departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-wrap items-center rounded-lg border border-border bg-surface p-0.5">
            {["All", JobStatus.OPEN, JobStatus.DRAFT, JobStatus.ON_HOLD, JobStatus.CLOSED].map((s) => (
              <button key={s} onClick={() => setUi(p => ({ ...p, status: s as any }))} className={"h-8 rounded-md px-2.5 text-[12px] font-medium " + (ui.status === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>{s === "All" ? "All" : getJobStatusLabel(s as JobStatus)}</button>
            ))}
          </div>
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

