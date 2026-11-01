// Types are defined in lib/types.ts — imported and re-exported here for backward compatibility.
// STAGES and canMoveStage are defined in constants/stages.constants.ts — re-exported here.
// Consumers can import from either @/lib/mock-data or the canonical source.
export type {
  Stage,
  Job,
  Candidate,
  Interview,
  TimelineEvent,
  EmailThread,
} from "@/lib/types";

export { STAGES, canMoveStage } from "@/constants/stages.constants";

import { STAGES } from "@/constants/stages.constants";
import type { Stage, Job, Candidate, Interview, TimelineEvent, EmailThread } from "@/lib/types";
import { JobStatus, JobType, CandidateStage, PriorityLevel, InterviewStatus, InterviewType, InterviewLocation, ApplicationStatus, TimelineEventType } from "@/constants/enums";
export const JOBS: Job[] = [
  { id: "job_1", title: "Senior Product Designer", department: "Design", location: "Remote · US", type: JobType.FULL_TIME, status: JobStatus.OPEN, openings: 2, applicants: 84, recruiter: "Priya Natarajan", hiringManager: "Marcus Chen", postedAt: "2026-06-04", description: "Lead product design for our core ATS surfaces. Partner with PM & engineering to ship at Linear-level polish.", createdBy: "Marcus Chen" },
  { id: "job_2", title: "Staff Software Engineer, Platform", department: "Engineering", location: "New York, NY", type: JobType.FULL_TIME, status: JobStatus.OPEN, openings: 1, applicants: 132, recruiter: "Daniel Okafor", hiringManager: "Elena Ruiz", postedAt: "2026-05-22", description: "Own the platform primitives — pipelines, workflows, permissions — powering the ATS.", createdBy: "Elena Ruiz" },
  { id: "job_3", title: "Product Manager, Growth", department: "Product", location: "San Francisco, CA", type: JobType.FULL_TIME, status: JobStatus.OPEN, openings: 1, applicants: 61, recruiter: "Priya Natarajan", hiringManager: "Marcus Chen", postedAt: "2026-06-11", description: "Drive activation and expansion across the recruiter workflow.", createdBy: "Marcus Chen" },
  { id: "job_4", title: "Customer Success Manager", department: "Customer Success", location: "Remote · EU", type: JobType.FULL_TIME, status: JobStatus.OPEN, openings: 3, applicants: 47, recruiter: "Sana Iqbal", hiringManager: "Yuki Tanabe", postedAt: "2026-06-18", description: "Partner with enterprise recruiting teams for onboarding and expansion.", createdBy: "Yuki Tanabe" },
  { id: "job_5", title: "Data Engineer", department: "Data", location: "Austin, TX", type: JobType.FULL_TIME, status: JobStatus.OPEN, openings: 2, applicants: 39, recruiter: "Daniel Okafor", hiringManager: "Elena Ruiz", postedAt: "2026-06-20", description: "Build the data platform behind reporting and pipeline analytics.", createdBy: "Elena Ruiz" },
  { id: "job_6", title: "Design Engineer", department: "Design", location: "Remote · Global", type: JobType.CONTRACT, status: JobStatus.OPEN, openings: 1, applicants: 22, recruiter: "Priya Natarajan", hiringManager: "Marcus Chen", postedAt: "2026-06-24", description: "Bridge design and engineering — prototypes, motion, and design systems.", createdBy: "Marcus Chen" },
  { id: "job_7", title: "Sales Development Rep", department: "Sales", location: "London, UK", type: JobType.FULL_TIME, status: JobStatus.ON_HOLD, openings: 4, applicants: 91, recruiter: "Sana Iqbal", hiringManager: "Marcus Chen", postedAt: "2026-04-30", description: "Prospect and qualify enterprise recruiting teams across EMEA.", createdBy: "Marcus Chen" },
  { id: "job_8", title: "Head of Talent Brand", department: "Marketing", location: "Remote · US", type: JobType.FULL_TIME, status: JobStatus.DRAFT, openings: 1, applicants: 0, recruiter: "Priya Natarajan", hiringManager: "Yuki Tanabe", postedAt: "2026-06-27", description: "Own our employer brand and content across candidate touchpoints.", createdBy: "Yuki Tanabe" },
];

