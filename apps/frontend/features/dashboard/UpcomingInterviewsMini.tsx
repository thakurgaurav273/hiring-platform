import { INTERVIEWS } from "@/lib/mock-data";
import { Calendar } from "lucide-react";
import type { Interview } from "@/lib/types";
import { InterviewStatus } from "@/constants/enums";

export function UpcomingInterviewsMini() {
  const upcoming = INTERVIEWS.filter((i: Interview) => i.status === InterviewStatus.SCHEDULED).slice(0, 3);

  return (
    <div className="surface-card">
      <div className="px-5 pt-5">
        <div className="text-[13px] font-semibold">Upcoming interviews</div>
      </div>
      <div className="mt-3 divide-y divide-border">
        {upcoming.length === 0 && (
          <div className="px-5 py-6 text-[12px] text-muted-foreground">No interviews scheduled yet.</div>
        )}
        {upcoming.map((i) => (
          <div key={i.id} className="px-5 py-3">
            <div className="flex items-center gap-2 text-[12.5px] font-medium">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {i.type} interview
            </div>
            <div className="mt-0.5 pl-5 text-[11px] text-muted-foreground">
              Jul {i.date.slice(-2)} · {i.time} · {i.duration}m · {i.location}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
