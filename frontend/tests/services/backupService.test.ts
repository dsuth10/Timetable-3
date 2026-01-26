import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../src/services/api';
import { backupService } from '../../src/services/backupService';

vi.mock('../../src/services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('backupService import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validateBackup calls the correct endpoint', async () => {
    const mockFile = new File([''], 'test.json');
    mockedApi.post.mockResolvedValue({ data: { is_valid: true } });
    
    const result = await backupService.validateBackup(mockFile, 'json');
    
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/backup/validate',
      expect.any(FormData),
      expect.any(Object)
    );
    expect(result.is_valid).toBe(true);
  });

  it('importBackup calls the correct endpoint', async () => {
    const mockFile = new File([''], 'test.json');
    mockedApi.post.mockResolvedValue({ data: { import_id: 'test-id' } });
    
    const result = await backupService.importBackup(mockFile, 'json');
    
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/backup/import',
      expect.any(FormData),
      expect.any(Object)
    );
    expect(result.import_id).toBe('test-id');
  });

  it('getImportProgress calls the correct endpoint', async () => {
    mockedApi.get.mockResolvedValue({ data: { status: 'completed' } });
    
    const result = await backupService.getImportProgress('test-id');
    expect(mockedApi.get).toHaveBeenCalledWith('/backup/import/test-id/progress');
  });
});
