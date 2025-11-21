import { api } from './api';
import type { Task, ID } from '../types';

export const tasksApi = {
  list(opts?: { category?: Task['category'] }): Promise<Task[]> {
    const q = opts?.category ? `?category=${opts.category}` : '';
    return api.get(`/tasks${q}`).then((r) => r.data as Task[]);
  },
  get(id: ID): Promise<Task> {
    return api.get(`/tasks/${id}`).then((r) => r.data as Task);
  },
  createOneOff(payload: Pick<Task, 'title' | 'category' | 'start_time' | 'end_time' | 'classroom_id'> & { notes?: string | null }): Promise<Task> {
    return api.post('/tasks', payload).then((r) => r.data as Task);
  },
  // Old createRecurring removed - recurring tasks are now created by editing an assigned task
  update(id: ID, payload: Partial<Pick<Task, 'title' | 'category' | 'start_time' | 'end_time' | 'classroom_id' | 'notes' | 'recurrence_rule' | 'expires_on'>> & { aide_id?: number | null; existing_assignment_date?: string }): Promise<Task> {
    return api.put(`/tasks/${id}`, payload).then((r) => r.data as Task);
  },
  listAssignments(taskId: ID) {
    return api.get(`/tasks/${taskId}/assignments`).then((r) => r.data as any[]);
  },
  delete(id: ID): Promise<void> {
    return api.delete(`/tasks/${id}`).then(() => undefined);
  },
};


