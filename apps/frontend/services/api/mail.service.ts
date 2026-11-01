import { api } from "./axios";

export interface Message {
  id: string;
  direction?: "INBOUND" | "OUTBOUND";
  from: string;
  fromName?: string;
  to: string;
  at: string;
  body: string;
  attachments?: any[];
}

export interface Thread {
  id: string;
  candidateId?: string | null;
  /** The candidate this conversation is with, when linked. */
  candidate?: { id: string; name: string; email: string } | null;
  subject: string;
  preview: string;
  lastMessageAt?: string;
  unread: boolean;
  starred: boolean;
  archived: boolean;
  messages: Message[];
}

export interface MailboxCounts {
  inbox: number;
  starred: number;
  sent: number;
  drafts: number;
  archive: number;
}

export const mailService = {
  getThreads: async (folder: string): Promise<Thread[]> => {
    const response = await api.get(`/mail/threads?folder=${folder}`);
    return response.data.data;
  },

  getThreadById: async (threadId: string): Promise<Thread> => {
    const response = await api.get(`/mail/thread/${threadId}`);
    return response.data.data;
  },

  getCandidateThreads: async (candidateId: string): Promise<Thread[]> => {
    const response = await api.get(`/mail/candidate/${candidateId}/threads`);
    return response.data.data;
  },

  getCounts: async (): Promise<MailboxCounts> => {
    const response = await api.get("/mail/counts");
    return response.data.data;
  },

  updateThread: async (
    threadId: string,
    updates: { isUnread?: boolean; isStarred?: boolean; isArchived?: boolean }
  ) => {
    const response = await api.patch(`/mail/thread/${threadId}`, updates);
    return response.data;
  },

  deleteThread: async (threadId: string) => {
    const response = await api.delete(`/mail/thread/${threadId}`);
    return response.data;
  },

  sendEmail: async (data: {
    to: string;
    cc?: string[];
    subject: string;
    body: string;
    candidateId?: string;
    threadId?: string;
    attachments?: any[];
  }) => {
    const response = await api.post("/mail", data);
    return response.data;
  },

  replyToEmail: async (
    emailId: string,
    data: { body: string; subject?: string; cc?: string[]; attachments?: any[] }
  ) => {
    const response = await api.post(`/mail/${emailId}/reply`, data);
    return response.data;
  },
};
