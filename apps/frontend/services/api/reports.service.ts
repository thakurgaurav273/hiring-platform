import { api } from "@/services/api/axios";

export interface ReportsKpis {
  totalApplications: number;
  totalInterviews: number;
  offerAcceptanceRate: number;
  avgTimeToHire: number;
}

export interface WeeklyCount {
  week: string;
  count: number;
}

export interface DeptCount {
  department: string;
  count: number;
}

export interface FunnelStageData {
  stage: string;
  value: number;
  conv: string;
}

export interface SourceStats {
  sourceType: string;
  label: string;
  applications: number;
  /** Applications that reached the interview stage or later. */
  interviewed: number;
  hired: number;
  /** Whole-number percentages of applications. */
  interviewRate: number;
  hireRate: number;
}
export interface ReportsData {
  kpis: ReportsKpis;
  applicationsOverTime: WeeklyCount[];
  applicationsPerDepartment: DeptCount[];
  funnelStages: FunnelStageData[];
  applicationsBySource: SourceStats[];
}

export const fetchReports = async (): Promise<ReportsData> => {
  const { data } = await api.get<{ data: ReportsData }>("/reports");
  return data.data;
};
