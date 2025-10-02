"""
T018: Contract test for PUT /api/assignments/{id}
Tests optimistic locking and assignment updates
"""
import pytest
from datetime import date, time


def test_update_assignment_success(client, sample_assignment):
    """Test PUT /api/assignments/{id} updates assignment successfully"""
    payload = {
        "status": "IN_PROGRESS",
        "version": 1  # Current version
    }
    
    response = client.put(f'/api/assignments/{sample_assignment.id}', json=payload)
    
    assert response.status_code == 200
    assert response.json['status'] == 'IN_PROGRESS'
    assert response.json['version'] == 2  # Incremented


def test_update_assignment_reassign_aide(client, sample_assignment, sample_aide):
    """Test PUT /api/assignments/{id} can reassign to different aide"""
    from api.models.teacher_aide import TeacherAide
    from api.models import db
    
    # Create second aide
    aide2 = TeacherAide(
        name="Mary Johnson",
        qualifications="ESL",
        colour_hex="#33C1FF"
    )
    db.session.add(aide2)
    db.session.commit()
    
    payload = {
        "aide_id": aide2.id,
        "version": 1
    }
    
    response = client.put(f'/api/assignments/{sample_assignment.id}', json=payload)
    
    assert response.status_code == 200
    assert response.json['aide_id'] == aide2.id


def test_update_assignment_optimistic_lock_conflict(client, sample_assignment):
    """Test PUT returns 409 when version mismatch (optimistic locking)"""
    payload = {
        "status": "IN_PROGRESS",
        "version": 999  # Wrong version
    }
    
    response = client.put(f'/api/assignments/{sample_assignment.id}', json=payload)
    
    assert response.status_code == 409
    assert 'error' in response.json
    assert 'version' in response.json['error'].lower() or 'conflict' in response.json['error'].lower()


def test_update_assignment_missing_version(client, sample_assignment):
    """Test PUT returns 400 when version is missing"""
    payload = {
        "status": "COMPLETE"
    }
    
    response = client.put(f'/api/assignments/{sample_assignment.id}', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'version' in response.json['error'].lower()


def test_update_assignment_invalid_status(client, sample_assignment):
    """Test PUT returns 400 for invalid status transition"""
    payload = {
        "status": "INVALID_STATUS",
        "version": 1
    }
    
    response = client.put(f'/api/assignments/{sample_assignment.id}', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_update_assignment_not_found(client):
    """Test PUT returns 404 for non-existent assignment"""
    payload = {
        "status": "COMPLETE",
        "version": 1
    }
    
    response = client.put('/api/assignments/99999', json=payload)
    
    assert response.status_code == 404
    assert 'error' in response.json


def test_update_assignment_creates_new_conflict(client, sample_assignment, sample_aide, sample_task):
    """Test PUT returns 409 when update would create time conflict"""
    from api.models.assignment import Assignment
    from api.models import db
    
    # Create another assignment at different time
    assignment2 = Assignment(
        task_id=sample_task.id,
        aide_id=sample_aide.id,
        date=date(2025, 10, 6),
        start_time=time(11, 0),
        end_time=time(12, 0),
        status='ASSIGNED',
        version=1
    )
    db.session.add(assignment2)
    db.session.commit()
    
    # Try to update first assignment to overlap with second
    payload = {
        "start_time": "11:30",  # Would overlap
        "end_time": "12:30",
        "version": 1
    }
    
    response = client.put(f'/api/assignments/{sample_assignment.id}', json=payload)
    
    assert response.status_code == 409
    assert 'error' in response.json
    assert 'conflict' in response.json['error'].lower()



