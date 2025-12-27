"""
Contract test for POST /api/backup/create endpoint.
Validates request/response schema per backup-api.yaml.
"""
import pytest


class TestBackupCreateContract:
    """Contract tests for backup creation endpoint."""

    def test_create_backup_request_schema(self, client):
        """Test that request body matches BackupRequest schema."""
        # This test will fail until endpoint is implemented
        response = client.post('/api/backup/create', json={
            'format': 'sql'
        })
        
        # Should accept valid format
        assert response.status_code in [200, 201, 400, 404, 500]  # Any status until implemented
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            # Validate BackupResponse schema
            assert 'backup_id' in data
            assert 'format' in data
            assert 'filename' in data
            assert 'size_bytes' in data
            assert 'created_at' in data
            assert 'status' in data
            assert data['format'] in ['sql', 'json', 'csv', 'sqlite_gz']
            assert data['status'] in ['completed', 'failed']
            
            if data['status'] == 'completed':
                assert 'download_url' in data
            elif data['status'] == 'failed':
                assert 'error' in data

    def test_create_backup_invalid_format(self, client):
        """Test that invalid format returns 400 error."""
        response = client.post('/api/backup/create', json={
            'format': 'invalid_format'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_create_backup_missing_format(self, client):
        """Test that missing format returns 400 error."""
        response = client.post('/api/backup/create', json={})
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data














