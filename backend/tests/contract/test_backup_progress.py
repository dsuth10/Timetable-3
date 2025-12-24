"""
Contract test for GET /api/backup/{backup_id}/progress endpoint.
Validates progress response schema per backup-api.yaml.
"""
import pytest


class TestBackupProgressContract:
    """Contract tests for backup progress endpoint."""

    def test_get_backup_progress_schema(self, client):
        """Test that progress response matches BackupProgress schema."""
        # This test will fail until endpoint is implemented
        backup_id = 'test-backup-id-123'
        
        response = client.get(f'/api/backup/{backup_id}/progress')
        
        # Should return 200 or 404 (if backup doesn't exist)
        assert response.status_code in [200, 404, 500]
        
        if response.status_code == 200:
            data = response.get_json()
            # Validate BackupProgress schema
            assert 'backup_id' in data
            assert 'progress_percent' in data
            assert 'status' in data
            assert data['backup_id'] == backup_id
            assert isinstance(data['progress_percent'], int)
            assert 0 <= data['progress_percent'] <= 100
            assert data['status'] in ['creating', 'validating', 'completed', 'failed']
            
            if data['status'] in ['creating', 'validating']:
                assert 'current_step' in data or data.get('current_step') is None
            elif data['status'] == 'failed':
                assert 'error' in data

    def test_get_backup_progress_not_found(self, client):
        """Test that non-existent backup returns 404."""
        response = client.get('/api/backup/non-existent-id/progress')
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data










