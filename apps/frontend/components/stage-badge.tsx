"use client";

import type { Stage } from "@/lib/mock-data";
import { STAGE_STYLES, PRIORITY_COLORS } from "@/constants/stages.constants";

export function StageBadge({ stage, size = "sm" }: { stage: Stage | string; size?: "sm" | "md" }) {
  // Map backend uppercase strings to frontend lowercase enums where possible, or use raw lowercased value
  const mappedStage = (typeof stage === 'string' ? stage.toLowerCase() : stage) as Stage;
  
  // Fallback styling for unmapped stages
  const defaultStyle = { fg: "oklch(0.4 0 0)", bg: "oklch(0.95 0 0)", border: "oklch(0.86 0 0)", dot: "oklch(0.6 0 0)" };
  
  // Try exact match, then mapped match
  let style = STAGE_STYLES[stage as Stage] || STAGE_STYLES[mappedStage] || defaultStyle;

  // Handle specific backend mismatches (e.g., TECHNICAL_INTERVIEW -> technical_round)
  if (!STAGE_STYLES[mappedStage as Stage]) {
    if ((mappedStage as string) === "technical_interview") style = STAGE_STYLES["technical_round" as Stage];
    if ((mappedStage as string) === "hr_interview") style = STAGE_STYLES["hr_round" as Stage];
    if ((mappedStage as string) === "offer_extended") style = STAGE_STYLES["offer_sent" as Stage];
    if ((mappedStage as string) === "joined") style = STAGE_STYLES["hired" as Stage];
  }

  // Formatting display text: APPLIED -> Applied, TECHNICAL_INTERVIEW -> Technical Interview
  const displayText = String(stage).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full font-medium " +
        (size === "md" ? "px-2.5 py-1 text-[11.5px]" : "px-2 py-0.5 text-[10.5px]")
      }
      style={{ color: style.fg, background: style.bg, boxShadow: `inset 0 0 0 1px ${style.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
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
