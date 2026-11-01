"use client";

import { useEffect, useState } from "react";
import { STAGES } from "@/constants/stages.constants";
import { CandidateStage } from "@/constants/enums";
import { StageBadge } from "@/components/stage-badge";
import { cn } from "@/lib/utils";

const PATH = STAGES.filter((s) => s !== CandidateStage.REJECTED);

const EVENTS: Record<string, string> = {
  [CandidateStage.APPLIED]: "Referred by Daniel from Engineering",
  [CandidateStage.SCREENING]: "Résumé reviewed by the recruiter",
  [CandidateStage.SHORTLISTED]: "Shortlisted with 2 others",
  [CandidateStage.INTERVIEW_SCHEDULED]: "Panel booked for Thursday, 10:00",
  [CandidateStage.INTERVIEW_COMPLETED]: "3 of 3 panelists left feedback",
  [CandidateStage.TECHNICAL_ROUND]: "Technical round: strong yes",
  [CandidateStage.HR_ROUND]: "HR round complete",
  [CandidateStage.OFFER_SENT]: "Offer sent by the hiring manager",
  [CandidateStage.HIRED]: "Offer accepted. Starts on the 3rd.",
};

/** One sample candidate moving through the real pipeline stages. */
export function CandidateJourney() {
  const [step, setStep] = useState(PATH.length - 1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => (s + 1) % (PATH.length + 2)), 1600);
    return () => clearInterval(t);
  }, []);

  const current = Math.min(step, PATH.length - 1);
  const stage = PATH[current];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6" aria-label="Example candidate journey" role="img">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[15px] font-semibold">Maya Thompson</div>
          <div className="text-[13px] text-muted-foreground">Product Designer · Referral</div>
        </div>
        <StageBadge stage={stage} size="md" />
      </div>

      <ol className="mt-6 flex gap-1" aria-hidden="true">
        {PATH.map((s, i) => (
          <li
            key={s}
            className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", i <= current ? "bg-primary" : "bg-muted")}
          />
        ))}
      </ol>

      <ul className="mt-6 space-y-3" aria-hidden="true">
        {PATH.slice(Math.max(0, current - 2), current + 1)
          .reverse()
          .map((s, i) => (
            <li
              key={s}
              className={cn("flex items-start gap-3 text-[13px] transition-opacity", i === 0 ? "opacity-100" : "opacity-50")}
            >
              <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", i === 0 ? "bg-primary" : "bg-muted-foreground")} />
              <span>{EVENTS[s]}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
