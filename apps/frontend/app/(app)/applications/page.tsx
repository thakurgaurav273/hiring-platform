"use client";

import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { Guard } from "@/components/access-restricted";
import { jobById } from "@/lib/mock-data";
import { Briefcase, MapPin, ArrowRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { APPLICATION_STATUS_STYLES } from "@/constants/stages.constants";



export default function ApplicationsPage() {
  return (
    <Guard section="applications">
      <ApplicationsInner />
    </Guard>
  );
}

function ApplicationsInner() {
  const applications = useAppStore((s) => s.applications);
  const router = useRouter();

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Careers" }, { label: "My Applications" }]}
        title="My applications"
        description={`${applications.length} applications submitted`}
        actions={
          <button onClick={() => router.push("/search")} className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90">
            Browse jobs <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        {applications.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-border p-14 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-[14px] font-medium">No applications yet</div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">Browse open roles to submit your first application.</div>
            <button onClick={() => router.push("/search")} className="mt-4 h-9 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground">Browse jobs</button>
          </div>
        ) : (
          <div className="surface-card divide-y divide-border">
            {applications.map((a) => {
              const job = jobById(a.jobId);
              if (!job) return null;
              return (
                <div key={a.id} className="flex items-center gap-4 p-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[14px]">{job.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.department}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                      <span>Applied {a.appliedAt}</span>
                    </div>
                  </div>
                  <span className={"rounded-full px-2.5 py-1 text-[11px] font-medium " + APPLICATION_STATUS_STYLES[a.status]}>{a.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
