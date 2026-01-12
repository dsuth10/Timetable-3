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
    const prevState = get().data;
    if (!prevState) return;

    try {
      set({ error: undefined });

      // Optimistic Update
      const optimisticData = { ...prevState };

      let sourceAssignment: any = null;

      if (payload.type === 'FROM_BANK') {
        const task = optimisticData.task_bank.find(t => t.id === payload.id);
        if (task) {
          // Remove from bank
          optimisticData.task_bank = optimisticData.task_bank.filter(t => t.id !== payload.id);
          // Create placeholder assignment
          sourceAssignment = {
            id: -(Date.now()), // Temp ID
            task_id: task.id,
            aide_id: payload.aide_id,
            date: payload.date,
            start_time: payload.start_time,
            end_time: payload.end_time,
            status: 'ASSIGNED',
            version: 1,
            task: task,
            classroom: task.classroom
          };
        }
      } else if (payload.type === 'FROM_RELIEF') {
        const assignment = optimisticData.relief_pool.find(a => a.id === payload.id);
        if (assignment) {
          // Remove from relief pool
          optimisticData.relief_pool = optimisticData.relief_pool.filter(a => a.id !== payload.id);
          // Update placeholder
          sourceAssignment = {
            ...assignment,
            aide_id: payload.aide_id,
            start_time: payload.start_time,
            end_time: payload.end_time,
            status: 'ASSIGNED'
          };
        }
      }

      if (sourceAssignment) {
        // Add to the correct aide's assignments
        optimisticData.aides = optimisticData.aides.map(aide => {
          if (aide.id === payload.aide_id) {
            return {
              ...aide,
              assignments: [...aide.assignments, sourceAssignment]
            };
          }
          return aide;
        });
        set({ data: optimisticData });
      }

      // API Call
      const res = await api.post('/daily-view/assign', payload);
      const serverAssignment = res.data;

      // Sync with server data (replace temp ID with real ID and actual data)
      set(state => {
        if (!state.data) return state;
        const syncedData = { ...state.data };
        syncedData.aides = syncedData.aides.map(aide => {
          if (aide.id === payload.aide_id) {
            return {
              ...aide,
              assignments: aide.assignments.map(a =>
                (a.id === sourceAssignment.id || a.id === serverAssignment.id) ? serverAssignment : a
              )
            };
          }
          return aide;
        });
        return { data: syncedData };
      });

    } catch (e: any) {
      // Rollback
      set({ data: prevState, error: e.response?.data?.message || e.message || 'Failed to assign task' });
      throw e;
    }
  },
}));


