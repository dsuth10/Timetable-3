"""
Contract test for GET /api/assignments/{id}/tooltip
Tests API compliance with Tooltip API contract
"""
import pytest
from datetime import date, time
from api.models.assignment import Assignment
from api.models.teacher_aide import TeacherAide

def test_get_tooltip_success(client, sample_assignment, sample_task, sample_classroom, sample_aide):
    """Test GET /api/assignments/{id}/tooltip returns correct structure and data"""
    response = client.get(f'/api/assignments/{sample_assignment.id}/tooltip')
    
    # This should fail initially (404 as route doesn't exist)
    assert response.status_code == 200
    data = response.json
    
    # Check top-level structure
    assert data['task_title'] == sample_task.title
    assert data['category'] == sample_task.category
    assert data['classroom']['name'] == sample_classroom.name
    assert data['start_time'] == "09:00"
    assert data['end_time'] == "10:00"
    assert "assigned_aides" in data
    assert sample_aide.name in data['assigned_aides']
    assert "recurrence" in data
    assert "notes" in data
    assert data['notes'] == sample_task.notes

def test_get_tooltip_not_found(client):
    """Test GET /api/assignments/{id}/tooltip returns 404 for non-existent assignment"""
    response = client.get('/api/assignments/99999/tooltip')
    assert response.status_code == 404
    assert 'error' in response.json

def test_get_tooltip_no_notes_placeholder(client, db_session, sample_task, sample_aide):
    """Test tooltip returns placeholder for empty notes"""
    sample_task.notes = None
    db_session.commit()
    
    assignment = Assignment(
        task_id=sample_task.id,
        aide_id=sample_aide.id,
        date=date(2025, 10, 6),
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='ASSIGNED'
    )
    db_session.add(assignment)
    db_session.commit()
    
    response = client.get(f'/api/assignments/{assignment.id}/tooltip')
    assert response.status_code == 200
    assert response.json['notes'] == "No notes provided"

def test_get_tooltip_no_aides_placeholder(client, db_session, sample_task):
    """Test tooltip returns 'None' placeholder for unassigned task"""
    assignment = Assignment(
        task_id=sample_task.id,
        aide_id=None,
        date=date(2025, 10, 6),
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='UNASSIGNED'
    )
    db_session.add(assignment)
    db_session.commit()
    
    response = client.get(f'/api/assignments/{assignment.id}/tooltip')
    assert response.status_code == 200
    assert response.json['assigned_aides'] == ["None"]

def test_get_tooltip_multiple_aides(client, db_session, sample_task, sample_aide):
    """Test tooltip lists all aides for same task/time/date"""
    # Create another aide
    aide2 = TeacherAide(name="Jane Doe", colour_hex="#33C1FF")
    db_session.add(aide2)
    db_session.flush()
    
    # First assignment
    asg1 = Assignment(
        task_id=sample_task.id,
        aide_id=sample_aide.id,
        date=date(2025, 10, 6),
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='ASSIGNED'
    )
    db_session.add(asg1)
    
    # Second assignment same task/time/date different aide
    asg2 = Assignment(
        task_id=sample_task.id,
        aide_id=aide2.id,
        date=date(2025, 10, 6),
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='ASSIGNED'
    )
    db_session.add(asg2)
    db_session.commit()
    
    response = client.get(f'/api/assignments/{asg1.id}/tooltip')
    assert response.status_code == 200
    assert "John Smith" in response.json['assigned_aides']
    assert "Jane Doe" in response.json['assigned_aides']
    assert len(response.json['assigned_aides']) == 2

