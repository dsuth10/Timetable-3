import { api } from './api';
import type {
  ID,
  Assignment,
  ReliefPoolResponse,
  ReliefPoolCountResponse,
  ReliefPoolReassignRequest,
  ReliefPoolDismissRequest,
} from '../types';

interface ReassignResponse extends Assignment {}

interface DismissResponse {
  id: ID;
  status: 'dismissed';
  message: string;
}

export const reliefPoolApi = {
  /**
   * Get all Relief Pool tasks, optionally filtered by date.
   */
  getAll(options?: { date?: string; include_expired?: boolean }): Promise<ReliefPoolResponse> {
    const params = new URLSearchParams();
    if (options?.date) params.set('date', options.date);
    if (options?.include_expired) params.set('include_expired', 'true');
    
    const query = params.toString();
    const url = query ? `/relief-pool?${query}` : '/relief-pool';
    
    return api.get(url).then((r) => r.data as ReliefPoolResponse);
  },

  /**
   * Get count of pending Relief Pool tasks (for badge display).
   */
  getCount(): Promise<ReliefPoolCountResponse> {
    return api.get('/relief-pool/count').then((r) => r.data as ReliefPoolCountResponse);
  },

  /**
   * Reassign a Relief Pool task to a new aide.
   */
  reassign(
    assignmentId: ID,
    payload: ReliefPoolReassignRequest
  ): Promise<ReassignResponse> {
    return api
      .post(`/relief-pool/${assignmentId}/reassign`, payload)
      .then((r) => r.data as ReassignResponse);
  },

  /**
   * Dismiss a Relief Pool task (mark as not needing coverage).
   */
  dismiss(assignmentId: ID, payload: ReliefPoolDismissRequest): Promise<DismissResponse> {
    return api
      .post(`/relief-pool/${assignmentId}/dismiss`, payload)
      .then((r) => r.data as DismissResponse);
  },
};














