import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackupManagement from '../../src/components/Management/BackupManagement';
import * as backupService from '../../src/services/backupService';

// Mock the backup API service
vi.mock('../../src/services/backupService', () => ({
  createBackup: vi.fn(),
  getBackupProgress: vi.fn(),
  downloadBackup: vi.fn(),
}));

describe('BackupManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders format selector', () => {
    render(<BackupManagement />);
    
    // Should have format selection options
    expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
  });

  it('renders create backup button', () => {
    render(<BackupManagement />);
    
    const createButton = screen.getByRole('button', { name: /create backup/i });
    expect(createButton).toBeInTheDocument();
  });

  it('allows format selection before creating backup', () => {
    render(<BackupManagement />);
    
    const formatSelector = screen.getByLabelText(/format/i);
    expect(formatSelector).toBeInTheDocument();
    
    // Should be able to select format
    fireEvent.change(formatSelector, { target: { value: 'sql' } });
    expect(formatSelector).toHaveValue('sql');
  });

  it('creates backup when button is clicked', async () => {
    const mockCreateBackup = vi.mocked(backupService.createBackup);
    mockCreateBackup.mockResolvedValue({
      backup_id: 'test-backup-123',
      format: 'sql',
      filename: 'timetable_backup_sql_2025-12-16_14-30-45.sql',
      size_bytes: 1024,
      created_at: '2025-12-16T14:30:45Z',
      status: 'completed',
      download_url: '/api/backup/test-backup-123/download',
    });

    render(<BackupManagement />);
    
    // Select format
    const formatSelector = screen.getByLabelText(/format/i);
    fireEvent.change(formatSelector, { target: { value: 'sql' } });
    
    // Click create button
    const createButton = screen.getByRole('button', { name: /create backup/i });
    fireEvent.click(createButton);
    
    // Should call createBackup
    await waitFor(() => {
      expect(mockCreateBackup).toHaveBeenCalledWith({ format: 'sql' });
    });
  });

  it('displays progress indicator during backup creation', async () => {
    const mockCreateBackup = vi.mocked(backupService.createBackup);
    const mockGetProgress = vi.mocked(backupService.getBackupProgress);
    
    mockCreateBackup.mockResolvedValue({
      backup_id: 'test-backup-123',
      format: 'sql',
      filename: '',
      size_bytes: 0,
      created_at: '2025-12-16T14:30:45Z',
      status: 'completed',
    });
    
    mockGetProgress.mockResolvedValue({
      backup_id: 'test-backup-123',
      progress_percent: 50,
      status: 'creating',
      current_step: 'Processing table 3 of 8',
    });

    render(<BackupManagement />);
    
    const createButton = screen.getByRole('button', { name: /create backup/i });
    fireEvent.click(createButton);
    
    // Should show progress indicator
    await waitFor(() => {
      expect(screen.getByText(/creating backup/i)).toBeInTheDocument();
    });
  });

  it('displays error message on backup failure', async () => {
    const mockCreateBackup = vi.mocked(backupService.createBackup);
    mockCreateBackup.mockRejectedValue(new Error('Database locked'));

    render(<BackupManagement />);
    
    const createButton = screen.getByRole('button', { name: /create backup/i });
    fireEvent.click(createButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
    
    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('displays download link when backup completes', async () => {
    const mockCreateBackup = vi.mocked(backupService.createBackup);
    mockCreateBackup.mockResolvedValue({
      backup_id: 'test-backup-123',
      format: 'sql',
      filename: 'timetable_backup_sql_2025-12-16_14-30-45.sql',
      size_bytes: 1024,
      created_at: '2025-12-16T14:30:45Z',
      status: 'completed',
      download_url: '/api/backup/test-backup-123/download',
    });

    render(<BackupManagement />);
    
    const createButton = screen.getByRole('button', { name: /create backup/i });
    fireEvent.click(createButton);
    
    // Should show download link
    await waitFor(() => {
      expect(screen.getByText(/download/i)).toBeInTheDocument();
    });
  });

  it('allows retry after error', async () => {
    const mockCreateBackup = vi.mocked(backupService.createBackup);
    mockCreateBackup
      .mockRejectedValueOnce(new Error('Database locked'))
      .mockResolvedValueOnce({
        backup_id: 'test-backup-123',
        format: 'sql',
        filename: 'timetable_backup_sql_2025-12-16_14-30-45.sql',
        size_bytes: 1024,
        created_at: '2025-12-16T14:30:45Z',
        status: 'completed',
        download_url: '/api/backup/test-backup-123/download',
      });

    render(<BackupManagement />);
    
    const createButton = screen.getByRole('button', { name: /create backup/i });
    fireEvent.click(createButton);
    
    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
    
    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    
    // Should retry backup creation
    await waitFor(() => {
      expect(mockCreateBackup).toHaveBeenCalledTimes(2);
    });
  });
});

