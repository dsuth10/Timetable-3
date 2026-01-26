import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackupManagement from '../../../src/components/Management/BackupManagement';
import { backupService } from '../../../src/services/backupService';

vi.mock('../../../src/services/backupService', () => ({
  backupService: {
    createBackup: vi.fn(),
    getBackupProgress: vi.fn(),
    downloadBackup: vi.fn(),
    validateBackup: vi.fn(),
    importBackup: vi.fn(),
    pollImportProgress: vi.fn(),
    cancelImport: vi.fn(),
    checkDatabaseEmpty: vi.fn().mockResolvedValue({ is_empty: true, tables_checked: [], non_empty_tables: [] }),
    pollBackupProgress: vi.fn(),
  }
}));

describe('ImportSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays success summary after import', async () => {
    const mockPollProgress = vi.mocked(backupService.pollImportProgress);
    mockPollProgress.mockResolvedValue({
      import_id: 'test-id',
      status: 'completed',
      progress_percent: 100,
      records_imported: { teacher_aides: 10, tasks: 50 }
    });

    render(<BackupManagement />);
    // ...
  });
});
