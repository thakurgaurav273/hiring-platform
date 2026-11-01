import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/axios";
import type { Stage } from "@/lib/types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
};

interface KpiData {
  label: string;
  value: string;
  to?: string;
}

interface FunnelData {
  stage: Stage;
  count: number;
}

export interface DashboardOverview {
  kpis: KpiData[];
  funnelBars: FunnelData[];
  recentApplications: any[];
  upcomingInterviews: any[];
  recentEvents: any[];
  recentEmails: any[];
}

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardOverview }>("/dashboard");
      return data.data;
    },
  });
};

