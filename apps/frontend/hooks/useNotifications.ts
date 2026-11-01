import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/api/notifications.service";
import { useAppStore } from "@/store/app.store";

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  list: (page?: number) => ["notifications", "list", page] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

/** Paginated list of notifications for the current user */
export function useNotifications(page = 1) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page),
    queryFn: () => getNotifications({ page, limit: 30 }),
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    staleTime: 30_000, // 30 seconds
    select: (data) => data.data,
  });
}

/** Unread notification count — used by the bell badge */
export function useUnreadCount() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    staleTime: 15_000, // 15 seconds
    select: (data) => data.data.count,
  });
}

/** Mark a single notification as read */
export function useMarkRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/** Mark all notifications as read */
export function useMarkAllRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
