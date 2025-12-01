import { create } from 'zustand';

type UiState = {
  selectedWeekStartISO: string; // Monday YYYY-MM-DD
  viewMode: 'AIDE' | 'CLASS';
  selectedClassId: number | null;
  selectedTimeSlot: { date: string; time: string; duration: number } | null;
  modals: {
    conflict: boolean;
    taskCreation: boolean;
    absence: boolean;
    multiDay: boolean;
  };
  openModal: (key: keyof UiState['modals']) => void;
  closeModal: (key: keyof UiState['modals']) => void;
  setWeekStart: (dateISO: string) => void;
  setViewMode: (mode: 'AIDE' | 'CLASS') => void;
  setSelectedClassId: (id: number | null) => void;
  setSelectedTimeSlot: (slot: { date: string; time: string; duration: number } | null) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  thisWeek: () => void;
  getWeekNumber: (dateISO: string) => number;
  getWeekDateRange: (dateISO: string) => string;
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

// Calculate ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Format date range for the week (Monday - Friday)
function formatWeekDateRange(mondayISO: string): string {
  const monday = new Date(mondayISO + 'T00:00:00Z');
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const startMonth = monthNames[monday.getUTCMonth()];
  const endMonth = monthNames[friday.getUTCMonth()];
  const startDay = monday.getUTCDate();
  const endDay = friday.getUTCDate();
  const year = friday.getUTCFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  selectedWeekStartISO: fmt(getMonday(new Date())),
  viewMode: 'AIDE',
  selectedClassId: null,
  selectedTimeSlot: null,
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
  setViewMode(mode) {
    set({ viewMode: mode });
  },
  setSelectedClassId(id) {
    set({ selectedClassId: id });
  },
  setSelectedTimeSlot(slot) {
    set({ selectedTimeSlot: slot });
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
  getWeekNumber(dateISO) {
    const date = new Date(dateISO + 'T00:00:00Z');
    return getWeekNumber(date);
  },
  getWeekDateRange(dateISO) {
    return formatWeekDateRange(dateISO);
  },
}));


