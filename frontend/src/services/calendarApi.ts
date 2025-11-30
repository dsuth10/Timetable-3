import { api } from './api';

export interface ExportParams {
  aide_id?: number;
  start_date?: string;
  end_date?: string;
}

export const calendarApi = {
  export: async (params: ExportParams): Promise<Blob> => {
    const response = await api.get('/calendar/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  exportPdf: async (params: ExportParams): Promise<Blob> => {
    const response = await api.get('/calendar/export-pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
