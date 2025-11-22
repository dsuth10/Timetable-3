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
  // Update task template and optionally create a recurring series
  update(id: ID, payload: Partial<Pick<Task, 'title' | 'category' | 'start_time' | 'end_time' | 'classroom_id' | 'notes'>> & { aide_id?: number | null; existing_assignment_date?: string; recurrence_rule?: string; expires_on?: string }): Promise<Task> {
    return api.put(`/tasks/${id}`, payload).then((r) => r.data as Task);
  },
  listAssignments(taskId: ID) {
    return api.get(`/tasks/${taskId}/assignments`).then((r) => r.data as any[]);
  },
  delete(id: ID, reset?: boolean): Promise<void> {
    const query = reset ? '?reset=true' : '';
    return api.delete(`/tasks/${id}${query}`).then(() => undefined);
  },
};

// Add default export for backward compatibility
export default tasksApi;


