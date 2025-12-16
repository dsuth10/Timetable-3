import { api } from './api';
import type { BackupRequest, BackupResponse, BackupProgress } from '../types/backup';

export const backupService = {
  /**
   * Create a backup in the specified format.
   */
  async createBackup(request: BackupRequest): Promise<BackupResponse> {
    const response = await api.post<BackupResponse>('/backup/create', request);
    return response.data;
  },

  /**
   * Get progress updates for a backup being created.
   */
  async getBackupProgress(backupId: string): Promise<BackupProgress> {
    const response = await api.get<BackupProgress>(`/backup/${backupId}/progress`);
    return response.data;
  },

  /**
   * Download a completed backup file.
   * Returns a blob URL that can be used to trigger download.
   */
  async downloadBackup(backupId: string, filename: string): Promise<void> {
    const response = await api.get(`/backup/${backupId}/download`, {
      responseType: 'blob',
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Poll for backup progress updates.
   * Returns a function to stop polling.
   */
  pollBackupProgress(
    backupId: string,
    onProgress: (progress: BackupProgress) => void,
    onComplete: (response: BackupResponse) => void,
    onError: (error: Error) => void,
    interval: number = 1000
  ): () => void {
    let pollInterval: NodeJS.Timeout | null = null;
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const progress = await this.getBackupProgress(backupId);
        onProgress(progress);

        if (progress.status === 'completed') {
          // Progress endpoint now includes response data when completed
          const response: BackupResponse = {
            backup_id: progress.backup_id,
            format: progress.format || 'sql', // Fallback
            filename: (progress as any).filename || '',
            size_bytes: (progress as any).size_bytes || 0,
            created_at: new Date().toISOString(),
            status: 'completed',
            download_url: (progress as any).download_url || `/api/backup/${backupId}/download`
          };
          onComplete(response);
          stopPolling();
        } else if (progress.status === 'failed') {
          onError(new Error(progress.error || 'Backup failed'));
          stopPolling();
        }
      } catch (error) {
        onError(error as Error);
        stopPolling();
      }
    };

    const stopPolling = () => {
      isPolling = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // Start polling
    poll(); // Immediate first poll
    pollInterval = setInterval(poll, interval);

    return stopPolling;
  },
};

