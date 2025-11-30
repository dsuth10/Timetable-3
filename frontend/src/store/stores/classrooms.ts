import { create } from 'zustand';
import { classroomsApi } from '../../services/classroomsApi';
import type { Classroom, ID } from '../../types';

type ClassroomsState = {
  classrooms: Classroom[];
  loading: boolean;
  error?: string;
  fetchClassrooms: () => Promise<void>;
  createClassroom: (payload: Pick<Classroom, 'name' | 'room_number' | 'teacher'> & Partial<Pick<Classroom, 'capacity' | 'notes'>>) => Promise<Classroom>;
  updateClassroom: (id: ID, payload: Partial<Pick<Classroom, 'name' | 'room_number' | 'teacher' | 'capacity' | 'notes'>>) => Promise<Classroom>;
  deleteClassroom: (id: ID) => Promise<void>;
};

export const useClassroomsStore = create<ClassroomsState>((set, get) => ({
  classrooms: [],
  loading: false,
  async fetchClassrooms() {
    try {
      set({ loading: true, error: undefined });
      const classrooms = await classroomsApi.list();
      set({ classrooms });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch classrooms' });
    } finally {
      set({ loading: false });
    }
  },
  async createClassroom(payload) {
    try {
      set({ loading: true, error: undefined });
      const newClassroom = await classroomsApi.create(payload);
      set({ classrooms: [...get().classrooms, newClassroom], loading: false });
      return newClassroom;
    } catch (e: any) {
      set({ error: e.message || 'Failed to create classroom', loading: false });
      throw e;
    }
  },
  async updateClassroom(id, payload) {
    try {
      set({ loading: true, error: undefined });
      const updatedClassroom = await classroomsApi.update(id, payload);
      
      const classrooms = get().classrooms;
      const updatedClassrooms = classrooms.map(c => 
        c.id === id ? updatedClassroom : c
      );
      set({ classrooms: updatedClassrooms, loading: false });
      
      return updatedClassroom;
    } catch (e: any) {
      set({ error: e.message || 'Failed to update classroom', loading: false });
      throw e;
    }
  },
  async deleteClassroom(id) {
    try {
      set({ loading: true, error: undefined });
      await classroomsApi.delete(id);
      
      const classrooms = get().classrooms;
      const updatedClassrooms = classrooms.filter(c => c.id !== id);
      set({ classrooms: updatedClassrooms, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete classroom', loading: false });
      throw e;
    }
  },
}));
