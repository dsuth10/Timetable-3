import pytest
import io

def test_import_backup_endpoint_success(client):
    """Test /api/backup/import endpoint success."""
    data = {
        'file': (io.BytesIO(b'{"teacher_aides": [], "tasks": [], "assignments": [], "classrooms": [], "absences": [], "availability": [], "requests": [], "recurring_series": [], "metadata": {"schema_version": "123"}}'), 'test.json'),
        'format': 'json'
    }
    response = client.post('/api/backup/import', data=data, content_type='multipart/form-data')
    # Should be 200 if started successfully
    assert response.status_code == 200
    res_data = response.get_json()
    assert 'import_id' in res_data
    assert 'status' in res_data

def test_import_backup_endpoint_not_empty(client, db_session, sample_aide):
    """Test /api/backup/import endpoint fails when DB not empty."""
    # Ensure DB is not empty
    data = {
        'file': (io.BytesIO(b'{"teacher_aides": []}'), 'test.json'),
        'format': 'json'
    }
    response = client.post('/api/backup/import', data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    assert "not empty" in response.get_json()['error']
