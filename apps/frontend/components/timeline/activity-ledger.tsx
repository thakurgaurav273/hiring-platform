"use client";

import { Avatar } from "@/components/app-shell";
import { ACTIVITY_ICONS } from "@/constants/timeline.constants";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  type: string;
  actorId?: string;
  actor?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  entityType: string;
  entityId: string;
  description: string;
  department?: string;
  createdAt: string;
}

interface ActivityLedgerProps {
  activities: ActivityLog[];
}

export function ActivityLedger({ activities }: ActivityLedgerProps) {
  if (activities.length === 0) {
    return (
      <div className="w-full py-12 text-center">
        <h3 className="text-[15px] font-semibold text-foreground">No activity yet today.</h3>
        <p className="text-[13px] text-muted-foreground mt-1">Activities will appear here as hiring actions occur.</p>
      </div>
    );
  }

  return (
    <div className="w-full pt-4">
      <div className="mb-8">
        <h2 className="text-[16px] font-semibold tracking-tight text-foreground">Today's Activity</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">Live events for the current UTC day</p>
      </div>

      <div className="relative pl-4 sm:pl-6">
        {/* Vertical Connector Line */}
        <div className="absolute left-[16px] sm:left-[24px] top-4 bottom-4 w-px bg-border/60" />

        <div className="space-y-6">
          {activities.map((e, index) => {
            const Icon = ACTIVITY_ICONS[e.type as keyof typeof ACTIVITY_ICONS];
            const actorName = e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : "System";
            const relativeTime = formatDistanceToNow(new Date(e.createdAt), { addSuffix: true });
            
            return (
              <div key={e.id} className="relative flex items-start gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: `${index * 50}ms` }}>
                {/* Role Avatar overlaid on connector */}
                <div className="relative z-10 -ml-[14px] sm:-ml-[16px]">
                   <span className="block p-1 bg-surface rounded-full">
                     <Avatar name={actorName} seed={actorName} size={28} />
                   </span>
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
                    <div className="text-[13.5px] text-foreground">
                      <span className="font-semibold">{actorName}</span>{" "}
                      <span className="text-muted-foreground">{e.description}</span>
                    </div>
                    <div className="text-[11.5px] font-medium text-muted-foreground whitespace-nowrap">
                      {relativeTime}
                    </div>
                  </div>
                  
                  <div className="mt-1.5 p-3 rounded-[14px] bg-surface-2/80 border border-border flex items-start gap-3">
                     <div className="mt-0.5 text-muted-foreground">
                        {Icon && <Icon className="w-4 h-4 text-primary" />}
                     </div>
                     <div>
                       <div className="text-[13px] text-foreground font-medium">{e.type.replace(/_/g, " ")}</div>
                       {e.entityType === "Candidate" && (
                          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <span>Candidate ID:</span>
                            <Link href={`/candidates/${e.entityId}`} className="font-medium text-primary hover:underline">
                              {e.entityId.slice(0, 8)}...
                            </Link>
                          </div>
                       )}
                       {e.entityType === "Job" && (
                          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <span>Job ID:</span>
                            <Link href={`/jobs/${e.entityId}`} className="font-medium text-primary hover:underline">
                              {e.entityId.slice(0, 8)}...
                            </Link>
                          </div>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
