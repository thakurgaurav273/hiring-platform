import { api } from "./axios";
import type { Job } from "./jobs.service";

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  referredBy?: string | null;
  referredOn?: string | null;
  skills: string[];
  experience?: any;
  education?: any;
  socialLinks?: any;
  tags: string[];
  source?: string | null;
  createdAt: string;
  updatedAt: string;
  applications?: any[];
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  currentStage: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  candidate: Candidate;
  job: Job;
}

export interface CandidatesResponse {
  success: boolean;
  message: string;
  data: {
    candidates: Application[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface CandidateResponse {
  success: boolean;
  message: string;
  data: Candidate;
}

export const getCandidates = async (params?: { page?: number; limit?: number; search?: string; department?: string | string[]; stage?: string | string[]; jobId?: string | string[]; referredBy?: string }) => {
  const { data } = await api.get<CandidatesResponse>("/candidates", { params });
  return data;
};

export const createCandidate = async (candidateData: any) => {
  const isFormData = candidateData instanceof FormData;
  const { data } = await api.post<{
    success: boolean;
    /** candidateCreated is false when an existing candidate (same email) got a new application. */
    data: { id: string; applicationId: string; candidateCreated: boolean };
  }>(
    "/candidates",
    candidateData,
    {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    }
  );
  return data;
};

export const getCandidateById = async (id: string) => {
  const { data } = await api.get<CandidateResponse>(`/candidates/${id}`);
  return data;
};

export const updateCandidateStage = async (id: string, stage: string) => {
  const { data } = await api.patch<{ success: boolean; data: any }>(`/candidates/${id}/stage`, { stage });
  return data;
};

export const getCandidateTimeline = async (id: string) => {
  const { data } = await api.get<{ success: boolean; data: any[] }>(`/candidates/${id}/timeline`);
  return data;
};
