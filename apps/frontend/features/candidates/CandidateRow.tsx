"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/app-shell";
import { StageBadge } from "@/components/stage-badge";
import type { Candidate } from "@/lib/types";

interface CandidateRowProps {
  candidate: Candidate;
}

export function CandidateRow({ candidate: c }: CandidateRowProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/candidates/${c.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/candidates/${c.id}`);
      }}
      role="link"
      tabIndex={0}
      aria-label={`${c.name}, ${(c as any).jobTitle ?? ""}`}
      className="group grid grid-cols-1 gap-y-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-4 lg:items-center px-4 py-3 transition hover:bg-secondary/40 cursor-pointer focus-visible:bg-secondary/40 focus-visible:outline-none"
    >
      {/* Candidate */}
      <div className="flex items-center gap-3">
        <Avatar name={c.name} seed={c.avatarSeed} size={32} />
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-medium text-foreground group-hover:text-primary">{c.name}</div>
        </div>
      </div>

      {/* Job */}
      <div className="flex flex-col min-w-0">
        <span className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground lg:hidden">Job</span>
        <span className="truncate text-[13px] text-muted-foreground">{(c as any).jobTitle}</span>
      </div>

      {/* Location */}
      <div className="flex flex-col min-w-0">
        <span className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground lg:hidden">Location</span>
        <span className="truncate text-[13px] text-muted-foreground">{c.location || "–"}</span>
      </div>

      {/* Referred By */}
      <div className="flex flex-col min-w-0">
        <span className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground lg:hidden">Referred By</span>
        <span className="truncate text-[13px] text-muted-foreground">{c.referredBy || "—"}</span>
      </div>

      {/* Applied On */}
      <div className="flex flex-col min-w-0">
        <span className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground lg:hidden">Applied</span>
        <span className="truncate text-[13px] text-muted-foreground tabular-nums">
          {new Date(c.appliedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Stage */}
      <div className="flex flex-col items-start lg:items-end">
        <span className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground lg:hidden">Stage</span>
        <StageBadge stage={c.stage} />
      </div>
    </div>
  );
}
