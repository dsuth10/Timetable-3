import { create } from 'zustand';
import { api } from '../../services/api';
import { tasksApi, type QuickCreateTaskResponse } from '../../services/tasksApi';
import { useSyncStore } from './syncStore';
import type { Task, ID } from '../../types';

type TasksState = {
  tasks: Task[];
  loading: boolean;
  error?: string;
  fetchTasks: (opts?: { category?: Task['category'] }) => Promise<void>;
  updateTask: (id: ID, payload: Partial<Pick<Task, 'title' | 'category' | 'start_time' | 'end_time' | 'classroom_id' | 'notes' | 'recurrence_rule' | 'expires_on'>> & { aide_id?: number | null; existing_assignment_date?: string }) => Promise<Task>;
  deleteTask: (id: ID, reset?: boolean) => Promise<void>;
  addTask: (task: Task) => void;
  handleQuickCreate: (response: QuickCreateTaskResponse) => void;
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
  addTask(task) {
    set(state => ({ tasks: [...state.tasks, task] }));
  },
  handleQuickCreate(response) {
    // Optimistically add the task to the store
    set(state => {
      // Check if task already exists (shouldn't happen, but defensive)
      const existingIndex = state.tasks.findIndex(t => t.id === response.task.id);
      if (existingIndex >= 0) {
        // Update existing task
        const updatedTasks = [...state.tasks];
        updatedTasks[existingIndex] = response.task;
        return { tasks: updatedTasks };
      } else {
        // Add new task
        return { tasks: [...state.tasks, response.task] };
      }
    });
  },
  async updateTask(id, payload) {
    const tasksBefore = get().tasks;
    try {
      set({ error: undefined });

      // Optimistically update the item
      const updatedTasksOptimistic = tasksBefore.map(task =>
        task.id === id ? { ...task, ...payload } as Task : task
      );
      set({ tasks: updatedTasksOptimistic });

      const updatedTask = await tasksApi.update(id, payload);

      const tasksFinal = get().tasks.map(task =>
        task.id === id ? updatedTask : task
      );
      set({ tasks: tasksFinal });
      useSyncStore.getState().triggerGlobalRefresh();

      return updatedTask;
    } catch (e: any) {
      // Rollback on error
      set({ tasks: tasksBefore, error: e.message || 'Failed to update task' });
      throw e;
    }
  },
  async deleteTask(id, reset) {
    const tasksBefore = get().tasks;
    try {
      set({ error: undefined });

      if (reset) {
        // Reset doesn't delete, just modifies recurrence settings in the task
        set({ loading: true });
        await tasksApi.delete(id, reset);
        await get().fetchTasks(); // Still need re-fetch because reset affects multiple fields / recurrence series
        set({ loading: false });
      } else {
        // Optimistic deletion
        const updatedTasks = tasksBefore.filter(task => task.id !== id);
        set({ tasks: updatedTasks });

        await tasksApi.delete(id, reset);
        // No need to re-fetch on success!
        useSyncStore.getState().triggerGlobalRefresh();
      }
    } catch (e: any) {
      // Rollback on error
      set({ tasks: tasksBefore, error: e.message || 'Failed to delete task', loading: false });
      throw e;
    }
  },
}));




