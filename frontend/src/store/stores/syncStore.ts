import { create } from 'zustand';

type SyncState = {
    version: number;
    lastUpdated: Date;
    triggerGlobalRefresh: () => void;
};

export const useSyncStore = create<SyncState>((set) => ({
    version: 0,
    lastUpdated: new Date(),
    triggerGlobalRefresh: () => set((state) => ({
        version: state.version + 1,
        lastUpdated: new Date()
    })),
}));
