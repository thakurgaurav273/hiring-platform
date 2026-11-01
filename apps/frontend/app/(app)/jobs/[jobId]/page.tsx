"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader, Avatar } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { useAppStore } from "@/store/app.store";
import { useJob } from "@/hooks/useJobs";
import { useCandidates } from "@/hooks/useCandidates";
import { Briefcase, MapPin, Users, Edit3, Archive, MoreHorizontal, Building2, UserPlus } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/skeletons";
import { type Candidate } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ROLE_KEYS } from "@/constants/roles.constants";
import { PriorityLevel } from "@/constants/enums";

import { AssignRecruiterDialog } from "@/features/jobs/AssignRecruiterDialog";
import { JobDetailApplications } from "@/features/jobs/JobDetailApplications";
import { JobDetailPipeline } from "@/features/jobs/JobDetailPipeline";
import { JobDistribution } from "@/features/jobs/JobDistribution";

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const resolvedParams = React.use(params);
  return (
    <Guard section="jobs">
      <JobDetail jobId={resolvedParams.jobId} />
    </Guard>
  );
}

function JobDetail({ jobId }: { jobId: string }) {
  const { data, isLoading, error } = useJob(jobId);
  const job = data?.data;

  const { data: candidatesData } = useCandidates({ jobId, limit: 100 });
  const role = useAppStore((s) => s.role);

  const cands = React.useMemo<Candidate[]>(() => {
    const apps = candidatesData?.data?.candidates || [];
    return apps.map((app: any) => {
      const candidate: Candidate = {
        id: app.candidate?.id || "",
        name: `${app.candidate?.firstName || ""} ${app.candidate?.lastName || ""}`.trim(),
        email: app.candidate?.email || "",
        phone: app.candidate?.phone || "",
        location: app.candidate?.location || "",
        title: app.candidate?.firstName || "",
        company: "",
        jobId: app.job?.id || "",
        stage: app.currentStage || "NEW",
        rating: 0,
        tags: [],
        skills: [],
        experience: 0,
        recruiter: "",
        appliedAt: app.createdAt || new Date().toISOString(),
        lastActivity: app.updatedAt || app.createdAt || new Date().toISOString(),
        priority: PriorityLevel.MEDIUM,
        avatarSeed: app.candidate?.email || "",
        referredBy: app.candidate?.referredBy || "",
        summary: "",
        education: [],
        workHistory: []
      };
      return candidate;
    });
  }, [candidatesData]);
  const [ui, setUi] = useState({ assignOpen: false });
  // Same roles the distribution API allows (administrators always pass).
  const canSeeDistribution =
    role === ROLE_KEYS.ADMINISTRATOR || role === ROLE_KEYS.HIRING_MANAGER || role === ROLE_KEYS.RECRUITER;

  if (isLoading) return <div className="p-8"><Skeleton.JobDetail /></div>;
  if (!job) return <div className="p-8 text-center text-muted-foreground">Job not found.</div>;

  return (
    <div>
      <PageHeader
        backButton={<BackButton fallback="/jobs" label="Back" />}
        breadcrumbs={[{ label: "Jobs", to: "/jobs" }, { label: job.title }]}
        title={job.title}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {job.department}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {job.numOpenings} opening{job.numOpenings > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {job.employmentType}
            </span>
          </span>
        }
        actions={
          <>
            {(role === ROLE_KEYS.ADMINISTRATOR || role === ROLE_KEYS.HIRING_MANAGER) && (
              <Link
                href={`/jobs/${job.id}/edit`}
                className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium hover:bg-secondary"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Link>
            )}
            {(role === ROLE_KEYS.ADMINISTRATOR || role === ROLE_KEYS.HIRING_MANAGER) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 grid place-items-center rounded-lg border border-border bg-surface px-2 hover:bg-secondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast("Job duplicated")}>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast("Archived")}>
                    <Archive className="h-4 w-4" /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => toast("Deleted")}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />
      <div className="px-4 py-6 md:px-8">
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications ({cands.length})</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            {canSeeDistribution && <TabsTrigger value="distribution">Distribution</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="surface-card p-5 lg:col-span-2">
                <div className="text-[13px] font-semibold">About this role</div>
                <p className="mt-3 text-[13.5px] leading-[1.65] text-muted-foreground">{job.description}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    { l: "Applicants", v: job._count?.applications || 0 },
                    { l: "Openings", v: job.numOpenings },
                    { l: "Posted", v: new Date(job.createdAt).toLocaleDateString() },
                    { l: "Status", v: job.status },
                  ].map((d) => (
                    <div key={d.l}>
                      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{d.l}</div>
                      <div className="mt-0.5 text-[13.5px]">{d.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="surface-card p-5">
                <div className="text-[13px] font-semibold">Hiring team</div>
                <div className="mt-3 space-y-3">
                  {[
                    job.createdBy ? { name: `${job.createdBy.firstName} ${job.createdBy.lastName}`, title: job.createdBy.role ? job.createdBy.role.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Creator", isInvited: false } : null,
                    job.recruiter && job.recruiter.id !== job.createdBy?.id ? { name: `${job.recruiter.firstName} ${job.recruiter.lastName}`, title: "Recruiter", isInvited: false } : null,
                    job.hiringManager && job.hiringManager.id !== job.createdBy?.id ? { name: `${job.hiringManager.firstName} ${job.hiringManager.lastName}`, title: "Hiring Manager", isInvited: false } : null,
                    ...(job.hiringTeamMembers || []).map((m: any) => ({ name: `${m.firstName} ${m.lastName}`, title: m.role ? m.role.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Team Member", isInvited: false })),
                    ...(job.jobInvitations?.filter((i: any) => i.status === "PENDING") || []).map((i: any) => ({ name: `${i.user?.firstName} ${i.user?.lastName}`, title: "Invited", isInvited: true })),
                  ].filter(Boolean).map((n: any, idx: number) => (
                    <div key={`${n.name}-${idx}`} className={`flex items-center gap-2.5 ${n.isInvited ? 'opacity-60' : ''}`}>
                      <Avatar name={n.name} size={28} />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium truncate">{n.name}</div>
                        <div className="text-[10.5px] text-muted-foreground">
                          {n.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {role === ROLE_KEYS.ADMINISTRATOR || role === ROLE_KEYS.HIRING_MANAGER ? (
                  <button
                    onClick={() => setUi(p => ({ ...p, assignOpen: true }))}
                    className="mt-4 h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-[12.5px] font-medium hover:bg-secondary"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Invite team member
                  </button>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="mt-5">
            <JobDetailApplications candidates={cands} />
          </TabsContent>

          <TabsContent value="pipeline" className="mt-5">
            <JobDetailPipeline cands={cands} role={role} />
          </TabsContent>

          {canSeeDistribution && (
            <TabsContent value="distribution" className="mt-5">
              <JobDistribution jobId={job.id} canManage={canSeeDistribution} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <AssignRecruiterDialog jobId={jobId} open={ui.assignOpen} onClose={() => setUi(p => ({ ...p, assignOpen: false }))} />
    </div>
  );
}
