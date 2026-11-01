"use client";

import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Role } from "@/constants/enums";

interface ActivityHeatMapProps {
  role: string;
  data: Record<string, number>;
}

export function ActivityHeatMap({ role, data }: ActivityHeatMapProps) {
  // Density scale derived from the organization primary colour
  const getDensityClass = (count: number | undefined) => {
    if (count === undefined || count === 0) return "bg-surface-2 hover:bg-muted text-muted-foreground border border-border";
    
    if (role === Role.ADMINISTRATOR || role === Role.HIRING_MANAGER) {
      if (count <= 25) return "bg-primary/15 hover:bg-primary/25 text-primary";
      if (count <= 100) return "bg-primary/35 hover:bg-primary/45 text-foreground";
      if (count <= 250) return "bg-primary/70 hover:bg-primary/80 text-primary-foreground";
      return "bg-primary hover:bg-primary-hover text-primary-foreground";
    } else {
      if (count <= 3) return "bg-primary/15 hover:bg-primary/25 text-primary";
      if (count <= 8) return "bg-primary/35 hover:bg-primary/45 text-foreground";
      if (count <= 15) return "bg-primary/70 hover:bg-primary/80 text-primary-foreground";
      return "bg-primary hover:bg-primary-hover text-primary-foreground";
    }
  };

  const calendarDays = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start, end });

    // 0 = Sunday, 1 = Monday. We want Monday to be the first day (optional, let's use standard Sunday = 0 for ease)
    const startDay = getDay(start);
    
    // Pad beginning of month with nulls
    const paddedDays: (Date | null)[] = Array.from({ length: startDay }, () => null);
    
    daysInMonth.forEach((day) => paddedDays.push(day));
    
    return paddedDays;
  }, []);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentMonthName = format(new Date(), "MMMM yyyy");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">Activity Density</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">Historical hiring activity for {currentMonthName}</p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium hidden sm:flex">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-surface-2 border border-border" />
          <div className="w-3 h-3 rounded-sm bg-primary/15" />
          <div className="w-3 h-3 rounded-sm bg-primary/35" />
          <div className="w-3 h-3 rounded-sm bg-primary/70" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[12px] font-medium text-muted-foreground mb-2">
            {day}
          </div>
        ))}
        
        <TooltipProvider delayDuration={100}>
          {calendarDays.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="h-10 w-full" />;
            
            const dateStr = format(date, "yyyy-MM-dd");
            const count = data[dateStr] || 0;
            const isFuture = date > new Date() && !isToday(date);
            const todayClass = isToday(date) ? "ring-2 ring-offset-2 ring-offset-surface ring-primary" : "";
            
            // If future date, just render an empty placeholder to keep calendar structure
            if (isFuture) {
              return (
                <div key={dateStr} className={`h-10 w-full rounded-md flex items-center justify-center text-[12px] font-medium bg-transparent text-muted-foreground/40 border border-dashed border-border ${todayClass}`}>
                  {format(date, "d")}
                </div>
              );
            }

            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger asChild>
                  <div className={`h-10 w-full rounded-md flex items-center justify-center text-[12px] font-medium transition cursor-default ${getDensityClass(count)} ${todayClass}`}>
                    {format(date, "d")}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[12px]">
                  <p className="font-semibold mb-0.5">{format(date, "MMMM d")}</p>
                  <p className="text-muted-foreground">Activities Completed: <span className="font-medium text-foreground">{count}</span></p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
      
      {/* Empty State check for actual data */}
      {Object.values(data).length === 0 && (
        <div className="text-center py-6 text-[13px] text-muted-foreground">
          No hiring activity recorded this month.
        </div>
      )}
    </div>
  );
}
