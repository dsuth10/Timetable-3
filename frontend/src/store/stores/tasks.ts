import { create } from 'zustand';
import { api } from '../../services/api';
import { tasksApi } from '../../services/tasksApi';
import type { Task, ID } from '../../types';

type TasksState = {
  tasks: Task[];
  loading: boolean;
  error?: string;
  fetchTasks: (opts?: { category?: Task['category'] }) => Promise<void>;
  updateTask: (id: ID, payload: Partial<Pick<Task, 'title' | 'category' | 'start_time' | 'end_time' | 'classroom_id' | 'notes' | 'recurrence_rule' | 'expires_on'>>) => Promise<Task>;
};

export const useTasksStore = create<TasksState>((set, get) => ({
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
  async updateTask(id, payload) {
    try {
      set({ loading: true, error: undefined });
      const updatedTask = await tasksApi.update(id, payload);
      
      // Update the task in the local state
      const tasks = get().tasks;
      const updatedTasks = tasks.map(task => 
        task.id === id ? updatedTask : task
      );
      set({ tasks: updatedTasks, loading: false });
      
      return updatedTask;
    } catch (e: any) {
      set({ error: e.message || 'Failed to update task', loading: false });
      throw e;
    }
  },
}));




