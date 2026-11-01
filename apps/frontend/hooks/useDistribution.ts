import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDistribution,
  setPublication,
  type PublicationAction,
  type PublicationChannel,
} from "@/services/api/distribution.service";

export const distributionKeys = {
  job: (jobId: string) => ["distribution", jobId] as const,
};

export const useDistribution = (jobId: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: distributionKeys.job(jobId),
    queryFn: () => getDistribution(jobId),
    enabled: (options?.enabled ?? true) && !!jobId,
  });

export const useSetPublication = (jobId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channel, action }: { channel: PublicationChannel; action: PublicationAction }) =>
      setPublication(jobId, channel, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.job(jobId) });
    },
  });
};
