"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Retry only failures that might succeed on a second try: network errors and
 * 5xx. Client errors (400–499, including 401 and 429) are returned
 * immediately; retrying them only multiplies traffic.
 */
function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { status?: number } | null)?.status;
  if (status !== undefined && status >= 400 && status < 500) return false;
  return failureCount < 1;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: shouldRetry,
            // Switching browser tabs should not refetch every query on the
            // page. Queries that need it (e.g. unread notification count) opt in.
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
