import { api } from "./axios";

export interface Resume {
    id: string;
    candidateId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    storageProvider: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    downloadUrl?: string;
}

export interface ResumesResponse {
    success: boolean;
    message: string;
    data: Resume[];
}

export const getResumesByCandidateId = async (candidateId: string) => {
    const { data } = await api.get<ResumesResponse>(`/resumes/candidate/${candidateId}`);
    return data;
};

export const uploadResume = async (candidateId: string, file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    const { data } = await api.post(`/resumes/candidate/${candidateId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
};
