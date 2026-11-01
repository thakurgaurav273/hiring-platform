"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/app.store";
import { usersService } from "@/services/api/users.service";

/**
 * Loads the signed-in user's full profile (title, phone, address,
 * notification preferences…) and merges it into the auth store. The login
 * response only carries id, name, email and role, so screens that edit the
 * profile must wait for this before showing values.
 */
export function useMe() {
  const userId = useAppStore((s) => s.authUser?.id);
  const updateAuthUser = useAppStore((s) => s.updateAuthUser);
  const query = useQuery({
    queryKey: ["me", userId],
    queryFn: usersService.getMe,
    enabled: !!userId,
    staleTime: 30_000,
  });
  useEffect(() => {
    if (!query.data) return;
    const d = query.data;
    updateAuthUser({
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      role: d.role,
      title: d.title ?? undefined,
      department: d.department ?? undefined,
      phone: d.phone ?? undefined,
      address: d.address ?? undefined,
      avatarUrl: d.avatarUrl ?? undefined,
      notificationPreferences: d.notificationPreferences ?? {},
    });
  }, [query.data, updateAuthUser]);
  return query;
}
