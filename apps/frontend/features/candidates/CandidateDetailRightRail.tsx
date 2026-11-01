"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import type { Candidate, Job } from "@/lib/types";
import { ApplicationSourceCard } from "@/features/candidates/ApplicationDetails";

export function CandidateDetailRightRail({
  live,
  job,
}: {
  live: any;
  job: Job | undefined;
}) {
  return (
    <aside className="space-y-4">
      {/* Contact */}
      <div className="surface-card p-5">
        <div className="text-[13px] font-semibold">Contact</div>
        <div className="mt-3 space-y-2 text-[12.5px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <a href={`mailto:${live.email}`} className="truncate hover:text-foreground">
              {live.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {live.phone}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {live.location}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="surface-card p-5">
        <div className="text-[13px] font-semibold">Details</div>
        <div className="mt-3 space-y-2.5 text-[12px]">
          <Row l="Applied to">
            <Link href={`/jobs/${live.jobId}`} className="hover:underline">
              {job?.title}
            </Link>
          </Row>
          <Row l="Referred By">{live.referredBy || live.recruiter}</Row>

          <Row l="Applied">{live.appliedAt}</Row>
        </div>
      </div>

      <ApplicationSourceCard applications={Array.isArray(live.applications) ? live.applications : []} />

    </aside>
  );
}

function Row({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{l}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  );
}
