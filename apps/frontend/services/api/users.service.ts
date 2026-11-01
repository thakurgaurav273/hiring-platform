import type { InvitationBranding } from "@/lib/theme/types";

export interface InvitationDetails {
  email: string;
  role: string;
  /** The inviting organization, so the page can show its branding. */
  organization: { name: string; branding: InvitationBranding };
}

import { api } from "./axios";
import type { UserProfile } from "./auth.service";

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  phone?: string;
  address?: string;
  notificationPreferences?: Record<string, boolean>;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

/** A member as returned by the admin users list. */
export type Member = UserProfile & { isActive: boolean; createdAt: string };
export interface PaginatedUsers {
  users: Member[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const usersService = {
  /** Full profile of the signed-in user (the login response only has the basics). */
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<{ data: UserProfile }>("/users/me");
    return response.data.data;
  },
  updateProfile: async (data: UpdateProfilePayload): Promise<UserProfile> => {
    const response = await api.patch<UpdateProfileResponse>("/users/me", data);
    return response.data.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; role?: string; search?: string; isActive?: "true" | "false" }): Promise<PaginatedUsers> => {
    const response = await api.get<{ data: PaginatedUsers }>("/users", { params });
    return response.data.data;
  },

  inviteUser: async (data: { email: string; role: string }): Promise<any> => {
    const response = await api.post("/users/invite", data);
    return response.data;
  },

  getInvitation: async (token: string): Promise<InvitationDetails> => {
    const response = await api.get<{ data: InvitationDetails }>(`/users/invitations/${token}`);
    return response.data.data;
  },

  acceptInvitation: async (token: string, data: { name: string; password: string }): Promise<any> => {
    const response = await api.post(`/users/invitations/${token}/accept`, data);
    return response.data;
  },

  updateUserRole: async (id: string, role: string): Promise<any> => {
    const response = await api.patch(`/users/${id}`, { role });
    return response.data;
  },

  /** Reactivates a deactivated member. */
  reactivateUser: async (id: string): Promise<any> => {
    const response = await api.patch(`/users/${id}`, { isActive: true });
    return response.data;
  },
  deleteUser: async (id: string): Promise<any> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
