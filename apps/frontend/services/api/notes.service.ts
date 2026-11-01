import { api } from "./axios";

export interface Note {
    id: string;
    candidateId: string;
    authorId: string;
    content: string;
    opinion: string;
    createdAt: string;
    author: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    }
}

export interface NotesResponse {
    success: boolean;
    message: string;
    data: Note[];
}

export interface NoteResponse {
    success: boolean;
    message: string;
    data: Note;
}

export const getCandidateNotes = async (candidateId: string) => {
    const { data } = await api.get<NotesResponse>(`/candidates/${candidateId}/notes`);
    return data.data;
};

export const addCandidateNote = async ({ candidateId, content, opinion }: { candidateId: string, content: string, opinion: string }) => {
    const { data } = await api.post<NoteResponse>(`/candidates/${candidateId}/notes`, { content, opinion });
    return data.data;
};
