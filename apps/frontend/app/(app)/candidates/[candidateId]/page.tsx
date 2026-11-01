"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader, Avatar } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { StageBadge } from "@/components/stage-badge";
import { useAppStore } from "@/store/app.store";
import { timelineFor, STAGES, INTERVIEWS, canMoveStage } from "@/lib/mock-data";
import { Mail, Calendar, ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { notFound, useRouter } from "next/navigation";
import { Skeleton } from "@/components/skeletons";
import { CandidateDetailRightRail } from "@/features/candidates/CandidateDetailRightRail";
import { CandidateDetailTabs } from "@/features/candidates/CandidateDetailTabs";
import { z } from "zod";
import { Role } from "@/constants/enums";
import { useCandidate, useUpdateCandidateStage } from "@/hooks/useCandidates";
import { useCandidateThreads } from "@/hooks/useMail";

export default function CandidateDetailPage({ params }: { params: Promise<{ candidateId: string }> }) {
  const resolvedParams = React.use(params);
  return (
    <Guard section="candidates">
      <CandidateDetail candidateId={resolvedParams.candidateId} />
    </Guard>
  );
}

function CandidateDetail({ candidateId }: { candidateId: string }) {
  const { data: candidateRes, isLoading } = useCandidate(candidateId);
  const { mutateAsync: updateStage, isPending: isUpdatingStage } = useUpdateCandidateStage();
  const role = useAppStore((s) => s.role);
  const router = useRouter();

  const liveRaw = candidateRes?.data;

  // Wait until loading finishes to avoid premature notFound
  useEffect(() => {
    if (!isLoading && !liveRaw) {
      notFound();
    }
  }, [isLoading, liveRaw]);

  const live = liveRaw ? {
    ...liveRaw,
    name: `${liveRaw.firstName} ${liveRaw.lastName}`,
    stage: liveRaw.applications?.[0]?.currentStage ?? "APPLIED",
    jobId: liveRaw.applications?.[0]?.jobId,
    appliedAt: new Date(liveRaw.createdAt).toLocaleDateString(),
    avatarSeed: liveRaw.email,
  } : null;

  const job = liveRaw?.applications?.[0]?.job;

  const { data: threadsResponse } = useCandidateThreads(live?.id ?? "");
  const threads = threadsResponse || [];
  const interviews = liveRaw?.applications?.[0]?.interviews ?? [];
  const user = useAppStore((s) => s.user)();

  const [ui, setUi] = useState({ emailOpen: false });

  const handleSendEmailClick = () => {
    if (!live) return;
    router.push(
      `/mail/compose?to=${encodeURIComponent(live.email)}&subject=${encodeURIComponent(
        `Re: ${job?.title ?? "your application"}`
      )}&from=${encodeURIComponent(user.email)}&candidateId=${live.id}`
    );
  };

  if (!live) {
    return <Skeleton.CandidateDetail />;
  }

  return (
    <div>
      <div className="px-6 pt-4 pb-2">
        <BackButton fallback="/candidates" label="Back to Candidates" />
      </div>
      <PageHeader
        breadcrumbs={[{ label: "Candidates", to: "/candidates" }, { label: live.name }]}
        title={
          <div className="flex items-center gap-3">
            <Avatar name={live.name} seed={live.avatarSeed} size={44} />
            <div className="min-w-0">
              <div className="truncate">{live.name}</div>
            </div>
          </div>
        }
        actions={
          <>
            {role !== Role.EMPLOYEE && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium hover:bg-secondary">
                    Move to <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {STAGES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={!canMoveStage(live.stage, s) || isUpdatingStage}
                      onClick={async () => { 
                        try {
                          await updateStage({ id: live.id, stage: s });
                          toast.success(`Moved to ${s}`);
                        } catch (e: any) {
                          toast.error(e.response?.data?.message || "Failed to update stage");
                        }
                      }}
                    >
                      <StageBadge stage={s} />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              onClick={() =>
                router.push(
                  `/mail/compose?to=${encodeURIComponent(live.email)}&subject=${encodeURIComponent(
                    `Re: ${job?.title ?? "your application"}`
                  )}&from=${encodeURIComponent(user.email)}&candidateId=${live.id}`
                )
              }
              className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium hover:bg-secondary"
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            {role !== Role.EMPLOYEE && (
              <Link
                href={`/candidates/${live.id}/schedule`}
                className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90"
              >
                <Calendar className="h-3.5 w-3.5" /> Schedule
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_320px]">
        {isLoading && <Skeleton.CandidateDetail />}
        {!isLoading && live && (
          <>
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <StageBadge stage={live.stage} size="md" />
                <span className="text-[11.5px] text-muted-foreground">Applied {live.appliedAt}</span>
              </div>
              <CandidateDetailTabs
                live={live}
                threads={threads}
                interviews={interviews}
                onSendEmailClick={handleSendEmailClick}
                router={router}
              />
            </div>
            <CandidateDetailRightRail live={live} job={job} />
          </>
        )}
      </div>
    </div>
  );
}
