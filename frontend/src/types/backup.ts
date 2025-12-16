// Backup-related TypeScript types

export type BackupFormat = 'sql' | 'json' | 'csv' | 'sqlite_gz';

export interface BackupRequest {
  format: BackupFormat;
}

export interface BackupResponse {
  backup_id: string;
  format: BackupFormat;
  filename: string;
  size_bytes: number;
  created_at: string; // ISO 8601 timestamp
  status: 'completed' | 'failed';
  error?: string;
  download_url?: string; // Only present if status is 'completed'
}

export interface BackupProgress {
  backup_id: string;
  progress_percent: number; // 0-100
  status: 'creating' | 'validating' | 'completed' | 'failed';
  current_step?: string; // e.g., "Processing table 3 of 8"
  error?: string; // Only present if status is 'failed'
}

