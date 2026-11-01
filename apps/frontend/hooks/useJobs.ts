import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobs, getJobById, createJob, updateJob, deleteJob, getEligibleTeamMembers, inviteToHiringTeam, acceptHiringTeamInvitation } from "@/services/api/jobs.service";

export const useJobs = (
  params?: { page?: number; limit?: number; search?: string; department?: string; status?: string; isReferral?: boolean },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => getJobs(params),
    enabled: options?.enabled ?? true,
  });
};

export const useJob = (id: string) => {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => getJobById(id),
    enabled: !!id,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateJob(id, data),
    onSuccess: (_: any, { id }: any) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

export const useEligibleTeamMembers = (jobId: string) => {
  return useQuery({
    queryKey: ["jobs", jobId, "eligible-team-members"],
    queryFn: () => getEligibleTeamMembers(jobId),
    enabled: !!jobId,
  });
};

export const useInviteToHiringTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => inviteToHiringTeam(id, userId),
    onSuccess: (_: any, { id }: any) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", id, "eligible-team-members"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id] });
    },
  });
};

export const useAcceptHiringTeamInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptHiringTeamInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};
