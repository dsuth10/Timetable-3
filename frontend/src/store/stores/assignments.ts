import { create } from 'zustand';
import { api } from '../../services/api';
import type { Assignment, ID } from '../../types';
import type { QuickCreateTaskResponse } from '../../services/tasksApi';

type AssignmentsState = {
  items: Assignment[];
  loading: boolean;
  error?: string;
  fetchWeek: (startDateISO: string) => Promise<void>;
  create: (payload: Omit<Assignment, 'id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Assignment>;
  update: (id: ID, payload: Partial<Pick<Assignment, 'aide_id' | 'start_time' | 'end_time' | 'status' | 'version'>>) => Promise<Assignment>;
  batch: (payload: { task_id: ID; aide_id: ID | null; dates: string[]; start_time: string; end_time: string; }) => Promise<{ assignments: Assignment[]; conflicts: any[] }>;
  handleQuickCreate: (response: QuickCreateTaskResponse) => void;
};

export const useAssignmentsStore = create<AssignmentsState>((set, get) => ({
  items: [],
  loading: false,
  async fetchWeek(startDateISO) {
    try {
      set({ loading: true, error: undefined });
      await api.get(`/assignments/weekly-matrix?start_date=${startDateISO}`);
      // Store not only matrix; keep flat assignments list for simplicity here
      // Matrix will be consumed directly by TimetableGrid via API if needed
      set({});
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch weekly matrix' });
    } finally {
      set({ loading: false });
    }
  },
  async create(payload) {
    const res = await api.post('/assignments', payload);
    const created = res.data as Assignment;
    set({ items: [...get().items, created] });
    return created;
  },
  async update(id, payload) {
    const res = await api.put(`/assignments/${id}`, payload);
    const updated = res.data as Assignment;
    set({ items: get().items.map((a) => (a.id === id ? updated : a)) });
    return updated;
  },
  async batch(payload) {
    const res = await api.post('/assignments/batch', payload);
    return res.data as { assignments: Assignment[]; conflicts: any[] };
  },
  handleQuickCreate(response) {
    // Optimistically add the assignment to the store
    set(state => {
      // Check if assignment already exists (shouldn't happen, but defensive)
      const existingIndex = state.items.findIndex(a => a.id === response.assignment.id);
      if (existingIndex >= 0) {
        // Update existing assignment
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = response.assignment;
        return { items: updatedItems };
      } else {
        // Add new assignment
        return { items: [...state.items, response.assignment] };
      }
    });
  },
}));




