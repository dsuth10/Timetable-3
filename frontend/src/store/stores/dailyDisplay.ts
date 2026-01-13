import { create } from 'zustand';
import type { DailyViewData } from '../../types';

// The dailyDisplay store is now primarily a cache for the DailyViewData
// if needed for component communication. However, TanStack Query handles 
// fetching and mutations now. We'll keep it minimal or remove if possible.

type DailyDisplayState = {
  data: DailyViewData | null;
  loading: boolean;
  error?: string;
  // Temporary: we might still need to set data from TanStack Query side effects 
  // if other components depend on this store.
  setData: (data: DailyViewData | null) => void;
};

export const useDailyDisplayStore = create<DailyDisplayState>((set) => ({
  data: null,
  loading: false,
  setData: (data) => set({ data }),
}));



