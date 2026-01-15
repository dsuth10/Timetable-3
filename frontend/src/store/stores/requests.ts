import { create } from 'zustand';
import { requestsApi } from '../../services/requestsApi';
import type { Request, TeacherRequestCreate, RequestStatus } from '../../types';

type RequestsState = {
    requests: Request[];
    loading: boolean;
    error?: string;
    fetchRequests: (status?: RequestStatus) => Promise<void>;
    createRequest: (data: TeacherRequestCreate) => Promise<Request>;
    updateRequestStatus: (id: number, status: RequestStatus) => Promise<void>;
    deleteRequest: (id: number) => Promise<void>;
};

export const useRequestsStore = create<RequestsState>((set, get) => ({
    requests: [],
    loading: false,

    fetchRequests: async (status) => {
        try {
            set({ loading: true, error: undefined });
            const data = await requestsApi.list(status);
            set({ requests: data });
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch requests' });
        } finally {
            set({ loading: false });
        }
    },

    createRequest: async (data) => {
        try {
            set({ loading: true, error: undefined });
            const newRequest = await requestsApi.create(data);
            set((state) => ({ requests: [newRequest, ...state.requests] }));
            return newRequest;
        } catch (e: any) {
            set({ error: e.message || 'Failed to create request' });
            throw e;
        } finally {
            set({ loading: false });
        }
    },

    updateRequestStatus: async (id, status) => {
        const requestsBefore = get().requests;
        try {
            // Optimistic update
            set((state) => ({
                requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)),
            }));

            await requestsApi.updateStatus(id, status);
        } catch (e: any) {
            // Rollback
            set({ requests: requestsBefore, error: e.message || 'Failed to update request status' });
            throw e;
        }
    },

    deleteRequest: async (id) => {
        const requestsBefore = get().requests;
        try {
            // Optimistic delete
            set((state) => ({
                requests: state.requests.filter((r) => r.id !== id),
            }));

            await requestsApi.delete(id);
        } catch (e: any) {
            // Rollback
            set({ requests: requestsBefore, error: e.message || 'Failed to delete request' });
            throw e;
        }
    },
}));
