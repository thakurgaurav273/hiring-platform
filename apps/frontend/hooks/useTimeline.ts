import { useQuery } from "@tanstack/react-query";
import { timelineService } from "../services/api/timeline.service";

export const useTimelineHeatmap = (startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ["timeline", "heatmap", startDate, endDate],
        queryFn: () => timelineService.getHeatmap(startDate, endDate),
    });
};

export const useTimelineLedger = () => {
    return useQuery({
        queryKey: ["timeline", "ledger", "today"],
        queryFn: () => timelineService.getTodayLedger(),
    });
};
