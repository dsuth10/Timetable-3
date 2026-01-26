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

describe('ImportProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays progress bar during import', async () => {
    const mockImportBackup = vi.mocked(backupService.importBackup);
    const mockPollProgress = vi.mocked(backupService.pollImportProgress);
    
    mockImportBackup.mockResolvedValue({ import_id: 'test-import-id', status: 'validating' });
    mockPollProgress.mockResolvedValue({
      import_id: 'test-import-id',
      status: 'importing',
      progress_percent: 45,
      current_step: 'Importing table 3 of 8'
    });

    render(<BackupManagement />);
    
    // Trigger import (mock implementation should have a button or something)
    // For now we're just checking if progress elements exist when status is active
    // This will be more specific once implementation exists
  });
});
