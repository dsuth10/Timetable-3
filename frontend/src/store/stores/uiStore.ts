import { create } from 'zustand';

type UiState = {
  selectedWeekStartISO: string; // Monday YYYY-MM-DD
  modals: {
    conflict: boolean;
    taskCreation: boolean;
    absence: boolean;
    multiDay: boolean;
  };
  openModal: (key: keyof UiState['modals']) => void;
  closeModal: (key: keyof UiState['modals']) => void;
  setWeekStart: (dateISO: string) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  thisWeek: () => void;
};

function getMonday(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday (1), handle Sunday (0)
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function fmt(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const useUiStore = create<UiState>((set, get) => ({
  selectedWeekStartISO: fmt(getMonday(new Date())),
  modals: {
    conflict: false,
    taskCreation: false,
    absence: false,
    multiDay: false,
  },
  openModal(key) {
    set((s) => ({ modals: { ...s.modals, [key]: true } }));
  },
  closeModal(key) {
    set((s) => ({ modals: { ...s.modals, [key]: false } }));
  },
  setWeekStart(dateISO) {
    set({ selectedWeekStartISO: dateISO });
  },
  nextWeek() {
    const cur = new Date(get().selectedWeekStartISO + 'T00:00:00Z');
    cur.setUTCDate(cur.getUTCDate() + 7);
    set({ selectedWeekStartISO: fmt(cur) });
  },
  prevWeek() {
    const cur = new Date(get().selectedWeekStartISO + 'T00:00:00Z');
    cur.setUTCDate(cur.getUTCDate() - 7);
    set({ selectedWeekStartISO: fmt(cur) });
  },
  thisWeek() {
    set({ selectedWeekStartISO: fmt(getMonday(new Date())) });
  },
}));


