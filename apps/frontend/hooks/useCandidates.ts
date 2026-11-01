import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCandidates, createCandidate, getCandidateById } from "../services/api/candidates.service";

export const useCandidates = (params?: { page?: number; limit?: number; search?: string; department?: string | string[]; stage?: string | string[]; jobId?: string | string[]; referredBy?: string }) => {
  return useQuery({
    queryKey: ["candidates", params],
    queryFn: () => getCandidates(params),
  });
};

export const useCreateCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidateData: any) => createCandidate(candidateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
};

import { updateCandidateStage } from "../services/api/candidates.service";

export const useUpdateCandidateStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => updateCandidateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
};

export const useCandidate = (id: string) => {
  return useQuery({
    queryKey: ["candidates", id],
    queryFn: () => getCandidateById(id),
    enabled: !!id,
  });
};

import { getCandidateTimeline } from "../services/api/candidates.service";

export const useCandidateTimeline = (id: string) => {
  return useQuery({
    queryKey: ["candidates", id, "timeline"],
    queryFn: () => getCandidateTimeline(id),
    enabled: !!id,
  });
};
