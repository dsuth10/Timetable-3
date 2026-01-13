import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { DailyViewData } from '../types';
import { updateScheduleConfig } from '../components/TimetableGrid/timeUtils';

export const dailyKeys = {
    all: ['daily'] as const,
    date: (date: string) => [...dailyKeys.all, date] as const,
};

export function useDailyView(date: string) {
    return useQuery({
        queryKey: dailyKeys.date(date),
        queryFn: async () => {
            const res = await api.get(`/daily-view/${date}`);
            const data = res.data as DailyViewData;

            // Maintain side effect for global config
            if (data.timeline_config) {
                updateScheduleConfig(data.timeline_config);
            }

            return data;
        },
        enabled: !!date,
    });
}
