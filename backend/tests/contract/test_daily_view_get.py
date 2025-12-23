"""
Contract test for GET /api/daily-view/{date}
"""
import pytest
from datetime import date

def test_get_daily_view_returns_structure(client, sample_aide):
    """Test GET /api/daily-view/{date} returns the expected JSON structure and data"""
    test_date = "2025-12-08"
    response = client.get(f'/api/daily-view/{test_date}')
    
    assert response.status_code == 200
    data = response.json
    assert 'aides' in data
    assert 'relief_pool' in data
    assert 'task_bank' in data
    assert 'timeline_config' in data
    assert isinstance(data['aides'], list)
    # This should fail because the placeholder returns an empty list
    assert len(data['aides']) > 0
    assert data['aides'][0]['name'] == sample_aide.name

def test_get_daily_view_invalid_date(client):
    """Test GET /api/daily-view/{date} with invalid date format"""
    response = client.get('/api/daily-view/invalid-date')
    assert response.status_code == 400
    assert 'error' in response.json

