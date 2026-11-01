import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCandidateNotes, addCandidateNote } from "../services/api/notes.service";

export const useCandidateNotes = (candidateId: string) => {
  return useQuery({
    queryKey: ["notes", "candidate", candidateId],
    queryFn: () => getCandidateNotes(candidateId),
    enabled: !!candidateId,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCandidateNote,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", "candidate", variables.candidateId],
      });
    },
  });
};
