import { api } from './api';
import type { Absence, ID } from '../types';

export const absencesApi = {
  create(payload: { aide_id: ID; date: string; reason?: string | null }): Promise<Absence> {
    return api.post('/absences', payload).then((r) => r.data as Absence);
  },
  listForAide(aideId: ID): Promise<Absence[]> {
    return api.get(`/aides/${aideId}/absences`).then((r) => r.data as Absence[]);
  },
  delete(id: ID): Promise<void> {
    return api.delete(`/absences/${id}`).then(() => {});
  },
};


