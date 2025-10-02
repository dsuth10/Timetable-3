"""
T016: Contract test for POST /api/assignments
Tests assignment creation and conflict detection
"""
import pytest
from datetime import date, time


def test_create_assignment_success(client, sample_task, sample_aide):
    """Test POST /api/assignments creates assignment successfully"""
    payload = {
        "task_id": sample_task.id,
        "aide_id": sample_aide.id,
        "date": "2025-10-13",
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments', json=payload)
    
    assert response.status_code == 201
    assert response.json['task_id'] == sample_task.id
    assert response.json['aide_id'] == sample_aide.id
    assert response.json['status'] == 'ASSIGNED'
    assert response.json['version'] == 1


def test_create_assignment_unassigned(client, sample_task):
    """Test POST /api/assignments creates unassigned task (aide_id is null)"""
    payload = {
        "task_id": sample_task.id,
        "aide_id": None,
        "date": "2025-10-13",
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments', json=payload)
    
    assert response.status_code == 201
    assert response.json['aide_id'] is None
    assert response.json['status'] == 'UNASSIGNED'


def test_create_assignment_time_conflict(client, sample_task, sample_aide):
    """Test POST returns 409 when assignment conflicts with existing assignment"""
    # Create first assignment
    payload1 = {
        "task_id": sample_task.id,
        "aide_id": sample_aide.id,
        "date": "2025-10-13",
        "start_time": "09:00",
        "end_time": "10:00"
    }
    client.post('/api/assignments', json=payload1)
    
    # Try to create overlapping assignment
    payload2 = {
        "task_id": sample_task.id,
        "aide_id": sample_aide.id,
        "date": "2025-10-13",
        "start_time": "09:30",  # Overlaps
        "end_time": "10:30"
    }
    
    response = client.post('/api/assignments', json=payload2)
    
    assert response.status_code == 409
    assert 'error' in response.json
    assert 'conflict' in response.json['error'].lower()
    assert 'conflicts' in response.json  # Should include conflict details


def test_create_assignment_outside_availability(client, sample_task, sample_aide, sample_availability):
    """Test POST returns 409 when assignment is outside aide's availability"""
    # sample_availability is Monday 08:00-16:00
    # Try to assign on Tuesday (not available)
    payload = {
        "task_id": sample_task.id,
        "aide_id": sample_aide.id,
        "date": "2025-10-07",  # Tuesday
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments', json=payload)
    
    assert response.status_code == 409
    assert 'error' in response.json
    assert 'availability' in response.json['error'].lower() or 'not available' in response.json['error'].lower()


def test_create_assignment_missing_task_id(client, sample_aide):
    """Test POST returns 400 when task_id is missing"""
    payload = {
        "aide_id": sample_aide.id,
        "date": "2025-10-13",
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_assignment_invalid_date(client, sample_task, sample_aide):
    """Test POST returns 400 for invalid date format"""
    payload = {
        "task_id": sample_task.id,
        "aide_id": sample_aide.id,
        "date": "invalid-date",
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json



