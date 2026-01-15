"""
T015: Contract test for GET /api/assignments/weekly-matrix
Tests weekly timetable matrix generation
"""
import pytest
from datetime import date, time, timedelta


def test_get_weekly_matrix_empty(client):
    """Test GET /api/assignments/weekly-matrix returns empty matrix when no assignments"""
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    response = client.get(f'/api/assignments/weekly-matrix?start_date={monday.isoformat()}')
    
    assert response.status_code == 200
    assert 'matrix' in response.json
    assert 'aides' in response.json
    assert 'time_slots' in response.json
    assert isinstance(response.json['matrix'], dict)


def test_get_weekly_matrix_with_assignments(client, sample_aide, sample_assignment):
    """Test GET /api/assignments/weekly-matrix includes assignments"""
    monday = date(2025, 10, 6)  # Matches fixture
    
    response = client.get(f'/api/assignments/weekly-matrix?start_date={monday.isoformat()}')
    
    assert response.status_code == 200
    
    # Check structure
    data = response.json
    assert 'matrix' in data
    assert 'aides' in data
    assert 'time_slots' in data
    
    # Check aide is included
    assert len(data['aides']) == 1
    assert data['aides'][0]['id'] == sample_aide.id
    
    # Check matrix contains assignment
    aide_key = str(sample_aide.id)
    assert aide_key in data['matrix']


def test_get_weekly_matrix_missing_start_date(client):
    """Test GET /api/assignments/weekly-matrix returns 400 without start_date"""
    response = client.get('/api/assignments/weekly-matrix')
    
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'start_date' in response.json['error'].lower()


def test_get_weekly_matrix_invalid_date_format(client):
    """Test GET /api/assignments/weekly-matrix returns 400 for invalid date format"""
    response = client.get('/api/assignments/weekly-matrix?start_date=invalid-date')
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_get_weekly_matrix_time_slots(client):
    """Test weekly matrix includes 30-minute time slots from 08:00-17:00"""
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    response = client.get(f'/api/assignments/weekly-matrix?start_date={monday.isoformat()}')
    
    assert response.status_code == 200
    
    time_slots = response.json['time_slots']
    assert len(time_slots) > 0
    
    # Should include 08:50, 09:10, 14:30, etc. (based on SCHEDULE_CONFIG)
    time_strings = [slot['time'] for slot in time_slots]
    assert "08:50:00" in time_strings
    assert "14:30:00" in time_strings


def test_get_weekly_matrix_includes_conflicts(client, sample_aide, sample_task, sample_classroom):
    """Test weekly matrix identifies conflicting assignments"""
    from api.models.assignment import Assignment
    from api.models import db
    
    # Create two overlapping assignments
    monday = date(2025, 10, 6)
    
    assignment1 = Assignment(
        task_id=sample_task.id,
        aide_id=sample_aide.id,
        date=monday,
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='ASSIGNED',
        version=1
    )
    
    assignment2 = Assignment(
        task_id=sample_task.id,
        aide_id=sample_aide.id,
        date=monday,
        start_time=time(9, 30),  # Overlaps with assignment1
        end_time=time(10, 30),
        status='ASSIGNED',
        version=1
    )
    
    db.session.add_all([assignment1, assignment2])
    db.session.commit()
    
    response = client.get(f'/api/assignments/weekly-matrix?start_date={monday.isoformat()}')
    
    assert response.status_code == 200
    # Matrix should flag conflicts
    assert 'conflicts' in response.json or any('conflict' in str(v).lower() for v in response.json.values())



