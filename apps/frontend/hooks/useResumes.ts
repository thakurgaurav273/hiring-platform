import { useQuery } from "@tanstack/react-query";
import { getResumesByCandidateId } from "../services/api/resumes.service";

export const useCandidateResumes = (candidateId: string) => {
  return useQuery({
    queryKey: ["resumes", "candidate", candidateId],
    queryFn: () => getResumesByCandidateId(candidateId),
    enabled: !!candidateId,
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadResume } from "../services/api/resumes.service";

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, file }: { candidateId: string; file: File }) =>
      uploadResume(candidateId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["resumes", "candidate", variables.candidateId],
      });
    },
  });
};
