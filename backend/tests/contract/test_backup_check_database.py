import pytest

def test_check_database_endpoint(client):
    """Test /api/backup/check-database endpoint."""
    response = client.get('/api/backup/check-database')
    assert response.status_code == 200
    data = response.get_json()
    assert 'is_empty' in data
    assert 'tables_checked' in data
