import { Role, CandidateStage } from "@/constants/enums";
import { Job } from "@/lib/types";

// ─── Permissions ──────────────────────────────────────────────────────────────

export function canViewAllJobs(role: Role): boolean {
  return role === Role.ADMINISTRATOR;
}

export function canEditJob(role: Role, userName: string, userDept: string | undefined, job: Job): boolean {
  if (role === Role.ADMINISTRATOR) return true;
  if (role === Role.HIRING_MANAGER) {
    return job.hiringManager === userName || job.department === userDept;
  }
  return false;
}

export function canManagePipeline(role: Role, userName: string, userDept: string | undefined, job: Job): boolean {
  if (role === Role.ADMINISTRATOR) return true;
  if (role === Role.HIRING_MANAGER) {
    return job.hiringManager === userName || job.department === userDept;
  }
  if (role === Role.RECRUITER) {
    return job.recruiter === userName || job.department === userDept;
  }
  return false;
}

export function canViewJobDetails(role: Role, userName: string, userDept: string | undefined, job: Job): boolean {
  if (role === Role.ADMINISTRATOR) return true;
  if (role === Role.EMPLOYEE) {
    return (job.hiringTeam?.includes(userName) ?? false) || job.createdBy === userName;
  }
  if (role === Role.HIRING_MANAGER) {
    return job.hiringManager === userName || job.department === userDept;
  }
  if (role === Role.RECRUITER) {
    return job.recruiter === userName || job.department === userDept;
  }
  return false;
}

export function canViewAllReports(role: Role): boolean {
  return role === Role.ADMINISTRATOR;
}

const STAGES_ORDER: CandidateStage[] = [
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

export function canMoveStage(currentStage: CandidateStage, newStage: CandidateStage): boolean {
  if (currentStage === newStage) return false;
  const currentIndex = STAGES_ORDER.indexOf(currentStage);
  const newIndex = STAGES_ORDER.indexOf(newStage);
  return newIndex > currentIndex;
}

export function getStagesOrder(): CandidateStage[] {
  return STAGES_ORDER;
}
