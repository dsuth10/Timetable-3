import { api } from './api';
import type { Assignment, ID } from '../types';

export const assignmentsApi = {
  create(payload: Omit<Assignment, 'id' | 'version' | 'created_at' | 'updated_at'>): Promise<Assignment> {
    return api.post('/assignments', payload).then((r) => r.data as Assignment);
  },
  get(id: ID): Promise<Assignment> {
    return api.get(`/assignments/${id}`).then((r) => r.data as Assignment);
  },
  update(id: ID, payload: Partial<Pick<Assignment, 'aide_id' | 'date' | 'start_time' | 'end_time' | 'status' | 'version'>>): Promise<Assignment> {
    return api.put(`/assignments/${id}`, payload).then((r) => r.data as Assignment);
  },
  batch(payload: { task_id: ID; aide_id: ID | null; dates: string[]; start_time: string; end_time: string; }) {
    return api.post('/assignments/batch', payload).then((r) => r.data as { assignments: Assignment[]; conflicts: any[] });
  },
  weeklyMatrix(startDateISO: string) {
    const url = `/assignments/weekly-matrix?start_date=${startDateISO}`;
    return api.get(url)
      .then((r) => (r?.data ?? { assignments: [] }) as any)
      .catch((err) => {
        console.error('Failed to fetch weekly matrix:', err);
        throw err;
      });
  },
  unassigned(dateISO?: string) {
    const q = dateISO ? `?date=${dateISO}` : '';
    const url = `/assignments/unassigned${q}`;
    return api.get(url)
      .then((r) => (r?.data ?? []) as Assignment[])
      .catch((err) => {
        console.error('Failed to fetch unassigned tasks:', err);
        throw err;
      });
  },
  assigned(): Promise<Assignment[]> {
    return api.get('/assignments/assigned').then((r) => r.data as Assignment[]);
  },
  delete(id: ID): Promise<void> {
    return api.delete(`/assignments/${id}`).then(() => undefined);
  },
  deleteRecurringSeriesForAide(id: ID, version: number, preview: boolean = false): Promise<any> {
    const q = preview ? '?preview=true' : '';
    return api.delete(`/assignments/${id}/recurring-series-for-aide${q}`, { data: { version } })
      .then((r) => r.data);
  },
};


