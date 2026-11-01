"use client";

import Link from "next/link";
import { MapPin, Users, Briefcase, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
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
    <span className={"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium " + STATUS_CLASS[status as JobStatus]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {getJobStatusLabel(status as JobStatus)}
    </span>
  );
}

export function JobTableRow({ job: j, role, onDelete }: JobTableRowProps) {
  const router = useRouter();

  return (
    <tr
      className="group transition hover:bg-secondary/40 cursor-pointer"
      onClick={() => router.push(`/jobs/${j.id}`)}
    >
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <StatusPill status={j.status} />
          </div>
          <Link
            href={`/jobs/${j.id}`}
            className="block font-medium text-[14.5px] text-foreground hover:underline group-hover:text-primary"
          >
            {j.title}
          </Link>
          <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.location}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {j._count?.applications || 0} applicants</span>
          </div>
        </div>
      </td>

      {role === Role.ADMINISTRATOR && (
        <td className="px-5 py-4 hidden sm:table-cell text-muted-foreground">
          <div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {j.department}</div>
        </td>
      )}

      <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">{j.createdBy ? `${j.createdBy.firstName} ${j.createdBy.lastName}` : "Unknown"}</td>
      <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground">{j.numOpenings}</td>
      <td className="px-5 py-4 text-right text-muted-foreground whitespace-nowrap text-[12px]">
        {new Date(j.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </td>
      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        {[Role.ADMINISTRATOR, Role.HIRING_MANAGER].includes(role) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href={`/jobs/${j.id}/edit`}>Edit</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Job duplicated")}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Archived")}>Archive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(j)}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}
