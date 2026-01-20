import { create } from 'zustand';
import { api } from '../../services/api';
import { useSyncStore } from './syncStore';
import type { Absence, ID } from '../../types';

type AbsencesState = {
  byAide: Record<ID, Absence[]>;
  loading: boolean;
  error?: string;
  create: (payload: { aide_id: ID; date: string; reason?: string | null }) => Promise<Absence>;
  listForAide: (aideId: ID) => Promise<Absence[]>;
  delete: (id: ID) => Promise<void>;
};

export const useAbsencesStore = create<AbsencesState>((set, get) => ({
  byAide: {},
  loading: false,
  async create(payload) {
    const res = await api.post('/absences', payload);
    const created = { id: res.data.id, aide_id: res.data.aide_id, date: res.data.date, reason: res.data.reason } as Absence;
    const current = get().byAide[payload.aide_id] || [];
    set({ byAide: { ...get().byAide, [payload.aide_id]: [...current, created] } });
    useSyncStore.getState().triggerGlobalRefresh();
    return created;
  },
  async listForAide(aideId) {
    const res = await api.get(`/aides/${aideId}/absences`);
    const items = res.data as Absence[];
    set({ byAide: { ...get().byAide, [aideId]: items } });
    return items;
  },
  async delete(id) {
    await api.delete(`/absences/${id}`);
    // Remove from any aide buckets
    const next: Record<ID, Absence[]> = {} as any;
    const curr = get().byAide;
    for (const k of Object.keys(curr)) {
      const key = Number(k) as ID;
      next[key] = curr[key].filter((a) => a.id !== id);
    }
    set({ byAide: next });
    useSyncStore.getState().triggerGlobalRefresh();
  },
}));




