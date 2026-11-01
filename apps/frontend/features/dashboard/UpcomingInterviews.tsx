import Link from "next/link";
import { Avatar } from "@/components/app-shell";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface UpcomingInterviewsProps {
  interviews: any[];
}

export function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  return (
    <div className="surface-card">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="text-[13px] font-semibold">Upcoming interviews</div>
        <Link href="/interviews" className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
          Calendar
        </Link>
      </div>
      <div className="mt-3 divide-y divide-border">
        {interviews.length === 0 && (
          <div className="px-5 py-4 text-[12px] text-muted-foreground">No upcoming interviews.</div>
        )}
        {interviews.map((i) => {
          const c = i.candidate;
          if (!c) return null;
          const name = `${c.firstName} ${c.lastName}`;
          return (
            <Link key={i.id} href={`/candidates/${c.id}`} className="block px-5 py-3 hover:bg-secondary/40">
              <div className="flex items-center gap-2">
                <Avatar name={name} size={26} />
                <div className="min-w-0 flex-1 text-[12.5px] font-medium truncate">{name}</div>
                <span className="text-[10.5px] text-muted-foreground">{i.type || "Interview"}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 pl-8 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(i.scheduledAt), "MMM d · h:mm a")} · {i.duration}m · {i.location || "Remote"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
