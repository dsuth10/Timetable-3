import { api } from './api';
import type { 
  BackupRequest, 
  BackupResponse, 
  BackupProgress, 
  ValidationResponse, 
  ImportResponse, 
  DatabaseStatus 
} from '../types/backup';

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
   * Validate a backup file before import.
   */
  async validateBackup(file: File, format: string): Promise<ValidationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    
    const response = await api.post<ValidationResponse>('/backup/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Start an import job.
   */
  async importBackup(file: File, format: string): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    
    const response = await api.post<ImportResponse>('/backup/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get progress for an import job.
   */
  async getImportProgress(importId: string): Promise<BackupProgress> {
    const response = await api.get<BackupProgress>(`/backup/import/${importId}/progress`);
    return response.data;
  },

  /**
   * Poll for import progress.
   */
  pollImportProgress(
    importId: string,
    onProgress: (progress: BackupProgress) => void,
    onError: (error: Error) => void,
    interval: number = 1000
  ): () => void {
    let pollInterval: NodeJS.Timeout | null = null;
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const progress = await this.getImportProgress(importId);
        onProgress(progress);

        if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
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

    poll();
    pollInterval = setInterval(poll, interval);

    return stopPolling;
  },

  /**
   * Cancel an import in progress.
   */
  async cancelImport(importId: string): Promise<void> {
    await api.post(`/backup/import/${importId}/cancel`);
  },

  /**
   * Check if database is empty.
   */
  async checkDatabaseEmpty(): Promise<DatabaseStatus> {
    const response = await api.get<DatabaseStatus>('/backup/check-database');
    return response.data;
  },

  /**
   * Poll for backup progress updates.
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
            format: (progress as any).format || 'sql', // Fallback
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

