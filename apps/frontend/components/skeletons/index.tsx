/**
 * Skeleton compound component.
 *
 * Usage:
 *   <Skeleton.Row count={4} />
 *   <Skeleton.Card count={3} />
 *   <Skeleton.Avatar count={5} />
 *   <Skeleton.CandidateDetail />
 *   <Skeleton.PipelineColumn count={6} />
 *   <Skeleton.MailRow count={6} />
 *   <Skeleton.InterviewRow count={4} />
 *   <Skeleton.Table count={5} role={role} />
 *   <Skeleton.KpiCard count={8} />
 *   <Skeleton.ReportsKpi count={4} />
 *   <Skeleton.JobDetail />
 *   <Skeleton.ProfilePage />
 */

import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import { JobDetail, ProfilePage } from "./views";

// ---------------------------------------------------------------------------
// Row — a simple labeled row with a trailing badge (candidates list)
// ---------------------------------------------------------------------------
function Row({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-4 items-center p-4 md:p-5">
          <div className="flex items-center gap-3">
            <ShadcnSkeleton className="h-8 w-8 rounded-full" />
            <ShadcnSkeleton className="h-4 w-24" />
          </div>
          <div><ShadcnSkeleton className="h-4 w-32" /></div>
          <div><ShadcnSkeleton className="h-4 w-24" /></div>
          <div><ShadcnSkeleton className="h-4 w-24" /></div>
          <div><ShadcnSkeleton className="h-4 w-20" /></div>
          <div className="lg:justify-self-end"><ShadcnSkeleton className="h-6 w-24 rounded-full" /></div>
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Card — a surface card with a title + 3 description lines
// ---------------------------------------------------------------------------
function Card({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card p-5 space-y-3">
          <ShadcnSkeleton className="h-4 w-28" />
          <ShadcnSkeleton className="h-3 w-full" />
          <ShadcnSkeleton className="h-3 w-5/6" />
          <ShadcnSkeleton className="h-3 w-4/6" />
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Avatar — a circular avatar + name + subtitle row
// ---------------------------------------------------------------------------
function Avatar({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <ShadcnSkeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <ShadcnSkeleton className="h-3 w-1/2" />
            <ShadcnSkeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// InterviewRow — used in the interviews page upcoming/completed lists
// ---------------------------------------------------------------------------
function InterviewRow({ count = 4, variant = "upcoming" }: { count?: number; variant?: "upcoming" | "completed" }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          {variant === "upcoming" ? (
            <ShadcnSkeleton className="h-11 w-11 rounded-lg shrink-0" />
          ) : (
            <ShadcnSkeleton className="h-8 w-8 rounded-full shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <ShadcnSkeleton className="h-3 w-1/2" />
            <ShadcnSkeleton className="h-3 w-1/3" />
          </div>
          {variant === "upcoming" ? (
            <ShadcnSkeleton className="h-3 w-10" />
          ) : (
            <ShadcnSkeleton className="h-5 w-16 rounded-full" />
          )}
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// MailRow — used in the mail thread list
// ---------------------------------------------------------------------------
function MailRow({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-2 border-b border-border px-3 py-3">
          <ShadcnSkeleton className="h-5 w-5 rounded mt-0.5 shrink-0" />
          <ShadcnSkeleton className="h-7 w-7 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <ShadcnSkeleton className="h-3 w-3/4" />
            <ShadcnSkeleton className="h-3 w-1/2" />
            <ShadcnSkeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// PipelineColumn — used in the pipeline page loading state
// ---------------------------------------------------------------------------
function PipelineColumn({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex w-[220px] shrink-0 flex-col gap-2">
          <ShadcnSkeleton className="h-4 w-24 mb-2" />
          {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((__, j) => (
            <div key={j} className="surface-card p-3 space-y-2">
              <ShadcnSkeleton className="h-3 w-3/4" />
              <ShadcnSkeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// CandidateDetail — used in the candidate detail page
// ---------------------------------------------------------------------------
function CandidateDetail() {
  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-2">
          <ShadcnSkeleton className="h-6 w-24 rounded-full" />
          <ShadcnSkeleton className="h-4 w-32 self-center" />
        </div>
        <div className="surface-card p-5 space-y-3">
          <ShadcnSkeleton className="h-4 w-28" />
          <ShadcnSkeleton className="h-3 w-full" />
          <ShadcnSkeleton className="h-3 w-5/6" />
          <ShadcnSkeleton className="h-3 w-4/6" />
        </div>
        <div className="surface-card p-5 space-y-3">
          <ShadcnSkeleton className="h-4 w-24" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <div className="flex-1 space-y-2">
                <ShadcnSkeleton className="h-3 w-36" />
                <ShadcnSkeleton className="h-3 w-full" />
              </div>
              <ShadcnSkeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="surface-card p-5 space-y-3">
          <ShadcnSkeleton className="h-4 w-20" />
          <ShadcnSkeleton className="h-3 w-full" />
          <ShadcnSkeleton className="h-3 w-4/5" />
          <ShadcnSkeleton className="h-3 w-3/5" />
        </div>
        <div className="surface-card p-5 space-y-3">
          <ShadcnSkeleton className="h-4 w-16" />
          <ShadcnSkeleton className="h-3 w-full" />
          <ShadcnSkeleton className="h-3 w-4/5" />
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Table — used in lists with rows and columns (e.g., jobs list)
// ---------------------------------------------------------------------------
function Table({ count = 5, role }: { count?: number; role?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3">
            <ShadcnSkeleton className="h-4 w-48" />
            <ShadcnSkeleton className="mt-2 h-3 w-32" />
          </td>
          {role === "administrator" && <td className="hidden px-4 py-3 sm:table-cell"><ShadcnSkeleton className="h-4 w-24" /></td>}
          <td className="hidden px-4 py-3 md:table-cell"><ShadcnSkeleton className="h-4 w-24" /></td>
          <td className="hidden px-4 py-3 lg:table-cell"><ShadcnSkeleton className="ml-auto h-4 w-8" /></td>
          <td className="hidden px-4 py-3 lg:table-cell"><ShadcnSkeleton className="ml-auto h-4 w-8" /></td>
          <td className="px-4 py-3"><ShadcnSkeleton className="ml-auto h-4 w-12" /></td>
          <td className="px-2 py-3"><ShadcnSkeleton className="ml-auto size-6" /></td>
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// KpiCard — used in the dashboard KPI grid (value + label)
// ---------------------------------------------------------------------------
function KpiCard({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card flex flex-col p-4 gap-3">
          <ShadcnSkeleton className="h-8 w-16" />
          <ShadcnSkeleton className="h-3 w-24" />
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// ReportsKpi — used in the reports page metric cards (label + big value + trend)
// ---------------------------------------------------------------------------
function ReportsKpi({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card p-5 space-y-3">
          <ShadcnSkeleton className="h-3 w-28" />
          <ShadcnSkeleton className="h-7 w-16" />
          <ShadcnSkeleton className="h-3 w-20" />
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Compound export — extends ShadcnSkeleton so <Skeleton className="..." /> still works
// ---------------------------------------------------------------------------
export const Skeleton = Object.assign(ShadcnSkeleton, {
  Row,
  Card,
  Avatar,
  InterviewRow,
  MailRow,
  PipelineColumn,
  CandidateDetail,
  Table,
  KpiCard,
  ReportsKpi,
  JobDetail,
  ProfilePage,
});
