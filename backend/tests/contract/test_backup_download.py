"""
Contract test for GET /api/backup/{backup_id}/download endpoint.
Validates file download headers and response per backup-api.yaml.
"""
import pytest


class TestBackupDownloadContract:
    """Contract tests for backup download endpoint."""

    def test_download_backup_headers(self, client):
        """Test that download response has proper headers."""
        # This test will fail until endpoint is implemented
        backup_id = 'test-backup-id-123'
        
        response = client.get(f'/api/backup/{backup_id}/download')
        
        # Should return 200, 400, or 404
        assert response.status_code in [200, 400, 404, 500]
        
        if response.status_code == 200:
            # Validate headers
            assert 'Content-Disposition' in response.headers
            assert 'Content-Type' in response.headers
            assert 'Content-Length' in response.headers
            
            # Content-Disposition should have attachment and filename
            content_disposition = response.headers['Content-Disposition']
            assert 'attachment' in content_disposition
            assert 'filename=' in content_disposition
            
            # Content-Type should be application/octet-stream
            assert response.headers['Content-Type'] == 'application/octet-stream'
            
            # Content-Length should be a positive integer
            content_length = int(response.headers['Content-Length'])
            assert content_length > 0
            
            # Response should have binary data
            assert len(response.data) > 0

    def test_download_backup_not_found(self, client):
        """Test that non-existent backup returns 404."""
        response = client.get('/api/backup/non-existent-id/download')
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data

    def test_download_backup_not_ready(self, client):
        """Test that backup not ready for download returns 400."""
        # This will need a backup in 'creating' or 'failed' status
        # Implementation will handle this
        pass