const firstNames = ["Aarav","Isabella","Kenji","Amara","Diego","Leilani","Rafael","Zara","Nikolai","Priya","Mateo","Sana","Yuki","Elena","Jonas","Chidi","Aisha","Ravi","Noor","Luca","Fatima","Owen","Maya","Theo","Ines","Kai","Simone","Ezra","Talia","Amir"];
const lastNames = ["Patel","Rodriguez","Tanaka","Okafor","Fernandez","Ka'ai","Silva","Ahmed","Volkov","Sharma","Rossi","Iqbal","Nakamura","Ruiz","Weber","Eze","Khan","Menon","Hassan","Bianchi","El-Sayed","Walsh","Brooks","Laurent","Costa","Nakagawa","Moreau","Levine","Cohen","Reyes"];
const titles = ["Senior Product Designer","Staff Engineer","Product Manager","Design Engineer","Data Engineer","Engineering Manager","UX Researcher","Marketing Lead","Customer Success Manager","Sales Development Rep","Full-stack Engineer","Frontend Engineer","Backend Engineer","Head of Design","Principal PM"];
const companies = ["Linear","Figma","Notion","Stripe","Vercel","Ramp","Retool","Attio","Ashby","Anthropic","Airtable","Loom","Datadog","Snowflake","Shopify","Wise"];
const skillsPool = ["React","TypeScript","Figma","GraphQL","Postgres","Node.js","Design Systems","Prototyping","Motion","Analytics","SQL","Kubernetes","Go","Python","Kafka","dbt","Notion","Framer","User Research"];
const locations = ["San Francisco, CA","New York, NY","Austin, TX","London, UK","Berlin, DE","Toronto, CA","Amsterdam, NL","Remote","Lisbon, PT","Bangalore, IN"];
const recruiters = ["Priya Natarajan","Daniel Okafor","Sana Iqbal","Marcus Chen"];

function seeded(i: number) {
  return {
    r: (n: number) => (Math.abs(Math.sin((i + 1) * (n + 3.14))) * 100000) % 1,
    pick: <T,>(arr: T[], n: number) => arr[Math.floor((Math.abs(Math.sin((i + 1) * (n + 1.7))) * 100000) % arr.length)],
    int: (min: number, max: number, n: number) => Math.floor(min + ((Math.abs(Math.sin((i + 1) * (n + 2.3))) * 100000) % 1) * (max - min + 1)),
  };
}

