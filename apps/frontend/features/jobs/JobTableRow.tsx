"use client";

import Link from "next/link";
import { MapPin, Users, Briefcase, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EMPLOYMENT_LABELS } from "@/lib/careers";
import { useRouter } from "next/navigation";
import type { Job } from "@/services/api/jobs.service";
import { JobStatus, Role } from "@/constants/enums";
import { getJobStatusLabel } from "@/lib/utils/formatters";

interface JobTableRowProps {
  job: Job;
  role: Role;
  onDelete: (job: Job) => void;
}

const STATUS_CLASS: Record<JobStatus, string> = {
  [JobStatus.OPEN]:     "tone-soft [--tone:var(--color-success)]",
  [JobStatus.DRAFT]:    "bg-secondary text-muted-foreground",
  [JobStatus.ON_HOLD]: "tone-soft [--tone:var(--color-warning)]",
  [JobStatus.CLOSED]:   "tone-soft [--tone:var(--color-destructive)]",
};

function StatusPill({ status }: { status: Job["status"] }) {
  return (
    <span className={"inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium " + STATUS_CLASS[status as JobStatus]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {getJobStatusLabel(status as JobStatus)}
    </span>
  );
}

export function JobTableRow({ job: j, role, onDelete }: JobTableRowProps) {
  const router = useRouter();

  return (
    <tr className="group cursor-pointer transition-colors hover:bg-secondary/40" onClick={() => router.push(`/jobs/${j.id}`)}>
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/jobs/${j.id}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate text-[13.5px] font-medium text-foreground hover:underline group-hover:text-primary"
          >
            {j.title}
          </Link>
          <StatusPill status={j.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
          {j.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden="true" /> {j.location}
            </span>
          )}
          <span>{EMPLOYMENT_LABELS[j.employmentType] ?? j.employmentType}</span>
          <span className="inline-flex items-center gap-1 lg:hidden">
            <Users className="size-3" aria-hidden="true" /> {j._count?.applications ?? 0}
          </span>
        </div>
      </td>

      {role === Role.ADMINISTRATOR && (
        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="size-3.5" aria-hidden="true" /> {j.department}
          </span>
        </td>
      )}
      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
        {j.createdBy ? `${j.createdBy.firstName} ${j.createdBy.lastName}` : "–"}
      </td>
      <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground lg:table-cell">{j.numOpenings}</td>
      <td className="hidden px-4 py-3 text-right tabular-nums lg:table-cell">{j._count?.applications ?? 0}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-[12.5px] text-muted-foreground">
        {new Date(j.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </td>
      <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        {[Role.ADMINISTRATOR, Role.HIRING_MANAGER].includes(role) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Actions for ${j.title}`}>
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href={`/jobs/${j.id}`}>Open</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={`/jobs/${j.id}/edit`}>Edit</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(j)}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}
