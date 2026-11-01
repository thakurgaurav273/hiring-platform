"use client";

import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { Guard } from "@/components/access-restricted";
import { ActivityHeatMap } from "@/components/timeline/activity-heat-map";
import { ActivityLedger } from "@/components/timeline/activity-ledger";
import { Role } from "@/constants/enums";
import { useTimelineHeatmap, useTimelineLedger } from "@/hooks/useTimeline";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function TimelinePage() {
  return (
    <Guard section="timeline">
      <TimelineInner />
    </Guard>
  );
}

function TimelineInner() {
  const role = useAppStore((s) => s.role);
  
  const today = new Date();
  const start = format(startOfMonth(today), "yyyy-MM-dd");
  const end = format(endOfMonth(today), "yyyy-MM-dd");

  const { data: historicalData, isLoading: isLoadingHeatmap } = useTimelineHeatmap(start, end);
  const { data: todaysActivities, isLoading: isLoadingLedger } = useTimelineLedger();

  const loading = isLoadingHeatmap || isLoadingLedger;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Workspace" }, { label: "Timeline" }]}
        title="Activity Center"
        description={role !== Role.ADMINISTRATOR && role !== Role.HIRING_MANAGER ? "Your personal hiring activity." : "Organization-wide hiring events and metrics."}
      />
      <div className="px-4 py-6 md:px-8">
        {loading ? (
           <div className="space-y-12">
             <div className="h-[320px] bg-muted/50 rounded-[24px] animate-pulse" />
             <div className="h-[400px] bg-muted/50 rounded-[24px] animate-pulse" />
           </div>
        ) : (
           <div className="space-y-12">
             <ActivityHeatMap role={role as any} data={historicalData || {}} />
             <div className="h-px w-full bg-border/60" />
             <ActivityLedger activities={todaysActivities || []} />
           </div>
        )}
      </div>
    </div>
  );
}

