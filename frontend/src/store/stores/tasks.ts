import { create } from 'zustand';
import { api } from '../../services/api';
import { tasksApi } from '../../services/tasksApi';
import type { Task, ID } from '../../types';

type TasksState = {
  tasks: Task[];
  loading: boolean;
  error?: string;
  fetchTasks: (opts?: { category?: Task['category'] }) => Promise<void>;
  updateTask: (id: ID, payload: Partial<Pick<Task, 'title' | 'category' | 'start_time' | 'end_time' | 'classroom_id' | 'notes' | 'recurrence_rule' | 'expires_on'>> & { aide_id?: number | null; existing_assignment_date?: string }) => Promise<Task>;
  deleteTask: (id: ID, reset?: boolean) => Promise<void>;
  addTask: (task: Task) => void;
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
  async deleteTask(id, reset) {
    try {
      set({ loading: true, error: undefined });
      await tasksApi.delete(id, reset);
      
      if (reset) {
        // Reset mode: Refresh tasks to get the updated task data
        await get().fetchTasks();
      } else {
        // Full deletion: Remove the task from local state
        const tasks = get().tasks;
        const updatedTasks = tasks.filter(task => task.id !== id);
        set({ tasks: updatedTasks, loading: false });
      }
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete task', loading: false });
      throw e;
    }
  },
}));




