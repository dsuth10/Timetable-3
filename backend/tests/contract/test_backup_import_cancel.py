import pytest

def test_import_cancel_endpoint(client):
    """Test /api/backup/import/{id}/cancel endpoint."""
    import_id = "test-uuid"
    response = client.post(f'/api/backup/import/{import_id}/cancel')
    assert response.status_code in [200, 404, 400]
