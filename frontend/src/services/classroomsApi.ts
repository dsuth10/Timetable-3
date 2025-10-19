import { api } from './api';
import type { Classroom } from '../types';

export const classroomsApi = {
  list(): Promise<Classroom[]> {
    return api.get('/classrooms').then((r) => r.data as Classroom[]);
  },
  get(id: number): Promise<Classroom> {
    return api.get(`/classrooms/${id}`).then((r) => r.data as Classroom);
  },
  create(payload: Pick<Classroom, 'name'> & Partial<Pick<Classroom, 'capacity' | 'notes'>>): Promise<Classroom> {
    return api.post('/classrooms', payload).then((r) => r.data as Classroom);
  },
};