export const CANDIDATES: Candidate[] = Array.from({ length: 48 }).map((_, i) => {
  const s = seeded(i);
  const first = s.pick(firstNames, 1);
  const last = s.pick(lastNames, 2);
  const name = `${first} ${last}`;
  const job = s.pick(JOBS.slice(0, 6), 3);
  const stage = STAGES[s.int(0, STAGES.length - 1, 4)];
  const skills = Array.from(new Set([s.pick(skillsPool, 5), s.pick(skillsPool, 6), s.pick(skillsPool, 7), s.pick(skillsPool, 8)]));
  return {
    id: `cand_${i + 1}`,
    name,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${s.pick(["gmail.com","proton.me","hey.com","fastmail.com"], 9)}`,
    phone: `+1 (${s.int(200, 999, 10)}) ${s.int(100, 999, 11)}-${s.int(1000, 9999, 12)}`,
    location: s.pick(locations, 13),
    title: s.pick(titles, 14),
    company: s.pick(companies, 15),
    jobId: job.id,
    stage,
    rating: s.int(2, 5, 16),
    tags: [s.pick(["Referral","Inbound","Sourced","Alumni","Priority"], 17)],
    skills,
    experience: s.int(2, 14, 18),
    recruiter: s.pick(recruiters, 19),
    appliedAt: `2026-0${s.int(4, 6, 20)}-${String(s.int(1, 28, 21)).padStart(2, "0")}`,
    lastActivity: `${s.int(1, 48, 22)}h ago`,
    priority: s.pick([PriorityLevel.HIGH, PriorityLevel.MEDIUM, PriorityLevel.LOW], 23),
    avatarSeed: `${name}-${i}`,
    summary: `${s.int(3, 12, 24)}+ years shipping ${s.pick(["consumer","B2B SaaS","enterprise","developer tools"], 25)} products. Previously at ${s.pick(companies, 26)}.`,
    education: [
      { school: s.pick(["Stanford University","MIT","UC Berkeley","Carnegie Mellon","IIT Bombay","University of Toronto","ETH Zürich"], 27), degree: s.pick(["B.S. Computer Science","M.S. HCI","B.A. Design","B.S. Engineering"], 28), year: `${2015 + s.int(0, 8, 29)}` },
    ],
    workHistory: [
      { company: s.pick(companies, 30), role: s.pick(titles, 31), period: "2023 — Present", description: "Led design for the core product surface. Shipped 4 major releases; grew activation by 38%." },
      { company: s.pick(companies, 32), role: s.pick(titles, 33), period: "2020 — 2023", description: "Owned the design system and cross-team primitives across a 20-person design org." },
    ],
  };
});

export const INTERVIEWS: Interview[] = CANDIDATES.slice(0, 14).map((c, i) => {
  const statuses = [InterviewStatus.SCHEDULED, InterviewStatus.COMPLETED];
  const types = [InterviewType.SCREENING, InterviewType.TECHNICAL, InterviewType.HR, InterviewType.CULTURE, InterviewType.FINAL];
  const locs = [InterviewLocation.GOOGLE_MEET, InterviewLocation.ZOOM, InterviewLocation.ON_SITE];
  return {
    id: `int_${i + 1}`,
    candidateId: c.id,
    jobId: c.jobId,
    type: types[i % types.length],
    interviewer: recruiters[i % recruiters.length],
    date: `2026-07-0${(i % 9) + 1}`,
    time: `${9 + (i % 8)}:${i % 2 === 0 ? "00" : "30"}`,
    duration: [30, 45, 60][i % 3],
    status: i < 8 ? statuses[0] : statuses[1],
    location: locs[i % locs.length],
  };
});

export const TIMELINE: TimelineEvent[] = [];

function getStageLabel(stage: CandidateStage): string {
  switch (stage) {
    case CandidateStage.APPLIED: return "Applied";
    case CandidateStage.SCREENING: return "Screening";
    case CandidateStage.INTERVIEW_SCHEDULED: return "Interview Scheduled";
    case CandidateStage.TECHNICAL_ROUND: return "Technical Round";
    case CandidateStage.HR_ROUND: return "HR Round";
    case CandidateStage.OFFER_SENT: return "Offer Sent";
    case CandidateStage.HIRED: return "Hired";
    default: return "Unknown";
  }
}

function createEvent(stage: CandidateStage, type: TimelineEventType, title: string, detail: string, actor: string): TimelineEvent {
  return {
    id: `evt_${Math.random().toString(36).substring(7)}`,
    jobId: "",
    candidateId: "",
    type,
    title,
    detail,
    actor,
    at: "0h ago",
  };
}

JOBS.forEach((j, i) => {
  TIMELINE.push({
    id: `evt_job_${j.id}`,
    jobId: j.id,
    candidateId: undefined as any,
    type: "job_posted" as any,
    title: `Posted new job: ${j.title}`,
    detail: `${j.department} · ${j.location}`,
    actor: j.createdBy,
    at: `${(i * 3 + 1) % 24}h ago`,
  });
});

CANDIDATES.forEach((c, i) => {
  const job = jobById(c.jobId);
  if (!job) return;
  const events: TimelineEvent[] = [];
  
  switch (c.stage as unknown as CandidateStage) {
      case CandidateStage.APPLIED:
        events.push(createEvent(CandidateStage.APPLIED, TimelineEventType.STAGE_CHANGED, "Applied via Careers Page", "Candidate applied to " + job.title, "System"));
        break;
      case CandidateStage.SCREENING:
        events.push(createEvent(CandidateStage.APPLIED, TimelineEventType.STAGE_CHANGED, "Applied via Careers Page", "Candidate applied to " + job.title, "System"));
        events.push(createEvent(CandidateStage.SCREENING, TimelineEventType.STAGE_CHANGED, "Moved to Screening", "Resume review completed", c.recruiter));
        break;
      case CandidateStage.INTERVIEW_SCHEDULED:
        events.push(createEvent(CandidateStage.APPLIED, TimelineEventType.STAGE_CHANGED, "Applied via Careers Page", "Candidate applied to " + job.title, "System"));
        events.push(createEvent(CandidateStage.SCREENING, TimelineEventType.STAGE_CHANGED, "Moved to Screening", "Resume review completed", c.recruiter));
        events.push(createEvent(CandidateStage.INTERVIEW_SCHEDULED, TimelineEventType.INTERVIEW_SCHEDULED, "Interview Scheduled", "Technical screen with " + job.hiringManager, c.recruiter));
        break;
      case CandidateStage.TECHNICAL_ROUND:
        events.push(createEvent(CandidateStage.APPLIED, TimelineEventType.STAGE_CHANGED, "Applied via Careers Page", "Candidate applied to " + job.title, "System"));
        events.push(createEvent(CandidateStage.SCREENING, TimelineEventType.STAGE_CHANGED, "Moved to Screening", "Resume review completed", c.recruiter));
        events.push(createEvent(CandidateStage.TECHNICAL_ROUND, TimelineEventType.INTERVIEW_COMPLETED, "Technical Round Completed", "Strong problem solving skills", job.hiringManager));
        break;
      case CandidateStage.OFFER_SENT:
      case CandidateStage.HR_ROUND:
        events.push(createEvent(CandidateStage.APPLIED, TimelineEventType.STAGE_CHANGED, "Applied via Careers Page", "Candidate applied to " + job.title, "System"));
        events.push(createEvent(CandidateStage.SCREENING, TimelineEventType.STAGE_CHANGED, "Moved to Screening", "Resume review completed", c.recruiter));
        events.push(createEvent(CandidateStage.TECHNICAL_ROUND, TimelineEventType.INTERVIEW_COMPLETED, "Technical Round Completed", "Strong problem solving skills", job.hiringManager));
        events.push(createEvent(c.stage as unknown as CandidateStage, TimelineEventType.STAGE_CHANGED, "Moved to " + getStageLabel(c.stage as unknown as CandidateStage), "Moving forward in process", c.recruiter));
        break;
      case CandidateStage.HIRED:
        events.push(createEvent(CandidateStage.APPLIED, TimelineEventType.STAGE_CHANGED, "Applied via Careers Page", "Candidate applied to " + job.title, "System"));
        events.push(createEvent(CandidateStage.SCREENING, TimelineEventType.STAGE_CHANGED, "Moved to Screening", "Resume review completed", c.recruiter));
        events.push(createEvent(CandidateStage.TECHNICAL_ROUND, TimelineEventType.INTERVIEW_COMPLETED, "Technical Round Completed", "Passed technical assessment", job.hiringManager));
        events.push(createEvent(CandidateStage.OFFER_SENT, TimelineEventType.STAGE_CHANGED, "Offer Sent", "Candidate reviewing offer", c.recruiter));
        events.push(createEvent(CandidateStage.HIRED, TimelineEventType.ONBOARDED, "Hired", "Offer accepted", c.recruiter));
        break;
    default:
        events.push(createEvent(CandidateStage.APPLIED, TimelineEventType.STAGE_CHANGED, "Applied via Careers Page", "Candidate applied to " + job.title, "System"));
        events.push(createEvent(c.stage as unknown as CandidateStage, TimelineEventType.STAGE_CHANGED, "Moved to " + getStageLabel(c.stage as unknown as CandidateStage), "Status updated", c.recruiter));
        break;
  }
  TIMELINE.push(...events.map(e => ({ ...e, candidateId: c.id, jobId: c.jobId, at: `${(i % 24)}h ago` })));
});

// Sort to ensure newer events (smaller hours ago) might appear earlier, though arbitrary here
TIMELINE.sort((a, b) => parseInt(a.at) - parseInt(b.at));

export const EMAIL_THREADS: EmailThread[] = CANDIDATES.slice(0, 18).map((c, i) => ({
  id: `thr_${i + 1}`,
  candidateId: c.id,
  subject: i % 3 === 0 ? `Next steps for ${c.title}` : i % 3 === 1 ? "Loved chatting — a couple of thoughts" : "Interview confirmation & prep",
  preview:
    i % 3 === 0 ? "Hi — thanks for taking the time. Wanted to share what our next round looks like…" :
    i % 3 === 1 ? "Really enjoyed our conversation earlier. I dug into your portfolio and had a few…" :
    "Confirming your interview on Thursday at 2pm PT. Here's what to expect and who you'll…",
  unread: i < 4,
  starred: i % 5 === 0,
  archived: i >= 14,
  messages: [
    { id: `m_${i}_1`, from: c.email, to: "priya@grovyn.com", at: "2d ago", body: `Hi Priya,\n\nThanks so much for reaching out about the ${c.title} role. I'd love to learn more — the product direction sounds really compelling.\n\nCould we find 30 minutes this week?\n\nBest,\n${c.name.split(" ")[0]}` },
    { id: `m_${i}_2`, from: "priya@grovyn.com", to: c.email, at: "1d ago", body: `Hi ${c.name.split(" ")[0]},\n\nAbsolutely — how does Thursday at 10am PT work? I'll send over a Google Meet invite.\n\nLooking forward,\nPriya` },
  ],
}));

