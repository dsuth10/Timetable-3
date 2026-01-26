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
  status: 'creating' | 'validating' | 'importing' | 'verifying' | 'completed' | 'failed' | 'cancelled';
  current_step?: string; // e.g., "Processing table 3 of 8"
  error?: string; // Only present if status is 'failed'
  records_imported?: Record<string, number>;
}

export interface ValidationResponse {
  is_valid: boolean;
  error?: string;
  metadata: {
    format_type: string;
    file_size_bytes: number;
    tables_present?: string[];
    total_records?: number;
  };
}

export interface ImportResponse {
  import_id: string;
  status: string;
  error?: string;
}

export interface DatabaseStatus {
  is_empty: boolean;
  tables_checked: string[];
  non_empty_tables: string[];
}






















