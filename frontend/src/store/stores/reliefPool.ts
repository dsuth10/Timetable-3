import { create } from 'zustand';
import { reliefPoolApi } from '../../services/reliefPoolApi';
import type {
  ID,
  Assignment,
  ReliefPoolTask,
  ReliefPoolByDate,
  ReliefPoolReassignRequest,
  ReliefPoolDismissRequest,
} from '../../types';

interface ReliefPoolState {
  tasks: ReliefPoolTask[];
  byDate: ReliefPoolByDate;
  count: number;
  countByDate: Record<string, number>;
  loading: boolean;
  loadingStates: Record<ID, boolean>; // Track loading per task
  error?: string;

  // Actions
  fetch: (options?: { date?: string; include_expired?: boolean }) => Promise<void>;
  fetchCount: () => Promise<void>;
  reassign: (assignmentId: ID, payload: ReliefPoolReassignRequest) => Promise<Assignment>;
  dismiss: (assignmentId: ID, payload: ReliefPoolDismissRequest) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
  setTaskLoading: (taskId: ID, isLoading: boolean) => void;
}

export const useReliefPoolStore = create<ReliefPoolState>((set, get) => ({
  tasks: [],
  byDate: {},
  count: 0,
  countByDate: {},
  loading: false,
  loadingStates: {},
  error: undefined,

  async fetch(options) {
    set({ loading: true, error: undefined });
    try {
      const response = await reliefPoolApi.getAll(options);
      set({
        tasks: response.tasks,
        byDate: response.by_date,
        count: response.total_count,
        loading: false,
        loadingStates: {}, // Reset on fresh fetch
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Relief Pool';
      set({ error: message, loading: false });
    }
  },

  async fetchCount() {
    try {
      const response = await reliefPoolApi.getCount();
      set({
        count: response.count,
        countByDate: response.by_date,
      });
    } catch (err: unknown) {
      // Silently fail for badge count - not critical
      console.error('Failed to fetch Relief Pool count:', err);
    }
  },

  setTaskLoading(taskId, isLoading) {
    set(s => ({
      loadingStates: { ...s.loadingStates, [taskId]: isLoading }
    }));
  },

  async reassign(assignmentId, payload) {
    get().setTaskLoading(assignmentId, true);
    set({ error: undefined });
    try {
      const result = await reliefPoolApi.reassign(assignmentId, payload);

      // Remove from local state
      const tasks = get().tasks.filter((t) => t.id !== assignmentId);
      const byDate = { ...get().byDate };
      for (const date of Object.keys(byDate)) {
        if (byDate[date]) {
          byDate[date] = byDate[date].filter((id) => id !== assignmentId);
          if (byDate[date].length === 0) {
            delete byDate[date];
          }
        }
      }

      const loadingStates = { ...get().loadingStates };
      delete loadingStates[assignmentId];

      set({
        tasks,
        byDate,
        loadingStates,
        count: tasks.length,
      });

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reassign task';
      set({ error: message });
      get().setTaskLoading(assignmentId, false);
      throw err;
    }
  },

  async dismiss(assignmentId, payload) {
    get().setTaskLoading(assignmentId, true);
    set({ error: undefined });
    try {
      await reliefPoolApi.dismiss(assignmentId, payload);

      // Remove from local state
      const tasks = get().tasks.filter((t) => t.id !== assignmentId);
      const byDate = { ...get().byDate };
      for (const date of Object.keys(byDate)) {
        if (byDate[date]) {
          byDate[date] = byDate[date].filter((id) => id !== assignmentId);
          if (byDate[date].length === 0) {
            delete byDate[date];
          }
        }
      }

      const loadingStates = { ...get().loadingStates };
      delete loadingStates[assignmentId];

      set({
        tasks,
        byDate,
        loadingStates,
        count: tasks.length,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dismiss task';
      set({ error: message });
      get().setTaskLoading(assignmentId, false);
      throw err;
    }
  },

  async refresh() {
    // Refresh both tasks and count
    await Promise.all([get().fetch(), get().fetchCount()]);
  },

  clear() {
    set({
      tasks: [],
      byDate: {},
      count: 0,
      countByDate: {},
      loading: false,
      loadingStates: {},
      error: undefined,
    });
  },
}));

// Helper hook to get tasks grouped by date with full task data
export function useReliefPoolByDate() {
  const tasks = useReliefPoolStore((s) => s.tasks);

  const grouped: Record<string, ReliefPoolTask[]> = {};
  for (const task of tasks) {
    if (!grouped[task.date]) {
      grouped[task.date] = [];
    }
    grouped[task.date].push(task);
  }

  // Sort dates
  const sortedDates = Object.keys(grouped).sort();
  const result: Record<string, ReliefPoolTask[]> = {};
  for (const date of sortedDates) {
    // Sort tasks by start time within each date
    result[date] = grouped[date].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
  }

  return result;
}



































