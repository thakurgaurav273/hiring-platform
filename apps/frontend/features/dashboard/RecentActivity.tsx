import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  events: any[];
  linkTo?: string;
  linkLabel?: string;
  dotColor?: string;
}

export function RecentActivity({
  events,
  linkTo = "/timeline",
  linkLabel = "Full timeline",
  dotColor = "bg-accent",
}: RecentActivityProps) {
  return (
    <div className="surface-card lg:col-span-2">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="text-[13px] font-semibold">Recent activity</div>
        <Link href={linkTo} className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
          {linkLabel}
        </Link>
      </div>
      <div className="mt-3 divide-y divide-border">
        {events?.length === 0 && (
          <div className="px-5 py-4 text-[12px] text-muted-foreground">No recent activity.</div>
        )}
        {events?.map((e) => (
          <div key={e.id} className="flex items-start gap-3 px-5 py-3">
            <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium">{e.action}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{e.details}</div>
            </div>
            <span className="shrink-0 text-[10.5px] text-muted-foreground">
              {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
