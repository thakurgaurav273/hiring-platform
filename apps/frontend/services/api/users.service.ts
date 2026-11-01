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

export interface PaginatedUsers {
  users: UserProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const usersService = {
  updateProfile: async (data: UpdateProfilePayload): Promise<UserProfile> => {
    const response = await api.patch<UpdateProfileResponse>("/users/me", data);
    return response.data.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<PaginatedUsers> => {
    const response = await api.get<{ data: PaginatedUsers }>("/users", { params });
    return response.data.data;
  },

  inviteUser: async (data: { email: string; role: string }): Promise<any> => {
    const response = await api.post("/users/invite", data);
    return response.data;
  },

  getInvitation: async (token: string): Promise<{ email: string; role: string }> => {
    const response = await api.get<{ data: { email: string; role: string } }>(`/users/invitations/${token}`);
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

  deleteUser: async (id: string): Promise<any> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
