import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mailService } from "@/services/api/mail.service";

export const mailKeys = {
  all: ["mail"] as const,
  threads: (folder: string) => [...mailKeys.all, "threads", folder] as const,
  candidateThreads: (candidateId: string) => [...mailKeys.all, "candidate", candidateId, "threads"] as const,
  thread: (id: string) => [...mailKeys.all, "thread", id] as const,
  counts: () => [...mailKeys.all, "counts"] as const,
};

export function useThreads(folder: string) {
  return useQuery({
    queryKey: mailKeys.threads(folder),
    queryFn: () => mailService.getThreads(folder),
  });
}

export function useCandidateThreads(candidateId: string) {
  return useQuery({
    queryKey: mailKeys.candidateThreads(candidateId),
    queryFn: () => mailService.getCandidateThreads(candidateId),
    enabled: !!candidateId,
  });
}

export function useThread(id: string) {
  return useQuery({
    queryKey: mailKeys.thread(id),
    queryFn: () => mailService.getThreadById(id),
    enabled: !!id,
  });
}

export function useMailboxCounts() {
  return useQuery({
    queryKey: mailKeys.counts(),
    queryFn: () => mailService.getCounts(),
  });
}

export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, updates }: { threadId: string; updates: any }) =>
      mailService.updateThread(threadId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      to: string;
      cc?: string[];
      subject: string;
      body: string;
      candidateId?: string;
      threadId?: string;
      attachments?: any[];
    }) => mailService.sendEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}

export function useReplyToEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ emailId, data }: { emailId: string; data: any }) =>
      mailService.replyToEmail(emailId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => mailService.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}
