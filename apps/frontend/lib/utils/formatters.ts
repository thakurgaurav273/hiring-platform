import {
  Role,
  JobStatus,
  CandidateStage,
  PriorityLevel,
  InterviewStatus,
  InterviewType,
  ApplicationStatus,
} from "@/constants/enums";

// ─── Formatters ───────────────────────────────────────────────────────────────

export function getRoleLabel(role: Role): string {
  switch (role) {
    case Role.ADMINISTRATOR: return "Administrator";
    case Role.HIRING_MANAGER: return "Hiring Manager";
    case Role.RECRUITER: return "Recruiter";
    case Role.EMPLOYEE: return "Employee";
    default: return String(role);
  }
}

export function getStageLabel(stage: CandidateStage): string {
  switch (stage) {
    case CandidateStage.APPLIED: return "Applied";
    case CandidateStage.SCREENING: return "Screening";
    case CandidateStage.SHORTLISTED: return "Shortlisted";
    case CandidateStage.INTERVIEW_SCHEDULED: return "Interview Scheduled";
    case CandidateStage.INTERVIEW_COMPLETED: return "Interview Completed";
    case CandidateStage.TECHNICAL_ROUND: return "Technical Round";
    case CandidateStage.HR_ROUND: return "HR Round";
    case CandidateStage.OFFER_SENT: return "Offer Sent";
    case CandidateStage.HIRED: return "Hired";
    case CandidateStage.REJECTED: return "Rejected";
    default: return String(stage);
  }
}

export function getJobStatusLabel(status: JobStatus): string {
  switch (status) {
    case JobStatus.OPEN: return "Open";
    case JobStatus.DRAFT: return "Draft";
    case JobStatus.CLOSED: return "Closed";
    case JobStatus.ON_HOLD: return "On Hold";
    default: return String(status);
  }
}

export function getPriorityLabel(priority: PriorityLevel): string {
  switch (priority) {
    case PriorityLevel.HIGH: return "High";
    case PriorityLevel.MEDIUM: return "Medium";
    case PriorityLevel.LOW: return "Low";
    default: return String(priority);
  }
}

export function getInterviewStatusLabel(status: InterviewStatus): string {
  switch (status) {
    case InterviewStatus.SCHEDULED: return "Scheduled";
    case InterviewStatus.COMPLETED: return "Completed";
    case InterviewStatus.CANCELLED: return "Cancelled";
    default: return String(status);
  }
}

export function getInterviewTypeLabel(type: InterviewType): string {
  switch (type) {
    case InterviewType.SCREENING: return "Screening";
    case InterviewType.TECHNICAL: return "Technical";
    case InterviewType.HR: return "HR";
    case InterviewType.CULTURE: return "Culture";
    case InterviewType.FINAL: return "Final";
    default: return String(type);
  }
}

export function getApplicationStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case ApplicationStatus.UNDER_REVIEW: return "Under Review";
    case ApplicationStatus.INTERVIEW: return "Interview";
    case ApplicationStatus.OFFER: return "Offer";
    case ApplicationStatus.REJECTED: return "Rejected";
    default: return String(status);
  }
}
