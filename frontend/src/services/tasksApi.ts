import { api } from './api';
import type { Task, ID, Assignment } from '../types';

export interface QuickCreateTaskRequest {
  title: string;
  category: Task['category'];
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  duration_minutes: number;
  aide_id: number;
  classroom_id?: number | null;
  notes?: string | null;
}

export interface QuickCreateTaskResponse {
  task: Task;
  assignment: Assignment;
}

export const tasksApi = {
  list(opts?: { category?: Task['category']; classroom_id?: number | null }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (opts?.category) params.append('category', opts.category);
    if (opts?.classroom_id) params.append('classroom_id', opts.classroom_id.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
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
  quickCreateTask(payload: QuickCreateTaskRequest): Promise<QuickCreateTaskResponse> {
    return api.post('/quick-create-task', payload).then((r) => r.data as QuickCreateTaskResponse);
  },
};

// Add default export for backward compatibility
export default tasksApi;


