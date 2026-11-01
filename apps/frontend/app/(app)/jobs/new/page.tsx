import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { JobForm } from "@/components/job-form";
import { BackButton } from "@/components/back-button";

export default function CreateJobPage() {
  return (
    <Guard section="jobs">
      <div className="p-6 md:p-10">
        <BackButton fallback="/jobs" label="Back to Jobs" />
        <JobForm mode="create" />
      </div>
    </Guard>
  );
}
