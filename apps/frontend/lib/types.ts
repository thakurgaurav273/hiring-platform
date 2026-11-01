// Shared TypeScript types extracted from lib/mock-data.ts and store/app.store.ts
// This is the single source of truth for all entity types.
// lib/mock-data.ts re-exports everything from here for backward compatibility.

import {
  JobStatus,
  JobType,
  CandidateStage,
  PriorityLevel,
  InterviewStatus,
  InterviewType,
  InterviewLocation,
  ApplicationStatus,
  TimelineEventType,
} from "@/constants/enums";

// ─── Hiring Pipeline ──────────────────────────────────────────────────────────

export type Stage = CandidateStage;

export type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  status: JobStatus;
  openings: number;
  applicants: number;
  recruiter: string;
  hiringManager: string;
  postedAt: string;
  description: string;
  createdBy: string;
  hiringTeam?: string[];
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  company: string;
  jobId: string;
  stage: CandidateStage;
  rating: number;
  tags: string[];
  skills: string[];
  experience: number;
  recruiter: string;
  appliedAt: string;
  lastActivity: string;
  priority: PriorityLevel;
  avatarSeed: string;
  referredBy?: string;
  summary: string;
  education: { school: string; degree: string; year: string }[];
  workHistory: { company: string; role: string; period: string; description: string }[];
};

export type Interview = {
  id: string;
  candidateId: string;
  jobId: string;
  type: InterviewType;
  interviewer: string;
  date: string;
  time: string;
  duration: number;
  status: InterviewStatus;
  location: InterviewLocation;
};

export type TimelineEvent = {
  id: string;
  candidateId: string;
  type: TimelineEventType;
  title: string;
  detail: string;
  actor: string;
  at: string;
  jobId?: string;
};

export type EmailThread = {
  id: string;
  candidateId: string;
  subject: string;
  preview: string;
  unread: boolean;
  starred: boolean;
  archived?: boolean;
  messages: {
    id: string;
    from: string;
    to: string;
    at: string;
    body: string;
    attachments?: { name: string; size: string }[];
  }[];
};

// ─── Store Types ──────────────────────────────────────────────────────────────

export type Application = {
  id: string;
  jobId: string;
  appliedAt: string;
  status: ApplicationStatus;
};

// ─── Funnel / Reports ─────────────────────────────────────────────────────────

export type FunnelStage = {
  name: string;
  value: number;
  conv: string;
  color: string;
};