export const NOTIFICATIONS = [
  { id: "n1", title: "New application", detail: "Isabella Rodriguez applied to Senior Product Designer", at: "12m ago", unread: true, type: "application" as const },
  { id: "n2", title: "Interview in 30 min", detail: "Technical round with Kenji Tanaka · Google Meet", at: "28m ago", unread: true, type: "interview" as const },
  { id: "n3", title: "Offer accepted 🎉", detail: "Amara Okafor accepted the Staff Engineer offer", at: "2h ago", unread: true, type: "offer" as const },
  { id: "n4", title: "Reply from candidate", detail: "Diego Fernandez replied to your message", at: "5h ago", unread: false, type: "email" as const },
  { id: "n5", title: "Task due today", detail: "Send feedback for Leilani Ka'ai (Technical)", at: "6h ago", unread: false, type: "task" as const },
];

export const TASKS = [
  { id: "t1", title: "Send feedback for Leilani Ka'ai", due: "Today", done: false, candidateId: "cand_5" },
  { id: "t2", title: "Schedule HR round for Diego Fernandez", due: "Today", done: false, candidateId: "cand_4" },
  { id: "t3", title: "Follow up with Isabella Rodriguez", due: "Tomorrow", done: false, candidateId: "cand_2" },
  { id: "t4", title: "Review 12 new applications for PM, Growth", due: "This week", done: false },
  { id: "t5", title: "Draft offer for Amara Okafor", due: "Done", done: true, candidateId: "cand_3" },
];

