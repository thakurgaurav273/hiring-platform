import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as interviewsService from "@/services/api/interviews.service";

export const useInterviews = (params?: { page?: number; limit?: number; status?: string; orderBy?: "asc" | "desc" }) => {
    return useQuery({
        queryKey: ["interviews", params],
        queryFn: () => interviewsService.getInterviews(params),
    });
};

export const useInterview = (id: string) => {
    return useQuery({
        queryKey: ["interviews", id],
        queryFn: () => interviewsService.getInterviewById(id),
        enabled: !!id,
    });
};

export const useCreateInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: interviewsService.createInterview,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["interviews"] });
            // also invalidate candidate to get updated applications.interviews
            queryClient.invalidateQueries({ queryKey: ["candidates"] });
        },
    });
};

export const useUpdateInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof interviewsService.updateInterview>[1] }) =>
            interviewsService.updateInterview(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["interviews"] });
            queryClient.invalidateQueries({ queryKey: ["interviews", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["candidates"] });
        },
    });
};
