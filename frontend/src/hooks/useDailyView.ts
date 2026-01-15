import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { DailyViewData } from '../types';
import { useScheduleStore } from '../store/stores/scheduleStore';

export const dailyKeys = {
    all: ['daily'] as const,
    date: (date: string) => [...dailyKeys.all, date] as const,
};

export function useDailyView(date: string) {
    const setScheduleConfig = useScheduleStore(s => s.setScheduleConfig);

    return useQuery({
        queryKey: dailyKeys.date(date),
        queryFn: async () => {
            const res = await api.get(`/daily-view/${date}`);
            const data = res.data as DailyViewData;

            // Maintain side effect for global config
            if (data.timeline_config) {
                setScheduleConfig(data.timeline_config);
            }

            return data;
        },
        enabled: !!date,
    });
}
