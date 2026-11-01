// Reports page constants — centralized so the reports feature doesn't own static data.

import type { Stage, FunnelStage } from "@/lib/types";
import { CandidateStage } from "@/constants/enums";

// Ordered funnel stages displayed in the reports page
export const FUNNEL_STAGES: Stage[] = [
  CandidateStage.APPLIED,
  CandidateStage.SCREENING,
  CandidateStage.SHORTLISTED,
  CandidateStage.INTERVIEW_SCHEDULED,
  CandidateStage.INTERVIEW_COMPLETED,
  CandidateStage.TECHNICAL_ROUND,
  CandidateStage.HR_ROUND,
  CandidateStage.HIRED,
];

// Baseline applicant volumes per funnel stage (admin / org-wide view)
export const ADMIN_FUNNEL_VOLUMES: number[] = [1284, 812, 486, 312, 214, 148, 92, 57];

// Funnel colours per stage (index-aligned with FUNNEL_STAGES). Early stages
// use the organization primary colour, later stages blend towards the brand
// secondary colour, so the chart follows the active theme.
export const FUNNEL_BASE_COLORS: string[] = [
  "var(--color-chart-1)",
  "color-mix(in oklab, var(--color-chart-1) 88%, var(--color-chart-2))",
  "color-mix(in oklab, var(--color-chart-1) 76%, var(--color-chart-2))",
  "color-mix(in oklab, var(--color-chart-1) 64%, var(--color-chart-2))",
  "color-mix(in oklab, var(--color-chart-1) 52%, var(--color-chart-2))",
  "color-mix(in oklab, var(--color-chart-1) 40%, var(--color-chart-2))",
  "color-mix(in oklab, var(--color-chart-1) 26%, var(--color-chart-2))",
  "var(--color-chart-2)",
];

// Default funnel data used when no runtime data is provided to RecruitmentFunnel
export const DEFAULT_FUNNEL_STAGES: FunnelStage[] = FUNNEL_STAGES.map((name, i) => ({
  name,
  value: ADMIN_FUNNEL_VOLUMES[i],
  conv: i === 0 ? "—" : `${Math.round((ADMIN_FUNNEL_VOLUMES[i] / ADMIN_FUNNEL_VOLUMES[i - 1]) * 100)}%`,
  color: FUNNEL_BASE_COLORS[i],
}));

// Org departments for reports bar chart
export const DEPARTMENTS: string[] = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Sales",
  "Customer Success",
];

// Week labels for the sparkline / trend chart
export const REPORT_WEEKS: string[] = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

// Baseline application counts per week (org-wide)
export const REPORT_SERIES_BASE: number[] = [46, 58, 72, 65, 88, 96, 110, 124];

// KPI definitions per role scope
export const ADMIN_KPIS = [
  { l: "Applications (30d)", v: "1,284", d: "+12%" },
  { l: "Interviews (30d)",   v: "246",   d: "+18%" },
  { l: "Offer acceptance",   v: "82%",   d: "+4pp" },
  { l: "Time to hire",       v: "18d",   d: "-2d"  },
] as const;

export const HIRING_MANAGER_KPIS = [
  { l: "Applications (30d)", v: "412",  d: "+9%"  },
  { l: "Interviews (30d)",   v: "78",   d: "+14%" },
  { l: "Offer acceptance",   v: "84%",  d: "+3pp" },
  { l: "Time to hire",       v: "17d",  d: "-1d"  },
] as const;
