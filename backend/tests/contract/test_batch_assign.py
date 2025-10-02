"""
T017: Contract test for POST /api/assignments/batch
Tests batch assignment creation for recurring tasks
"""
import pytest
from datetime import date, timedelta, time


def test_batch_assign_multi_day_success(client, sample_task, sample_aide):
    """Test POST /api/assignments/batch creates multiple assignments"""
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    payload = {
        "task_id": sample_task.id,
        "aide_id": sample_aide.id,
        "dates": [
            monday.isoformat(),
            (monday + timedelta(days=2)).isoformat(),
            (monday + timedelta(days=4)).isoformat()
        ],
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments/batch', json=payload)
    
    assert response.status_code == 201
    assert 'assignments' in response.json
    assert len(response.json['assignments']) == 3
    
    for assignment in response.json['assignments']:
        assert assignment['task_id'] == sample_task.id
        assert assignment['aide_id'] == sample_aide.id


def test_batch_assign_empty_dates(client, sample_task, sample_aide):
    """Test POST /api/assignments/batch returns 400 for empty dates list"""
    payload = {
        "task_id": sample_task.id,
        "aide_id": sample_aide.id,
        "dates": [],
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments/batch', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_batch_assign_partial_conflicts(client, sample_task, sample_aide):
    """Test POST /api/assignments/batch handles partial conflicts"""
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    # Create an existing assignment on Monday
    from api.models.assignment import Assignment
    from api.models import db
    
    existing = Assignment(
        task_id=sample_task.id,
        aide_id=sample_aide.id,
        date=monday,
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='ASSIGNED',
        version=1
    )
    db.session.add(existing)
    db.session.commit()
    
    # Try to batch assign including Monday
    payload = {
        "task_id": sample_task.id,
        "aide_id": sample_aide.id,
        "dates": [
            monday.isoformat(),  # Conflict
            (monday + timedelta(days=1)).isoformat(),  # OK
            (monday + timedelta(days=2)).isoformat()   # OK
        ],
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments/batch', json=payload)
    
    # Should return 207 Multi-Status or include conflict details
    assert response.status_code in [201, 207, 409]
    
    if response.status_code == 201:
        # Partial success - check for conflict warnings
        assert 'conflicts' in response.json or 'warnings' in response.json


def test_batch_assign_unassign_mode(client, sample_task):
    """Test POST /api/assignments/batch with aide_id=null creates unassigned tasks"""
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    payload = {
        "task_id": sample_task.id,
        "aide_id": None,
        "dates": [
            monday.isoformat(),
            (monday + timedelta(days=1)).isoformat()
        ],
        "start_time": "09:00",
        "end_time": "10:00"
    }
    
    response = client.post('/api/assignments/batch', json=payload)
    
    assert response.status_code == 201
    for assignment in response.json['assignments']:
        assert assignment['aide_id'] is None
        assert assignment['status'] == 'UNASSIGNED'

