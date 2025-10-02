"""
T012: Contract test for POST /api/aides/{id}/availability
Tests availability creation and validation
"""
import pytest


def test_create_availability_success(client, sample_aide):
    """Test POST /api/aides/{id}/availability creates availability successfully"""
    payload = {
        "weekday": "TU",
        "start_time": "09:00",
        "end_time": "15:00"
    }
    
    response = client.post(f'/api/aides/{sample_aide.id}/availability', json=payload)
    
    assert response.status_code == 201
    assert response.json['weekday'] == "TU"
    assert response.json['start_time'] == "09:00:00"
    assert response.json['end_time'] == "15:00:00"
    assert response.json['aide_id'] == sample_aide.id


def test_create_availability_invalid_weekday(client, sample_aide):
    """Test POST returns 400 for invalid weekday"""
    payload = {
        "weekday": "XX",
        "start_time": "09:00",
        "end_time": "15:00"
    }
    
    response = client.post(f'/api/aides/{sample_aide.id}/availability', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_availability_end_before_start(client, sample_aide):
    """Test POST returns 400 when end_time is before start_time"""
    payload = {
        "weekday": "MO",
        "start_time": "15:00",
        "end_time": "09:00"
    }
    
    response = client.post(f'/api/aides/{sample_aide.id}/availability', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_availability_duplicate_weekday(client, sample_aide, sample_availability):
    """Test POST returns 409 for duplicate weekday availability"""
    payload = {
        "weekday": "MO",  # Already exists in fixture
        "start_time": "10:00",
        "end_time": "14:00"
    }
    
    response = client.post(f'/api/aides/{sample_aide.id}/availability', json=payload)
    
    assert response.status_code == 409
    assert 'error' in response.json
    assert 'already exists' in response.json['error'].lower() or 'duplicate' in response.json['error'].lower()


def test_create_availability_nonexistent_aide(client):
    """Test POST returns 404 for non-existent aide"""
    payload = {
        "weekday": "MO",
        "start_time": "09:00",
        "end_time": "15:00"
    }
    
    response = client.post('/api/aides/99999/availability', json=payload)
    
    assert response.status_code == 404
    assert 'error' in response.json


def test_get_aide_availability(client, sample_aide, sample_availability):
    """Test GET /api/aides/{id}/availability returns all availability slots"""
    response = client.get(f'/api/aides/{sample_aide.id}/availability')
    
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 1
    assert response.json[0]['weekday'] == 'MO'



