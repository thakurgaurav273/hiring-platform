import { useQuery } from "@tanstack/react-query";
import { fetchReports } from "@/services/api/reports.service";

export const reportsKeys = {
  all: ["reports"] as const,
  overview: () => [...reportsKeys.all, "overview"] as const,
};

export const useReports = () => {
  return useQuery({
    queryKey: reportsKeys.overview(),
    queryFn: fetchReports,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
