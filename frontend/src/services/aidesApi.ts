import { api } from './api';
import type { TeacherAide, Availability, ID } from '../types';

export const aidesApi = {
  list(): Promise<TeacherAide[]> {
    return api.get('/aides').then((r) => r.data as TeacherAide[]);
  },
  create(payload: Pick<TeacherAide, 'name' | 'colour_hex'> & { qualifications?: string }): Promise<TeacherAide> {
    return api.post('/aides', payload).then((r) => r.data as TeacherAide);
  },
  get(id: ID): Promise<TeacherAide> {
    return api.get(`/aides/${id}`).then((r) => r.data as TeacherAide);
  },
  update(id: ID, payload: Partial<Pick<TeacherAide, 'name' | 'colour_hex' | 'qualifications'>>): Promise<TeacherAide> {
    return api.put(`/aides/${id}`, payload).then((r) => r.data as TeacherAide);
  },
  availability: {
    list(aideId: ID): Promise<Availability[]> {
      return api.get(`/aides/${aideId}/availability`).then((r) => r.data as Availability[]);
    },
    create(aideId: ID, payload: Pick<Availability, 'weekday' | 'start_time' | 'end_time'>): Promise<Availability> {
      return api.post(`/aides/${aideId}/availability`, payload).then((r) => r.data as Availability);
    },
    delete(aideId: ID, id: ID): Promise<void> {
      return api.delete(`/aides/${aideId}/availability/${id}`).then(() => {});
    },
  },
};


