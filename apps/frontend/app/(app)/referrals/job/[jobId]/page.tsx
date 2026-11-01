"use client";
import { useTheme } from "@/components/theme-provider";

import React from "react";
import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { BackButton } from "@/components/back-button";
import { Building2, Briefcase, MapPin, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { useJob } from "@/hooks/useJobs";
import { JobStatus } from "@/constants/enums";

export default function SearchJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { brand } = useTheme();
  const resolvedParams = React.use(params);
  const jobId = resolvedParams.jobId;
  const { data: jobResponse, isLoading, error } = useJob(jobId);

  const isServer = typeof window === "undefined";

  if (isLoading || isServer) {
    return (
      <Guard section="referrals">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 text-center text-muted-foreground text-[14px]">
          Loading job details...
        </div>
      </Guard>
    );
  }

  if (error || !jobResponse?.data) {
    return notFound();
  }

  const job = jobResponse.data;

  return (
    <Guard section="referrals">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <BackButton fallback="/referrals" label="Back to Referrals" />

        <div className="mt-8">
          <div className="mb-10 border-b border-border pb-8">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> Actively hiring
            </div>
            <h1 className="font-display text-[32px] md:text-[40px] font-semibold leading-tight text-foreground">{job.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Building2 className="h-4.5 w-4.5" /> {brand.name}</span>
              <span className="inline-flex items-center gap-2"><Briefcase className="h-4.5 w-4.5" /> {job.department}</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-4.5 w-4.5" /> {job.location}</span>
              <span className="inline-flex items-center gap-2"><Clock className="h-4.5 w-4.5" /> {job.employmentType}</span>
            </div>
          </div>

          <div className="space-y-12">
            <section>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Experience Required</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground">{job.experience || "Not Specified"}</p>
            </section>
            <section>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">About the role</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground">{job.description}</p>
            </section>
          </div>

          <div className="mt-12 flex items-center justify-start gap-4 pt-8 border-t border-border">
            <Link href={`/referrals/new?jobId=${jobId}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Add Referral
            </Link>
          </div>
        </div>
      </div>
    </Guard>
  );
}
