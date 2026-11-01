"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import type { Job } from "@/services/api/jobs.service";
import { useAppStore } from "@/store/app.store";
import { jobSchema, type JobFormValues } from "@/lib/schemas/job.schema";
import { JobStatus, JobType } from "@/constants/enums";
import { useCreateJob, useUpdateJob } from "@/hooks/useJobs";

export function JobForm({ mode, job }: { mode: "create" | "edit"; job?: Job | any }) {
  const router = useRouter();
  const user = useAppStore((s) => s.user)();
  
  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();

  const { register, handleSubmit, watch, formState: { errors, isDirty, isValid } } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema) as any,
    mode: "onChange",
    defaultValues: {
      title:       job?.title ?? "",
      department:  job?.department ?? "",
      location:    job?.location ?? "",
      type:        job?.type ?? JobType.FULL_TIME,
      openings:    job?.openings ?? 1,
      deadline:    "2026-08-31",
      status:      job?.status ?? JobStatus.OPEN,
      description: job?.description ?? "",
      experience:  job?.experience ? parseInt(job.experience, 10) || undefined : undefined,
    },
  });

  const save = async (data: JobFormValues, isDraft?: boolean) => {
    const statusToSave = isDraft ? JobStatus.DRAFT : (data.status === JobStatus.DRAFT ? JobStatus.OPEN : data.status);

    if (mode === "create") {
      try {
        await createMutation.mutateAsync({
          title:          data.title,
          department:     data.department,
          location:       data.location,
          employmentType: data.type,
          status:         statusToSave,
          openings:       data.openings,
          experience:     data.experience !== undefined ? `${data.experience} years` : undefined,
          description:    data.description ?? "",
          applicationDeadline: data.deadline ? new Date(data.deadline).toISOString() : new Date().toISOString(),
        });
        toast.success(isDraft ? "Draft saved" : "Job published");
        router.back();
      } catch (err) {
        toast.error("Failed to create job");
      }
    } else {
      try {
        await updateMutation.mutateAsync({
          id: job!.id,
          data: {
            title:       data.title,
            department:  data.department,
            location:    data.location,
            employmentType: data.type,
            status:      statusToSave,
            openings:    data.openings,
            experience:  data.experience !== undefined ? `${data.experience} years` : undefined,
            description: data.description ?? "",
            applicationDeadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
          }
        });
        toast.success(isDraft ? "Draft updated" : "Job updated");
        router.back();
      } catch (err) {
        toast.error("Failed to update job");
      }
    }
  };

  return (
    <div className="mt-2 space-y-6">
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <div>
          <h2 className="text-lg font-semibold">{mode === "create" ? "Create a new job" : `Edit ${job?.title}`}</h2>
          <p className="text-[13px] text-muted-foreground">{mode === "create" ? "Publish immediately or save a draft." : "Update job details, status, and deadline."}</p>
        </div>

        <div className="space-y-8 border-t border-border pt-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Job title" error={errors.title?.message}>
                <input {...register("title")} className="input max-w-xl" placeholder="e.g. Senior Product Designer" />
              </Field>
            </div>
            <Field label="Department" error={errors.department?.message}>
              <input {...register("department")} className="input" placeholder="e.g. Design" />
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <input {...register("location")} className="input" placeholder="e.g. Remote" />
            </Field>
            <Field label="Employment type">
              <select {...register("type")} className="input">
                <option value={JobType.FULL_TIME}>Full-time</option>
                <option value={JobType.CONTRACT}>Contract</option>
                <option value={JobType.PART_TIME}>Part-time</option>
                <option value={JobType.INTERNSHIP}>Internship</option>
              </select>
            </Field>
            <Field label="Openings" error={errors.openings?.message}>
              <input {...register("openings")} type="number" min="1" className="input" />
            </Field>
            <Field label="Years of Experience" error={errors.experience?.message}>
              <input {...register("experience")} type="number" min="0" placeholder="e.g. 3" className="input" />
            </Field>
            <Field label="Application deadline">
              <div className="relative">
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input {...register("deadline")} type="date" className="input pr-8" />
              </div>
            </Field>
            <Field label="Job status">
              <select {...register("status")} className="input">
                <option value={JobStatus.OPEN}>Open — Accepting applications</option>
                <option value={JobStatus.ON_HOLD}>On Hold — Paused</option>
                <option value={JobStatus.CLOSED}>Closed — Disabled</option>
                <option value={JobStatus.DRAFT}>Draft</option>
              </select>
            </Field>
          </div>

          <div className="border-t border-border pt-8">
            <div className="max-w-4xl">
              <Field label="Description">
                <textarea
                  {...register("description")}
                  rows={8}
                  className="w-full rounded-lg border border-border bg-surface p-3 text-[13px] outline-none focus:border-ring"
                  placeholder="Describe the role, responsibilities, and requirements..."
                />
              </Field>
              {mode === "edit" && (
                <div className="mt-4 rounded-lg border border-dashed border-border bg-surface-2 p-3 text-[11.5px] text-muted-foreground">
                  Jobs are automatically <span className="font-medium text-foreground">Closed</span> when the application deadline passes.
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <button onClick={() => router.back()} className="h-9 rounded-lg border border-border bg-surface px-4 text-[13px] font-medium hover:bg-secondary">Cancel</button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSubmit((data) => save(data as JobFormValues, true))()}
            disabled={!isValid}
            className="h-9 rounded-lg border border-border bg-surface px-4 text-[13px] font-medium hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === "create" ? "Save as Draft" : "Update Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit((data) => save(data as JobFormValues, false))()}
            disabled={!isValid}
            className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === "create" ? "Publish" : "Save changes"}
          </button>
        </div>
      </div>

    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">{label}</span>
      {children}
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </label>
  );
}
