"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Guard } from "@/components/access-restricted";
import { BackButton } from "@/components/back-button";
import { useAppStore } from "@/store/app.store";
import { Upload, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { referralSchema, type ReferralFormValues } from "@/lib/schemas/referral.schema";
import { JobStatus, CandidateStage, PriorityLevel } from "@/constants/enums";
import { useJobs } from "@/hooks/useJobs";
import { useCreateCandidate } from "@/hooks/useCandidates";
import axios from "axios";

export default function ReferralFormPage({ searchParams }: { searchParams: Promise<{ jobId?: string }> }) {
  const resolvedParams = use(searchParams);
  const initialJobId = resolvedParams.jobId;

  const { data: jobsData } = useJobs({ status: JobStatus.OPEN, isReferral: true });
  const openJobs = jobsData?.data.jobs || [];

  const user = useAppStore((s) => s.authUser);
  const { mutateAsync: createCandidate, isPending } = useCreateCandidate();
  const router = useRouter();

  const [step, setStep] = useState<"form" | "success">("form");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting, isValid }, setValue } = useForm<ReferralFormValues>({
    resolver: zodResolver(referralSchema) as any,
    mode: "onChange",
    defaultValues: {
      jobId: initialJobId || "",
      experience: "",
    },
  });

  useEffect(() => {
    if (!initialJobId && openJobs.length > 0 && !watch("jobId")) {
      setValue("jobId", openJobs[0].id);
    }
  }, [openJobs, initialJobId, watch, setValue]);

  const selectedJobId = watch("jobId");
  const selectedJob = openJobs.find(j => j.id === selectedJobId);

  const onSubmit: SubmitHandler<ReferralFormValues> = async (data) => {
    const [firstName, ...lastNameParts] = data.name.split(" ");
    const lastName = lastNameParts.join(" ") || firstName;

    try {
      const payload: any = {
        firstName,
        lastName,
        email: data.email,
        phone: data.phone ?? "",
        location: data.address ?? "",
        experience: data.experience,
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        jobId: data.jobId,
        education: data.education,
        portfolio: data.portfolio,
        summary: data.summary,
        referredBy: user?.id,
        whySuggest: data.whySuggest,
      };

      let requestData = payload;

      if (resumeFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value) || typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        formData.append("resume", resumeFile);
        requestData = formData;
      }

      const response = await createCandidate(requestData);

      setStep("success");
      toast.success("Referral submitted successfully");
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("This candidate has already been referred for this role.");
      } else {
        toast.error("Failed to submit referral. Please try again.");
      }
    }
  };

  return (
    <Guard section="referrals">
      <div>
        {/* Page header */}
        <div className="border-b border-border bg-background px-4 pt-6 pb-6 md:px-8">
          <BackButton fallback="/referrals" label="Back to Referrals" />
          <div className="mt-5">
            <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight">
              {step === "form" ? "Add Referral" : "Referral Submitted"}
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              {step === "form"
                ? "Refer someone from your network. They will be added directly to the candidate pipeline."
                : `Thanks for referring this candidate to ${selectedJob?.title || "the role"}.`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
          {step === "form" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* Candidate Details */}
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Candidate Details</h3>
                <div className="mt-5 space-y-4">
                  {!initialJobId && (
                    <Field label="Target Job" error={errors.jobId?.message}>
                      <select {...register("jobId")} className="input" required>
                        {openJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                      </select>
                    </Field>
                  )}
                  {initialJobId && selectedJob && (
                    <div className="text-[13px]">
                      Targeting: <span className="font-medium">{selectedJob.title}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Full name" error={errors.name?.message}>
                      <input {...register("name")} className="input" placeholder="e.g. Jane Doe" />
                    </Field>
                    <Field label="Email" error={errors.email?.message}>
                      <input {...register("email")} type="email" className="input" placeholder="jane@example.com" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Phone number">
                      <input {...register("phone")} type="tel" className="input" placeholder="+1 (555) 000-0000" />
                    </Field>
                    <Field label="Address / Location">
                      <input {...register("address")} placeholder="City, Country" className="input" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Skills (comma separated)" error={errors.skills?.message}>
                      <input {...register("skills")} placeholder="React, Node.js, Leadership" className="input" />
                    </Field>
                    <Field label="Education" error={errors.education?.message}>
                      <input {...register("education")} placeholder="University, Degree" className="input" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Portfolio / Website Link" error={errors.portfolio?.message}>
                      <input {...register("portfolio")} type="url" placeholder="https://" className="input" />
                    </Field>
                  </div>
                </div>
              </section>

              {/* Experience */}
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Professional Experience</h3>
                <div className="mt-5">
                  <textarea {...register("experience")} rows={5} placeholder="Paste the candidate's work experience here..." className="w-full rounded-lg border border-border bg-surface p-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                </div>
              </section>

              {/* Resume */}
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Resume <span className="text-destructive">*</span></h3>
                <div className="mt-5">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface-2 p-4 hover:bg-secondary transition-colors">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-accent/12 text-accent"><Upload className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{resumeFile?.name ?? "Upload resume"}</div>
                      <div className="text-[11.5px] text-muted-foreground">PDF or DOCX up to 10 MB</div>
                    </div>
                    <input 
                      type="file" 
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                          const validExtensions = ['.pdf', '.docx'];
                          const hasValidType = validTypes.includes(file.type);
                          const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                          
                          if (hasValidType || hasValidExtension) {
                            setResumeFile(file);
                          } else {
                            toast.error("Invalid file format. Please upload a PDF or DOCX file.");
                            setResumeFile(null);
                            e.target.value = '';
                          }
                        } else {
                          setResumeFile(null);
                        }
                      }} 
                    />
                  </label>
                </div>
              </section>

              {/* Summary */}
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Professional Summary</h3>
                <div className="mt-5">
                  <textarea {...register("summary")} rows={3} placeholder="A short bio or summary of the candidate's career..." className="w-full rounded-lg border border-border bg-surface p-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Why do you suggest them?</h3>
                <div className="mt-5">
                  <textarea {...register("whySuggest")} rows={4} placeholder="Tell us why you are recommending this candidate." className="w-full rounded-lg border border-border bg-surface p-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                </div>
              </section>

              <div className="flex justify-end gap-3 border-t border-border pt-6">
                <button type="button" onClick={() => router.back()} disabled={isPending || isSubmitting} className="h-9 rounded-lg border border-border bg-surface px-4 text-[13px] font-medium hover:bg-secondary disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isPending || isSubmitting || !isValid || !resumeFile} className="h-9 rounded-lg bg-primary px-5 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isPending || isSubmitting ? "Submitting..." : "Submit referral"}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full tone-soft [--tone:var(--color-success)]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-5 font-display text-[22px] font-semibold tracking-tight">Referral submitted</h2>
              <p className="mt-2 text-[14px] text-muted-foreground">
                Thanks for referring this candidate! They have been referred for <span className="font-medium text-foreground">{selectedJob?.title || "the role"}</span>.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <button onClick={() => { setStep("form"); setResumeFile(null); reset(); }} className="h-10 rounded-lg border border-border bg-surface px-5 text-[14px] font-medium hover:bg-secondary">Submit another</button>
                <button onClick={() => router.push("/referrals")} className="h-10 rounded-lg bg-primary px-5 text-[14px] font-medium text-primary-foreground hover:opacity-90">Back to Referrals</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Guard>
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
