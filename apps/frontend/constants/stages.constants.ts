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

/**
 * Pipeline stage tones. A tone is one hue; the `tone-badge` utility in
 * globals.css derives readable text, fill and border from it against the
 * current surface, so badges work in light and dark themes.
 */
export const STAGE_TONES: Record<CandidateStage, string> = {
  [CandidateStage.APPLIED]: "oklch(0.6 0.14 240)",
  [CandidateStage.SCREENING]: "oklch(0.6 0.14 265)",
  [CandidateStage.SHORTLISTED]: "oklch(0.6 0.12 200)",
  [CandidateStage.INTERVIEW_SCHEDULED]: "oklch(0.68 0.15 75)",
  [CandidateStage.INTERVIEW_COMPLETED]: "oklch(0.64 0.15 55)",
  [CandidateStage.TECHNICAL_ROUND]: "oklch(0.6 0.15 305)",
  [CandidateStage.HR_ROUND]: "oklch(0.62 0.15 340)",
  [CandidateStage.OFFER_SENT]: "oklch(0.6 0.14 160)",
  [CandidateStage.HIRED]: "var(--color-success)",
  [CandidateStage.REJECTED]: "var(--color-destructive)",
};

export const PRIORITY_COLORS: Record<"High" | "Medium" | "Low", string> = {
  High: "oklch(0.65 0.2 25)",
  Medium: "oklch(0.75 0.14 75)",
  Low: "oklch(0.7 0.06 260)",
};

export const OPINION_COLORS: Record<string, string> = {
  "Highly Recommend": "tone-soft [--tone:var(--color-success)]",
  "Recommend": "tone-soft [--tone:var(--color-info)]",
  "Neutral": "bg-secondary text-muted-foreground",
  "Average": "tone-soft [--tone:var(--color-warning)]",
  "Below Average": "tone-soft [--tone:var(--color-destructive)]",
};

export const OPINION_OPTIONS = ["Highly Recommend", "Recommend", "Neutral", "Average", "Below Average"] as const;

// Application status styles used in the applications page
export const APPLICATION_STATUS_STYLES: Record<string, string> = {
  "Under Review": "tone-soft [--tone:var(--color-info)]",
  "Interview": "tone-soft [--tone:var(--color-warning)]",
  "Offer": "tone-soft [--tone:var(--color-success)]",
  "Rejected": "tone-soft [--tone:var(--color-destructive)]",
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
