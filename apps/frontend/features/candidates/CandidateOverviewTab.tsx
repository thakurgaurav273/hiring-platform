"use client";

import { Sparkles } from "lucide-react";
import type { Candidate } from "@/lib/types";
import { ApplicationResponses } from "@/features/candidates/ApplicationDetails";

interface CandidateOverviewTabProps {
  live: any;
}

export function CandidateOverviewTab({ live }: CandidateOverviewTabProps) {
  const education = Array.isArray(live.education) ? live.education : [];
  
  return (
    <div className="mt-5 space-y-4">
      <ApplicationResponses application={live.applications?.[0]} />
      {live.summary && (
        <div className="surface-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold">Summary</div>
            <button className="inline-flex items-center gap-1 rounded-md bg-accent/12 px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/20">
              <Sparkles className="h-3 w-3" /> Ask AI
            </button>
          </div>
          <p className="mt-3 text-[13.5px] leading-[1.65] text-muted-foreground">{live.summary}</p>
        </div>
      )}

      {live.experience && typeof live.experience === "string" && (
        <div className="surface-card p-5">
          <div className="text-[13px] font-semibold">Experience</div>
          <p className="mt-3 text-[13.5px] leading-[1.65] text-muted-foreground whitespace-pre-wrap">{live.experience}</p>
        </div>
      )}

      {Array.isArray(live.skills) && live.skills.length > 0 && (
        <div className="surface-card p-5">
          <div className="text-[13px] font-semibold">Skills</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {live.skills.map((s: string, i: number) => (
              <span key={i} className="rounded-full bg-surface-2 px-3 py-1 text-[11.5px] font-medium text-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className="surface-card p-5">
          <div className="text-[13px] font-semibold">Education</div>
          <div className="mt-3 space-y-2">
            {education.map((e: any, i: number) => (
              <div key={i}>
                <div className="text-[13px] font-medium">{e.school || e}</div>
                {e.degree && <div className="text-[11.5px] text-muted-foreground">{e.degree} {e.year ? `· ${e.year}` : ''}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
