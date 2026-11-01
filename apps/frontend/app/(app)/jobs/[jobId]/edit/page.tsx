"use client";

import { use } from "react";
import { Guard } from "@/components/access-restricted";
import { JobForm } from "@/components/job-form";
import { BackButton } from "@/components/back-button";
import { notFound } from "next/navigation";
import { useJob } from "@/hooks/useJobs";
import { Skeleton } from "@/components/skeletons";

export default function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const { data, isLoading } = useJob(jobId);
  const job = data?.data;
  
  if (isLoading) return <div className="p-8"><Skeleton.JobDetail /></div>;
  if (!job) notFound();

  return (
    <Guard section="jobs">
      <div className="p-6 md:p-10">
        <BackButton fallback={`/jobs/${jobId}`} label="Back to Job" />
        <JobForm mode="edit" job={job} />
      </div>
    </Guard>
  );
}
