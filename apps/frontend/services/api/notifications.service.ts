import { api } from "./axios";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: string;
  isRead: boolean;
  link?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export const getNotifications = async (params?: { page?: number; limit?: number }) => {
  const { data } = await api.get<NotificationsResponse>("/notifications", { params });
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get<UnreadCountResponse>("/notifications/unread-count");
  return data;
};

export const markNotificationRead = async (id: string) => {
  const { data } = await api.patch<{ success: boolean }>(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch<{ success: boolean }>("/notifications/read-all");
  return data;
};

export const registerFcmToken = async (token: string) => {
  const { data } = await api.post<{ success: boolean }>("/notifications/fcm-token", { token });
  return data;
};
