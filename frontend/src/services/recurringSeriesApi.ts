import { api } from './api';
import type { RecurringSeries, ID } from '../types';

export const recurringSeriesApi = {
  get(id: ID): Promise<RecurringSeries> {
    return api.get(`/recurring-series/${id}`).then((r) => r.data as RecurringSeries);
  },
  list(opts?: { task_id?: ID; aide_id?: ID }): Promise<RecurringSeries[]> {
    const params = new URLSearchParams();
    if (opts?.task_id) params.append('task_id', opts.task_id.toString());
    if (opts?.aide_id) params.append('aide_id', opts.aide_id.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/recurring-series${query}`).then((r) => r.data as RecurringSeries[]);
  },
  update(id: ID, payload: Partial<Pick<RecurringSeries, 'expires_on' | 'recurrence_rule'>>): Promise<RecurringSeries> {
    return api.put(`/recurring-series/${id}`, payload).then((r) => r.data as RecurringSeries);
  },
  delete(id: ID, deleteAll: boolean = false): Promise<void> {
    const query = deleteAll ? '?delete_all=true' : '';
    return api.delete(`/recurring-series/${id}${query}`).then(() => undefined);
  },
};

