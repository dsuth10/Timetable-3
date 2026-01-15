import { api } from './api';
import { Request, TeacherRequestCreate, RequestStatus } from '../types';

export const requestsApi = {
    list: async (status?: RequestStatus): Promise<Request[]> => {
        const params = status ? { status } : {};
        const response = await api.get('/requests', { params });
        return response.data;
    },

    get: async (id: number): Promise<Request> => {
        const response = await api.get(`/requests/${id}`);
        return response.data;
    },

    create: async (data: TeacherRequestCreate): Promise<Request> => {
        const response = await api.post('/requests', data);
        return response.data;
    },

    update: async (id: number, data: Partial<Request>): Promise<Request> => {
        const response = await api.put(`/requests/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/requests/${id}`);
    },

    updateStatus: async (id: number, status: RequestStatus): Promise<Request> => {
        const response = await api.put(`/requests/${id}`, { status });
        return response.data;
    },
};
