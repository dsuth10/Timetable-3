import { api } from './api';

export const adminApi = {
    resetDb: async () => {
        const response = await api.post('/admin/reset-db');
        return response.data;
    },
};
