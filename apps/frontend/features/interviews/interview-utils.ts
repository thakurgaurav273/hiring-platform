import type { Interview, Recommendation } from "@/services/api/interviews.service";

export const TYPE_TONE: Record<Interview["type"], string> = {
  SCREENING: "[--tone:var(--color-info)]",
  TECHNICAL: "[--tone:var(--color-chart-1)]",
  HR: "[--tone:var(--color-chart-3)]",
  MANAGERIAL: "[--tone:var(--color-chart-4)]",
  FINAL: "[--tone:var(--color-success)]",
};

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  STRONG_YES: "Strong yes",
  YES: "Yes",
  NEUTRAL: "Neutral",
  NO: "No",
  STRONG_NO: "Strong no",
};

export const RECOMMENDATION_TONE: Record<Recommendation, string> = {
  STRONG_YES: "[--tone:var(--color-success)]",
  YES: "[--tone:var(--color-success)]",
  NEUTRAL: "[--tone:var(--color-warning)]",
  NO: "[--tone:var(--color-destructive)]",
  STRONG_NO: "[--tone:var(--color-destructive)]",
};

export const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();

export const endOf = (i: Interview) => new Date(new Date(i.scheduledAt).getTime() + (i.durationMins || 30) * 60_000);

export const timeOf = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Days between the start of today and the start of `d` (0 = today, 1 = tomorrow, -1 = yesterday). */
export const dayOffset = (d: Date, now = new Date()) => Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000);

export function dayLabel(d: Date, now = new Date()) {
  const off = dayOffset(d, now);
  const date = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  if (off === 0) return { primary: "Today", secondary: date };
  if (off === 1) return { primary: "Tomorrow", secondary: date };
  if (off === -1) return { primary: "Yesterday", secondary: date };
  return { primary: date, secondary: off > 0 && off < 7 ? "This week" : "" };
}

/** Live state of a scheduled interview relative to now. */
export function liveState(i: Interview, now = new Date()): { label: string; tone: "live" | "soon" } | null {
  if (i.status !== "SCHEDULED") return null;
  const start = new Date(i.scheduledAt).getTime();
  const end = endOf(i).getTime();
  const t = now.getTime();
  if (t >= start && t < end) return { label: "In progress", tone: "live" };
  const mins = Math.round((start - t) / 60_000);
  if (mins > 0 && mins <= 60) return { label: `Starts in ${mins} min`, tone: "soon" };
  return null;
}

/** Feedback progress: how many panel members have submitted. */
export function feedbackProgress(i: Interview) {
  const panel = new Set(i.panelists.map((p) => p.interviewerId));
  const submitted = new Set((i.feedbacks ?? []).filter((f) => panel.has(f.interviewerId)).map((f) => f.interviewerId));
  const ratings = (i.feedbacks ?? []).map((f) => f.rating);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  return { submitted: submitted.size, expected: panel.size, avg, complete: panel.size > 0 && submitted.size >= panel.size };
}

export function groupByDay(list: Interview[]) {
  const groups: { key: string; date: Date; items: Interview[] }[] = [];
  for (const i of list) {
    const d = new Date(i.scheduledAt);
    const key = d.toDateString();
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(i);
    else groups.push({ key, date: d, items: [i] });
  }
  return groups;
}

export const placeIsVideo = (i: Interview) =>
  !!i.meetingLink || /\b(google meet|meet\.google|zoom|teams|webex|video call)\b/i.test(i.location ?? "");
export const placeIsPhone = (i: Interview) => /phone|call/i.test(i.location ?? "") && !i.meetingLink;
