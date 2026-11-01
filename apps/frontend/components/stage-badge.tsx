"use client";

import type { Stage } from "@/lib/mock-data";
import { STAGE_TONES, PRIORITY_COLORS } from "@/constants/stages.constants";
import type { CSSProperties } from "react";

// Backend stage names that differ from the frontend enum
const STAGE_ALIASES: Record<string, Stage> = {
  technical_interview: "technical_round" as Stage,
  hr_interview: "hr_round" as Stage,
  offer_extended: "offer_sent" as Stage,
  joined: "hired" as Stage,
};

export function StageBadge({ stage, size = "sm" }: { stage: Stage | string; size?: "sm" | "md" }) {
  const key = String(stage).toLowerCase();
  const tone = STAGE_TONES[stage as Stage] ?? STAGE_TONES[key as Stage] ?? STAGE_TONES[STAGE_ALIASES[key]];

  // APPLIED -> Applied, TECHNICAL_INTERVIEW -> Technical Interview
  const displayText = key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bHr\b/g, "HR");

  return (
    <span
      className={
        "tone-badge inline-flex items-center gap-1.5 rounded-full font-medium " +
        (size === "md" ? "px-2.5 py-1 text-[11.5px]" : "px-2 py-0.5 text-[10.5px]")
      }
      style={tone ? ({ "--tone": tone } as CSSProperties) : undefined}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone ?? "var(--color-muted-foreground)" }} />
      {displayText}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const c = PRIORITY_COLORS[priority];
  return <span title={priority + " priority"} className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: c }} />;
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium text-secondary-foreground">{children}</span>;
}
