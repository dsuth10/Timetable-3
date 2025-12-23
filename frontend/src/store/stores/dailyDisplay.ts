import { create } from 'zustand';
import { api } from '../../services/api';
import type { DailyViewData, AssignTaskPayload } from '../../types';

type DailyDisplayState = {
  data: DailyViewData | null;
  loading: boolean;
  error?: string;
  fetchDailyData: (date: string) => Promise<void>;
  assignTask: (payload: AssignTaskPayload) => Promise<void>;
};

export const useDailyDisplayStore = create<DailyDisplayState>((set, get) => ({
  data: null,
  loading: false,
  async fetchDailyData(date) {
    try {
      set({ loading: true, error: undefined });
      const res = await api.get(`/daily-view/${date}`);
      set({ data: res.data as DailyViewData });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch daily data' });
    } finally {
      set({ loading: false });
    }
  },
  async assignTask(payload) {
    try {
      set({ loading: true, error: undefined });
      await api.post('/daily-view/assign', payload);
      // Re-fetch data for the same date after assignment
      if (payload.date) {
        const res = await api.get(`/daily-view/${payload.date}`);
        set({ data: res.data as DailyViewData });
      }
    } catch (e: any) {
      set({ error: e.message || 'Failed to assign task' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },
}));

