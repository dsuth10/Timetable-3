import { api } from './api';
import type { DailyViewData, AssignTaskPayload } from '../types';

export const dailyDisplayApi = {
  getDailyData: async (date: string): Promise<DailyViewData> => {
    const res = await api.get(`/daily-view/${date}`);
    return res.data;
  },
  
  assignTask: async (payload: AssignTaskPayload): Promise<void> => {
    await api.post('/daily-view/assign', payload);
  }
};

