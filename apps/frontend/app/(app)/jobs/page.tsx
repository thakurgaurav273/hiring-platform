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
import { ListPage, TableCard, TablePagination, usePageSize } from "@/components/data-table";
import { useMemo, useState, useEffect } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/skeletons";
import { JobTableRow, jobGridCols } from "@/features/jobs/JobTableRow";
import { JobStatus, Role } from "@/constants/enums";


export default function JobsPage() {
  return (
    <Guard section="jobs">
      <JobsInner />
    </Guard>
  );
}

function JobsInner() {
  const role = useAppStore((s) => s.role);
  const [ui, setUi] = useState({
    q: "",
    filters: {} as FilterValues,
    deleteJob: null as Job | null,
    page: 1,
  });
  const [pageSize, setPageSize] = usePageSize("jobs");
  // Departments come from an unfiltered request so the list doesn't shrink
  // to the department that is currently selected.
  const { data: allJobsData } = useJobs({ limit: 100 });
  const departments = useMemo(
    () => Array.from(new Set((allJobsData?.data?.jobs ?? []).map((j) => j.department).filter(Boolean))),
    [allJobsData]
  );
  const filterData = useMemo(() => ({ departments }), [departments]);
  const { values: filters } = useResolvedFilters(JOB_FILTERS, filterData, ui.filters);
  const { data, isLoading, isFetching } = useJobs({
    search: ui.q || undefined,
    status: single(filters, "status") as JobStatus | undefined,
    department: single(filters, "department"),
    page: ui.page,
    limit: pageSize,
  });
  const deleteMutation = useDeleteJob();
  const jobs = data?.data?.jobs || [];
  const total = data?.data?.pagination?.total ?? jobs.length;
  const filtering = !!ui.q || Object.values(filters).some((v) => v?.length);

  // Step back a page if the current one empties (e.g. after a delete).
  const totalPages = data?.data?.pagination?.totalPages ?? 1;
  useEffect(() => {
    if (!isLoading && ui.page > 1 && ui.page > totalPages) setUi((p) => ({ ...p, page: Math.max(1, totalPages) }));
  }, [isLoading, totalPages, ui.page]);

  return (
    <>
      <ListPage
        header={
          <PageHeader
            title="Jobs"
            description="Manage active job postings and openings"
            actions={
              [Role.ADMINISTRATOR, Role.HIRING_MANAGER].includes(role) && (
                <Link href="/jobs/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground shadow-sm transition hover:bg-primary-hover">
                  <Plus className="size-3.5" />
                  New job
                </Link>
              )
            }
          />
        }
      >
        <ListToolbar
          className="shrink-0"
          search={<SearchField value={ui.q} onChange={(v) => setUi((p) => ({ ...p, q: v, page: 1 }))} placeholder="Search jobs or departments" label="Search jobs" />}
        >
          <Filters config={JOB_FILTERS} data={filterData} value={filters} onChange={(v) => setUi((p) => ({ ...p, filters: v, page: 1 }))} />
        </ListToolbar>

        <TableCard
          header={
            <div className={`grid items-center gap-x-4 px-4 py-2.5 ${jobGridCols(role)}`}>
              <div>Job</div>
              {role === Role.ADMINISTRATOR && <div className="hidden sm:block">Department</div>}
              <div className="hidden md:block">Posted by</div>
              <div className="hidden text-right lg:block">Openings</div>
              <div className="hidden text-right lg:block">Applicants</div>
              <div className="text-right">Posted</div>
              <div><span className="sr-only">Actions</span></div>
            </div>
          }
          footer={
            !isLoading && total > 0 ? (
              <TablePagination
                page={ui.page}
                pageSize={pageSize}
                total={total}
                noun={total === 1 ? "job" : "jobs"}
                onPageChange={(page) => setUi((p) => ({ ...p, page }))}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  setUi((p) => ({ ...p, page: 1 }));
                }}
              />
            ) : undefined
          }
        >
          <div role="list" aria-label="Jobs" aria-busy={isFetching} className={`divide-y divide-border transition-opacity ${isFetching && !isLoading ? "opacity-70" : ""}`}>
            {isLoading &&
              Array.from({ length: Math.min(pageSize, 8) }).map((_, k) => (
                <div key={k} className="px-4 py-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="mt-2 h-3 w-32" />
                </div>
              ))}
            {!isLoading && jobs.map((j: Job) => (
              <JobTableRow key={j.id} job={j} role={role} onDelete={(val) => setUi((p) => ({ ...p, deleteJob: val }))} />
            ))}
          </div>
          {!isLoading && jobs.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
                <Briefcase className="size-5" aria-hidden="true" />
              </span>
              <p className="text-[13.5px] font-medium">{filtering ? "No jobs match your search" : "No jobs yet"}</p>
              <p className="text-[12.5px] text-muted-foreground">
                {filtering ? "Try a different keyword or clear the filters." : "Create a job to start receiving applications."}
              </p>
              {!filtering && [Role.ADMINISTRATOR, Role.HIRING_MANAGER].includes(role) && (
                <Link href="/jobs/new" className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:bg-primary-hover">
                  <Plus className="size-3.5" /> New job
                </Link>
              )}
            </div>
          )}
        </TableCard>
      </ListPage>

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
    </>
  );
}

