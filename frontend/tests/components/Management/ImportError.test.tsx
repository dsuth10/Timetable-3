import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('ImportError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays error message on validation failure', async () => {
    const mockValidate = vi.mocked(backupService.validateBackup);
    mockValidate.mockResolvedValue({ is_valid: false, error: 'Invalid schema' });

    render(<BackupManagement />);
    // ... trigger validation
  });
});
