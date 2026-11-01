import { api } from "./axios";

export const timelineService = {
    getHeatmap: async (startDate: string, endDate: string): Promise<Record<string, number>> => {
        const response = await api.get(`/timeline/heatmap`, { params: { startDate, endDate } });
        return response.data.data;
    },

    getTodayLedger: async (): Promise<any[]> => {
        const response = await api.get(`/timeline/today`);
        return response.data.data;
    }
};

