// Stage and opinion styles — centralized so UI components don't own mapping logic.

// Stage type lives in lib/types.ts — imported here for use in STAGE_STYLES key and re-exported
import { CandidateStage } from "./enums";
export { CandidateStage as Stage } from "./enums";

// Ordered list of all pipeline stages
export const STAGES: CandidateStage[] = [
  CandidateStage.APPLIED,
  CandidateStage.SCREENING,
  CandidateStage.SHORTLISTED,
  CandidateStage.INTERVIEW_SCHEDULED,
  CandidateStage.INTERVIEW_COMPLETED,
  CandidateStage.TECHNICAL_ROUND,
  CandidateStage.HR_ROUND,
  CandidateStage.OFFER_SENT,
  CandidateStage.HIRED,
  CandidateStage.REJECTED,
];

// Returns true if moving from currentStage to newStage is a forward progression
export function canMoveStage(currentStage: CandidateStage, newStage: CandidateStage): boolean {
  if (currentStage === newStage) return false;
  const currentIndex = STAGES.indexOf(currentStage);
  const newIndex = STAGES.indexOf(newStage);
  return newIndex > currentIndex;
}

export const STAGE_STYLES: Record<CandidateStage, { fg: string; bg: string; border: string; dot: string }> = {
  [CandidateStage.APPLIED]: { fg: "oklch(0.4 0.06 240)", bg: "oklch(0.96 0.02 240)", border: "oklch(0.88 0.03 240)", dot: "oklch(0.6 0.14 240)" },
  [CandidateStage.SCREENING]: { fg: "oklch(0.4 0.06 260)", bg: "oklch(0.96 0.02 260)", border: "oklch(0.88 0.03 260)", dot: "oklch(0.6 0.14 260)" },
  [CandidateStage.SHORTLISTED]: { fg: "oklch(0.38 0.06 190)", bg: "oklch(0.95 0.03 190)", border: "oklch(0.86 0.04 190)", dot: "oklch(0.6 0.14 190)" },
  [CandidateStage.INTERVIEW_SCHEDULED]: { fg: "oklch(0.38 0.08 75)", bg: "oklch(0.96 0.04 85)", border: "oklch(0.88 0.06 85)", dot: "oklch(0.68 0.16 75)" },
  [CandidateStage.INTERVIEW_COMPLETED]: { fg: "oklch(0.36 0.08 55)", bg: "oklch(0.95 0.04 55)", border: "oklch(0.86 0.06 55)", dot: "oklch(0.66 0.16 55)" },
  [CandidateStage.TECHNICAL_ROUND]: { fg: "oklch(0.4 0.08 310)", bg: "oklch(0.96 0.03 310)", border: "oklch(0.88 0.05 310)", dot: "oklch(0.65 0.16 310)" },
  [CandidateStage.HR_ROUND]: { fg: "oklch(0.4 0.08 340)", bg: "oklch(0.96 0.03 340)", border: "oklch(0.88 0.05 340)", dot: "oklch(0.65 0.16 340)" },
  [CandidateStage.OFFER_SENT]: { fg: "oklch(0.36 0.08 155)", bg: "oklch(0.95 0.04 155)", border: "oklch(0.86 0.06 155)", dot: "oklch(0.6 0.16 155)" },
  [CandidateStage.HIRED]: { fg: "oklch(0.32 0.08 155)", bg: "oklch(0.92 0.06 155)", border: "oklch(0.82 0.08 155)", dot: "oklch(0.58 0.18 155)" },
  [CandidateStage.REJECTED]: { fg: "oklch(0.4 0.08 25)", bg: "oklch(0.96 0.03 25)", border: "oklch(0.88 0.05 25)", dot: "oklch(0.65 0.16 25)" },
};

export const PRIORITY_COLORS: Record<"High" | "Medium" | "Low", string> = {
  High: "oklch(0.65 0.2 25)",
  Medium: "oklch(0.75 0.14 75)",
  Low: "oklch(0.7 0.06 260)",
};

export const OPINION_COLORS: Record<string, string> = {
  "Highly Recommend": "bg-[oklch(0.92_0.06_155)] text-[oklch(0.3_0.1_155)]",
  "Recommend": "bg-[oklch(0.93_0.05_240)] text-[oklch(0.35_0.1_240)]",
  "Neutral": "bg-secondary text-muted-foreground",
  "Average": "bg-[oklch(0.94_0.07_75)] text-[oklch(0.4_0.1_75)]",
  "Below Average": "bg-[oklch(0.94_0.04_25)] text-[oklch(0.4_0.08_25)]",
};

export const OPINION_OPTIONS = ["Highly Recommend", "Recommend", "Neutral", "Average", "Below Average"] as const;

// Application status styles used in the applications page
export const APPLICATION_STATUS_STYLES: Record<string, string> = {
  "Under Review": "bg-[oklch(0.96_0.02_240)] text-[oklch(0.4_0.09_240)]",
  "Interview": "bg-[oklch(0.96_0.04_85)] text-[oklch(0.4_0.11_75)]",
  "Offer": "bg-[oklch(0.92_0.06_155)] text-[oklch(0.32_0.1_155)]",
  "Rejected": "bg-[oklch(0.96_0.03_25)] text-[oklch(0.4_0.09_25)]",
};

// Recruiter list — move to backend once API is available
export const RECRUITERS = [
  { name: "Priya Natarajan", email: "priya@grovyn.com", department: "Design & Product" },
  { name: "Daniel Okafor", email: "daniel@grovyn.com", department: "Engineering & Data" },
  { name: "Sana Iqbal", email: "sana@grovyn.com", department: "Sales & CS" },
  { name: "Marcus Chen", email: "marcus@grovyn.com", department: "Executive" },
  { name: "Yuki Tanabe", email: "yuki@grovyn.com", department: "Marketing" },
  { name: "Elena Ruiz", email: "elena@grovyn.com", department: "Engineering" },
] as const;

export const RECRUITER_NAMES = RECRUITERS.map((r) => r.name);
