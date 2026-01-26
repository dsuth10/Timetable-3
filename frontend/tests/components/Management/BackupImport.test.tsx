import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackupManagement from '../../../src/components/Management/BackupManagement';
import { backupService } from '../../../src/services/backupService';

// Mock the backup API service
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

describe('BackupImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders import section', () => {
    render(<BackupManagement />);
    expect(screen.getByText(/import backup/i)).toBeInTheDocument();
  });

  it('allows file selection', () => {
    render(<BackupManagement />);
    // Switch to import tab
    fireEvent.click(screen.getByText(/import backup/i));
    
    const input = document.getElementById('import-file-upload') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    
    const file = new File(['{}'], 'test.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(input.files?.[0]).toBe(file);
  });

  it('validates file size (100MB limit)', async () => {
    render(<BackupManagement />);
    // Switch to import tab
    fireEvent.click(screen.getByText(/import backup/i));
    
    const input = document.getElementById('import-file-upload') as HTMLInputElement;
    
    // 101MB file
    const largeFile = new File(['a'.repeat(101 * 1024 * 1024)], 'large.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/exceeds 100mb limit/i)).toBeInTheDocument();
    });
  });
});
