"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import { organizationService } from "@/services/api/organization.service";
import type { AppearanceMode } from "@/lib/theme/types";

// Keyed by user so a cached workspace is never handed to a different account
// (e.g. another organization's user signing in on the same browser tab).
export const workspaceQueryKey = (userId: string | undefined) => ["workspace", userId ?? "anonymous"] as const;

/**
 * Keeps the persisted workspace (organization, branding, preferences) in sync
 * with the server, so branding changes made by an admin reach every member on
 * their next load or window focus.
 */
export function useWorkspaceSync() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const userId = useAppStore((s) => s.authUser?.id);
  const setWorkspace = useAppStore((s) => s.setWorkspace);

  const query = useQuery({
    queryKey: workspaceQueryKey(userId),
    queryFn: organizationService.getWorkspace,
    enabled: isAuthenticated && !!userId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) setWorkspace(query.data);
  }, [query.data, setWorkspace]);

  return query;
}

/** Updates the signed-in user's own appearance (null = follow organization default). */
export function useUpdateAppearance() {
  const queryClient = useQueryClient();
  const setAppearancePreference = useAppStore((s) => s.setAppearancePreference);

  return useMutation({
    mutationFn: (appearance: AppearanceMode | null) => organizationService.updatePreferences(appearance),
    onMutate: (appearance) => {
      const previous = useAppStore.getState().workspace?.preferences.appearance ?? null;
      setAppearancePreference(appearance); // apply immediately
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      setAppearancePreference(ctx?.previous ?? null);
      toast.error("Couldn't save your appearance preference");
    },
    onSuccess: (prefs) => {
      setAppearancePreference(prefs.appearance);
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
}
