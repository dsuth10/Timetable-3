import pytest
import io

def test_validate_backup_endpoint_success(client):
    """Test /api/backup/validate endpoint success."""
    data = {
        'file': (io.BytesIO(b"-- SQL\nCREATE TABLE test(id INT);"), 'test.sql'),
        'format': 'sql'
    }
    response = client.post('/api/backup/validate', data=data, content_type='multipart/form-data')
    assert response.status_code == 200
    res_data = response.get_json()
    assert 'is_valid' in res_data
    assert 'metadata' in res_data

def test_validate_backup_endpoint_no_file(client):
    """Test /api/backup/validate endpoint with no file."""
    response = client.post('/api/backup/validate', data={'format': 'sql'})
    assert response.status_code == 400
    assert 'error' in response.get_json()
