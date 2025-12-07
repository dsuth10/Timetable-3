import { api } from './api';
import type { Classroom, ID } from '../types';

export const classroomsApi = {
  list(): Promise<Classroom[]> {
    return api.get('/classrooms').then((r) => r.data as Classroom[]);
  },
  get(id: number): Promise<Classroom> {
    return api.get(`/classrooms/${id}`).then((r) => r.data as Classroom);
  },
  create(payload: Pick<Classroom, 'name' | 'room_number' | 'teacher'> & Partial<Pick<Classroom, 'capacity' | 'notes'>>): Promise<Classroom> {
    return api.post('/classrooms', payload).then((r) => r.data as Classroom);
  },
  update(id: ID, payload: Partial<Pick<Classroom, 'name' | 'room_number' | 'teacher' | 'capacity' | 'notes'>>): Promise<Classroom> {
    return api.put(`/classrooms/${id}`, payload).then((r) => r.data as Classroom);
  },
  delete(id: ID): Promise<void> {
    return api.delete(`/classrooms/${id}`).then(() => undefined);
  },
  batchUpload(file: File): Promise<{
    created: number;
    skipped_duplicates: number;
    skipped_existing: number;
    errors: number;
    classrooms: Classroom[];
    skipped_duplicate_names?: string[];
    skipped_existing_names?: string[];
    error_details?: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/classrooms/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((r) => r.data);
  },
};
