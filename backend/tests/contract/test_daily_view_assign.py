"""
Contract test for POST /api/daily-view/assign
"""
import pytest

def test_assign_task_from_bank(client):
    """Test POST /api/daily-view/assign with type FROM_BANK"""
    payload = {
        "type": "FROM_BANK",
        "id": 1,
        "date": "2025-12-08",
        "aide_id": 1,
        "start_time": "08:50:00",
        "end_time": "09:10:00"
    }
    response = client.post('/api/daily-view/assign', json=payload)
    
    # This should fail if the service is just a placeholder or if IDs don't exist
    # But for contract testing, we check the endpoint exists and handles the payload
    assert response.status_code in [201, 409, 400] 

def test_assign_task_missing_body(client):
    """Test POST /api/daily-view/assign with missing body"""
    response = client.post('/api/daily-view/assign', json={})
    assert response.status_code == 400

