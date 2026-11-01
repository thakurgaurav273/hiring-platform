import { api } from "./axios";

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location?: string | null;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  experience?: string | null;
  skills: string[];
  description: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status: "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED";
  numOpenings: number;
  applicationDeadline?: string | null;
  /** Custom questions on the public application form. */
  applicationQuestions?: import("@/lib/careers").ApplicationQuestion[] | null;
  recruiterId: string;
  recruiter: UserSummary;
  hiringManagerId?: string | null;
  hiringManager?: UserSummary | null;
  createdById?: string | null;
  createdBy?: UserSummary | null;
  createdAt: string;
  updatedAt: string;
  hiringTeamMembers?: (UserSummary & { department?: string })[];
  jobInvitations?: { id: string; userId: string; status: string; user: UserSummary }[];
  _count?: {
    applications: number;
  };
}

export interface JobsResponse {
  success: boolean;
  message: string;
  data: {
    jobs: Job[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface JobResponse {
  success: boolean;
  message: string;
  data: Job;
}

export const getJobs = async (params?: { page?: number; limit?: number; search?: string; department?: string; status?: string; isReferral?: boolean }) => {
  const { data } = await api.get<JobsResponse>("/jobs", { params });
  return data;
};

export const getJobById = async (id: string) => {
  const { data } = await api.get<JobResponse>(`/jobs/${id}`);
  return data;
};

export const createJob = async (jobData: any) => {
  const { data } = await api.post<{ success: boolean; data: Job }>("/jobs", jobData);
  return data;
};

export const updateJob = async (id: string, jobData: any) => {
  const { data } = await api.patch<{ success: boolean; data: Job }>(`/jobs/${id}`, jobData);
  return data;
};

export const deleteJob = async (id: string) => {
  const { data } = await api.delete<{ success: boolean }>(`/jobs/${id}`);
  return data;
};

export const getEligibleTeamMembers = async (id: string) => {
  const { data } = await api.get<{ success: boolean; data: any[] }>(`/jobs/${id}/eligible-team-members`);
  return data;
};

export const inviteToHiringTeam = async (id: string, userId: string) => {
  const { data } = await api.post<{ success: boolean; data: any }>(`/jobs/${id}/hiring-team/invite`, { userId });
  return data;
};

export const acceptHiringTeamInvitation = async (token: string) => {
  const { data } = await api.post<{ success: boolean; data: any }>(`/jobs/invitations/accept`, { token });
  return data;
};
