import Link from "next/link";
import { Avatar } from "@/components/app-shell";
import { formatDistanceToNow } from "date-fns";

interface RecentApplicationsProps {
  applications: any[];
}

export function RecentApplications({ applications }: RecentApplicationsProps) {
  return (
    <div className="surface-card lg:col-span-2">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="text-[13px] font-semibold">Recent applications</div>
        <Link href="/candidates" className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
          See all
        </Link>
      </div>
      <div className="mt-3 divide-y divide-border">
        {applications.length === 0 && (
          <div className="px-5 py-4 text-[12px] text-muted-foreground">No recent applications found.</div>
        )}
        {applications.map((app) => {
          const c = app.candidate;
          const j = app.job;
          const name = `${c.firstName} ${c.lastName}`;
          return (
            <Link key={app.id} href={`/candidates/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40">
              <Avatar name={name} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{name}</div>
                <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  Applied to {j?.title || "Unknown Role"}
                </div>
              </div>
              <div className="hidden w-24 text-right text-[10.5px] text-muted-foreground md:block">
                {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
