import { create } from 'zustand';
import { api } from '../../services/api';
import type { TeacherAide, Availability } from '../../types';

type AidesState = {
  aides: TeacherAide[];
  loading: boolean;
  error?: string;
  fetchAides: (opts?: { includeAvailability?: boolean }) => Promise<void>;
  createAide: (payload: Pick<TeacherAide, 'name' | 'colour_hex'> & { details?: string }) => Promise<TeacherAide>;
  updateAide: (id: number, payload: Partial<Pick<TeacherAide, 'name' | 'colour_hex' | 'details'>>) => Promise<TeacherAide>;
  getAvailability: (aideId: number) => Promise<Availability[]>;
};

export const useAidesStore = create<AidesState>((set, get) => ({
  aides: [],
  loading: false,
  async fetchAides(opts) {
    try {
      set({ loading: true, error: undefined });
      const include = opts?.includeAvailability ? '?include=availability' : '';
      const res = await api.get(`/aides${include}`);
      set({ aides: res.data as TeacherAide[] });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch aides' });
    } finally {
      set({ loading: false });
    }
  },
  async createAide(payload) {
    const res = await api.post('/aides', payload);
    const aide = res.data as TeacherAide;
    set({ aides: [...get().aides, aide] });
    return aide;
  },
  async updateAide(id, payload) {
    const res = await api.put(`/aides/${id}`, payload);
    const updatedAide = res.data as TeacherAide;
    set({ 
      aides: get().aides.map(aide => aide.id === id ? updatedAide : aide)
    });
    return updatedAide;
  },
  async getAvailability(aideId: number) {
    const res = await api.get(`/aides/${aideId}/availability`);
    return res.data as Availability[];
  },
}));