export function candidateById(id: string) {
  return CANDIDATES.find((c) => c.id === id);
}
export function jobById(id: string) {
  return JOBS.find((j) => j.id === id);
}
export function candidatesForJob(id: string) {
  return CANDIDATES.filter((c) => c.jobId === id);
}
export function timelineFor(id: string) {
  return TIMELINE.filter((t) => t.candidateId === id);
}
export function threadsFor(id: string) {
  return EMAIL_THREADS.filter((t) => t.candidateId === id);
}

export function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  ["oklch(0.85 0.08 25)", "oklch(0.7 0.14 25)"],
  ["oklch(0.85 0.08 165)", "oklch(0.65 0.14 165)"],
  ["oklch(0.85 0.08 240)", "oklch(0.65 0.14 240)"],
  ["oklch(0.85 0.08 75)", "oklch(0.7 0.14 75)"],
  ["oklch(0.85 0.08 310)", "oklch(0.65 0.14 310)"],
  ["oklch(0.85 0.08 190)", "oklch(0.65 0.14 190)"],
];
export function avatarGradient(seed: string) {
  const idx = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [a, b] = AVATAR_COLORS[idx];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function generateHistoricalDensity(role: string, seed: number) {
  const data: Record<string, number> = {};
  const today = new Date();
  
  // Fill the last 90 days to populate the calendar
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i - 1); // Previous days only
    const dateStr = d.toISOString().split("T")[0];
    
    let max = role === "Administrator" || role === "Hiring Manager" ? 300 : 25;
    
    // Simple deterministic random based on seed and day index
    const s = Math.abs(Math.sin((seed + 1) * (i + 1))) * 10000;
    
    // Weekends have very low activity
    if (d.getDay() === 0 || d.getDay() === 6) {
       max = Math.floor(max * 0.05);
    }
    
    // Sometimes 0 activity
    if (s % 1 > 0.8) {
      data[dateStr] = 0;
    } else {
      data[dateStr] = Math.floor((s % 1) * max);
    }
  }
  return data;
}

export function getTodaysActivities(role: string, user: { name: string, department?: string }) {
  const allowedTypes = [
    "job_posted",
    "referral_added",
    "stage_changed",
    "interview_scheduled",
    "interview_completed",
    "onboarded",
  ];

  // Filter events by allowed type and role visibility
  const events = TIMELINE.filter((e) => {
    if (!allowedTypes.includes(e.type)) return false;

    if (role === "Administrator") return true;
    if (role === "Hiring Manager") {
      const job = jobById(e.jobId || "");
      if (job) return job.department === user.department;
      return false;
    }
    return e.actor === user.name;
  });
  
  // Mock today's schedule times
  return events.slice(0, 10).map((e, idx) => {
    // Generate realistic times from morning to afternoon
    let hr = 8 + Math.floor(idx * 0.8);
    if (hr > 17) hr = 17;
    const min = ["00", "15", "30", "45"][idx % 4];
    const ampm = hr >= 12 ? "PM" : "AM";
    const displayHr = hr > 12 ? hr - 12 : hr;
    
    return {
      ...e,
      at: `${String(displayHr).padStart(2, "0")}:${min} ${ampm}`
    };
  });
}
