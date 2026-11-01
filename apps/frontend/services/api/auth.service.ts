import { api } from "./axios";
import { type LoginFormValues } from "@/lib/schemas/login.schema";
import { type Role } from "@/constants/enums";
import type { Workspace } from "@/lib/theme/types";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  title?: string;
  department?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  notificationPreferences?: Record<string, boolean>;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
    workspace: Workspace;
    accessToken: string;
    refreshToken: string;
  };
}

export const authService = {
  login: async (credentials: LoginFormValues): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post("/auth/logout", { refreshToken });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post("/auth/reset-password", { token, password });
  },

  changePassword: async (data: Record<string, string>): Promise<void> => {
    await api.patch("/auth/change-password", data);
  },
};
