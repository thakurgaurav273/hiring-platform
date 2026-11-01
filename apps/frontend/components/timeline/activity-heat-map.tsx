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
  // Use primary brand teal scale
  const getDensityClass = (count: number | undefined) => {
    if (count === undefined || count === 0) return "bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-100";
    
    if (role === Role.ADMINISTRATOR || role === Role.HIRING_MANAGER) {
      if (count <= 25) return "bg-[#0f766e]/20 hover:bg-[#0f766e]/30 text-[#0f766e]";
      if (count <= 100) return "bg-[#0f766e]/40 hover:bg-[#0f766e]/50 text-[#0f766e]";
      if (count <= 250) return "bg-[#0f766e]/70 hover:bg-[#0f766e]/80 text-white";
      return "bg-[#0f766e] hover:bg-[#0b5c56] text-white";
    } else {
      if (count <= 3) return "bg-[#0f766e]/20 hover:bg-[#0f766e]/30 text-[#0f766e]";
      if (count <= 8) return "bg-[#0f766e]/40 hover:bg-[#0f766e]/50 text-[#0f766e]";
      if (count <= 15) return "bg-[#0f766e]/70 hover:bg-[#0f766e]/80 text-white";
      return "bg-[#0f766e] hover:bg-[#0b5c56] text-white";
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
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-[#0f766e]/20" />
          <div className="w-3 h-3 rounded-sm bg-[#0f766e]/40" />
          <div className="w-3 h-3 rounded-sm bg-[#0f766e]/70" />
          <div className="w-3 h-3 rounded-sm bg-[#0f766e]" />
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
            const todayClass = isToday(date) ? "ring-2 ring-offset-2 ring-[#0f766e]" : "";
            
            // If future date, just render an empty placeholder to keep calendar structure
            if (isFuture) {
              return (
                <div key={dateStr} className={`h-10 w-full rounded-md flex items-center justify-center text-[12px] font-medium bg-transparent text-gray-200 border border-dashed border-gray-200 ${todayClass}`}>
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
