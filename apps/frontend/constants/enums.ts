// Centralized Enums for Application Logic
// These identifiers are stable and should be used for all business logic, permissions, and routing.

export enum Role {
  ADMINISTRATOR = "administrator",
  HIRING_MANAGER = "hiring_manager",
  RECRUITER = "recruiter",
  EMPLOYEE = "employee",
}

export enum JobStatus {
  OPEN = "OPEN",
  DRAFT = "DRAFT",
  CLOSED = "CLOSED",
  ON_HOLD = "ON_HOLD",
}

export enum JobType {
  FULL_TIME = "FULL_TIME",
  CONTRACT = "CONTRACT",
  PART_TIME = "PART_TIME",
  INTERNSHIP = "INTERNSHIP",
}

export enum CandidateStage {
  APPLIED = "APPLIED",
  SCREENING = "SCREENING",
  SHORTLISTED = "SHORTLISTED",
  INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
  INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED",
  TECHNICAL_ROUND = "TECHNICAL_ROUND",
  HR_ROUND = "HR_ROUND",
  OFFER_SENT = "OFFER_SENT",
  HIRED = "HIRED",
  REJECTED = "REJECTED",
}

export enum PriorityLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum InterviewStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum InterviewType {
  SCREENING = "screening",
  TECHNICAL = "technical",
  HR = "hr",
  CULTURE = "culture",
  FINAL = "final",
}

export enum InterviewLocation {
  GOOGLE_MEET = "google_meet",
  ZOOM = "zoom",
  ON_SITE = "on_site",
}

export enum ApplicationStatus {
  UNDER_REVIEW = "under_review",
  INTERVIEW = "interview",
  OFFER = "offer",
  REJECTED = "rejected",
}

export enum TimelineEventType {
  JOB_POSTED = "job_posted",
  REFERRAL_ADDED = "referral_added",
  STAGE_CHANGED = "stage_changed",
  INTERVIEW_SCHEDULED = "interview_scheduled",
  INTERVIEW_COMPLETED = "interview_completed",
  ONBOARDED = "onboarded",
}

export enum OpinionOption {
  HIGHLY_RECOMMEND = "highly_recommend",
  RECOMMEND = "recommend",
  NEUTRAL = "neutral",
  AVERAGE = "average",
  BELOW_AVERAGE = "below_average",
}
