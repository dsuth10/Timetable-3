import { create } from 'zustand';
import { api } from '../../services/api';
import type { Task, ID } from '../../types';

type TasksState = {
  tasks: Task[];
  loading: boolean;
  error?: string;
  fetchTasks: (opts?: { category?: Task['category'] }) => Promise<void>;
};

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loading: false,
  async fetchTasks(opts) {
    try {
      set({ loading: true, error: undefined });
      const q = opts?.category ? `?category=${opts.category}` : '';
      const res = await api.get(`/tasks${q}`);
      set({ tasks: res.data as Task[] });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch tasks' });
    } finally {
      set({ loading: false });
    }
  },
}));




