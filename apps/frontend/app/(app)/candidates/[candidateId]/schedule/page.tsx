"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { Guard } from "@/components/access-restricted";
import { BackButton } from "@/components/back-button";
import { toast } from "sonner";
import { notFound } from "next/navigation";
import { useCandidate } from "@/hooks/useCandidates";
import { useCreateInterview } from "@/hooks/useInterviews";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/skeletons";

const schema = z.object({
  type: z.enum(["SCREENING", "TECHNICAL", "HR", "MANAGERIAL", "FINAL"]),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  interviewerId: z.string().uuid("Interviewer is required"),
  location: z.string().min(1, "Location is required"),
});

type FormValues = z.infer<typeof schema>;

export default function ScheduleInterviewPage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = use(params);
  const { data: candidateRes, isLoading } = useCandidate(candidateId);
  const candidate = candidateRes?.data;
  const { mutate: createInterview, isPending } = useCreateInterview();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "SCREENING",
      location: "Google Meet",
    }
  });

  if (isLoading) {
    return (
      <Guard section="candidates">
        <div className="p-6 md:p-10 mx-auto max-w-2xl">
          <Skeleton.Card count={2} />
        </div>
      </Guard>
    );
  }

  if (!candidate) notFound();

  const application = candidate.applications?.[0];
  const job = application?.job;

  const rawTeam = job ? [
    job.recruiter,
    job.hiringManager,
    job.createdBy,
    ...(job.hiringTeamMembers || [])
  ].filter(Boolean) : [];

  const uniqueTeam = Array.from(new Map(rawTeam.map(item => [item.id, item])).values());

  const onSubmit = (data: FormValues) => {
    if (!application) return;
    
    // Convert date + time to ISO string
    const scheduledAt = new Date(`${data.date}T${data.time}`).toISOString();

    createInterview({
      applicationId: application.id,
      type: data.type,
      scheduledAt,
      durationMins: 60, // default
      location: data.location,
      interviewerIds: [data.interviewerId]
    }, {
      onSuccess: () => {
        toast.success("Interview scheduled successfully");
        router.push(`/candidates/${candidateId}`);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to schedule interview");
      }
    });
  };

  return (
    <Guard section="candidates">
      <div className="p-6 md:p-10 mx-auto max-w-2xl">
        <BackButton fallback={`/candidates/${candidateId}`} label="Back to Candidate" />
        
        <div className="surface-card p-6 mt-6">
          <h2 className="text-[15px] font-semibold">Schedule interview</h2>
          <p className="mb-6 text-[13px] text-muted-foreground">{candidate.firstName} {candidate.lastName} · {job?.title}</p>

          <form id="schedule-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Interview type" error={errors.type?.message}>
              <select {...register("type")} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-ring">
                <option value="SCREENING">Screening</option>
                <option value="TECHNICAL">Technical</option>
                <option value="HR">HR</option>
                <option value="MANAGERIAL">Managerial</option>
                <option value="FINAL">Final</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date" error={errors.date?.message}>
                <input type="date" {...register("date")} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-ring" />
              </Field>
              <Field label="Time" error={errors.time?.message}>
                <input type="time" {...register("time")} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-ring" />
              </Field>
            </div>
            <Field label="Interviewer" error={errors.interviewerId?.message}>
              <select {...register("interviewerId")} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-ring">
                <option value="">Select interviewer...</option>
                {uniqueTeam.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <select {...register("location")} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-ring">
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="On-site">On-site</option>
              </select>
            </Field>
          </form>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} disabled={isPending} className="h-9 rounded-lg border border-border bg-surface px-4 text-[13px] font-medium hover:bg-secondary disabled:opacity-50">Cancel</button>
          <button type="submit" form="schedule-form" disabled={isPending} className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {isPending ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </div>
    </Guard>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <div className="flex justify-between items-center mb-1.5">
        <span className="block text-[12px] font-medium text-muted-foreground">{label}</span>
        {error && <span className="text-[11px] text-destructive">{error}</span>}
      </div>
      {children}
    </label>
  );
}
