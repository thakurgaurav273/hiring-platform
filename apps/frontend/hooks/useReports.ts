import { useQuery } from "@tanstack/react-query";
import { fetchReports } from "@/services/api/reports.service";

export const reportsKeys = {
  all: ["reports"] as const,
  overview: () => [...reportsKeys.all, "overview"] as const,
};

export const useReports = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: reportsKeys.overview(),
    queryFn: fetchReports,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
