import { api } from "./axios";

export interface Interviewer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
}

export interface InterviewPanelist {
    id: string;
    interviewId: string;
    interviewerId: string;
    interviewer: Interviewer;
}

export interface Interview {
    id: string;
    applicationId: string;
    type: "SCREENING" | "TECHNICAL" | "HR" | "MANAGERIAL" | "FINAL";
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
    scheduledAt: string;
    durationMins: number;
    location?: string;
    meetingLink?: string;
    createdAt: string;
    updatedAt: string;
    panelists: InterviewPanelist[];
    /** Feedback submitted for this interview (summary only). */
    feedbacks?: InterviewFeedbackSummary[];
    application?: {
        candidate: { id: string; firstName: string; lastName: string; email: string };
        job: { id: string; title: string; department?: string };
    };
}

export type Recommendation = "STRONG_YES" | "YES" | "NEUTRAL" | "NO" | "STRONG_NO";

export interface InterviewFeedbackSummary {
    id: string;
    interviewerId: string;
    rating: number;
    recommendation: Recommendation;
}

export interface InterviewsResponse {
    interviews: Interview[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const createInterview = async (data: {
    applicationId: string;
    type: string;
    scheduledAt: string;
    durationMins?: number;
    location?: string;
    meetingLink?: string;
    interviewerIds: string[];
}): Promise<Interview> => {
    const res = await api.post("/interviews", data);
    return res.data;
};

export const getInterviews = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    orderBy?: "asc" | "desc";
}): Promise<InterviewsResponse> => {
    const res = await api.get("/interviews", { params });
    return res.data;
};

export const getInterviewById = async (id: string): Promise<Interview> => {
    const res = await api.get(`/interviews/${id}`);
    return res.data;
};

export const updateInterview = async (
    id: string,
    data: Partial<Omit<Interview, "id" | "createdAt" | "updatedAt" | "applicationId" | "panelists" | "application" | "feedbacks">> & { interviewerIds?: string[] }
): Promise<Interview> => {
    const res = await api.patch(`/interviews/${id}`, data);
    return res.data;
};
