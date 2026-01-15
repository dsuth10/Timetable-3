"""
T022: Integration test - Conflict detection
Tests collision detection from quickstart.md step 6
"""
import pytest
from datetime import date, time, timedelta


def test_time_overlap_conflict_detection(client):
    """
    Test conflict detection when assignments overlap in time
    
    Scenario from quickstart.md step 6:
    1. Aide has assignment 10:00-11:00
    2. Try to assign same aide to 10:30-11:30 (overlap)
    3. Verify 409 Conflict with detailed error
    """
    
    # Setup aide with availability
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#FF0000"}).json
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "MO", "start_time": "08:00", "end_time": "16:00"
    })
    
    # Create classroom and tasks
    classroom = client.post('/api/classrooms', json={"name": "Room 101", "room_number": "101", "teacher": "Test Teacher", "capacity": 25}).json
    
    task1 = client.post('/api/tasks', json={
        "title": "Task 1",
        "category": "CLASS_SUPPORT",
        "start_time": "10:00",
        "end_time": "11:00",
        "classroom_id": classroom['id']
    }).json
    
    task2 = client.post('/api/tasks', json={
        "title": "Task 2",
        "category": "CLASS_SUPPORT",
        "start_time": "10:30",
        "end_time": "11:30",
        "classroom_id": classroom['id']
    }).json
    
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    # Create first assignment (10:00-11:00)
    assign1 = client.post('/api/assignments', json={
        "task_id": task1['id'],
        "aide_id": aide['id'],
        "date": monday.isoformat(),
        "start_time": "10:00",
        "end_time": "11:00"
    })
    assert assign1.status_code == 201
    
    # Attempt overlapping assignment (10:30-11:30)
    assign2 = client.post('/api/assignments', json={
        "task_id": task2['id'],
        "aide_id": aide['id'],
        "date": monday.isoformat(),
        "start_time": "10:30",
        "end_time": "11:30"
    })
    
    # Should return 409 Conflict
    assert assign2.status_code == 409
    assert 'error' in assign2.json
    assert 'conflict' in assign2.json['error'].lower()
    
    # Should include conflict details
    assert 'conflicts' in assign2.json
    conflicts = assign2.json['conflicts']
    assert len(conflicts) > 0
    assert conflicts[0]['existing_assignment_id'] == assign1.json['id']


def test_exact_time_match_conflict(client):
    """Test conflict when assignments have exact same time"""
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#00FF00"}).json
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "TU", "start_time": "08:00", "end_time": "16:00"
    })
    
    classroom = client.post('/api/classrooms', json={"name": "Test Room", "room_number": "TR1", "teacher": "Test Teacher", "capacity": 20}).json
    
    task1 = client.post('/api/tasks', json={
        "title": "Task A", "category": "PLAYGROUND",
        "start_time": "12:00", "end_time": "12:30",
        "classroom_id": classroom['id']
    }).json
    
    task2 = client.post('/api/tasks', json={
        "title": "Task B", "category": "PLAYGROUND",
        "start_time": "12:00", "end_time": "12:30",
        "classroom_id": classroom['id']
    }).json
    
    tuesday = date.today() + timedelta(days=(8 - date.today().weekday()) % 7)
    
    # Create first assignment
    client.post('/api/assignments', json={
        "task_id": task1['id'], "aide_id": aide['id'],
        "date": tuesday.isoformat(),
        "start_time": "12:00", "end_time": "12:30"
    })
    
    # Attempt duplicate time assignment
    response = client.post('/api/assignments', json={
        "task_id": task2['id'], "aide_id": aide['id'],
        "date": tuesday.isoformat(),
        "start_time": "12:00", "end_time": "12:30"
    })
    
    assert response.status_code == 409


def test_no_conflict_different_days(client):
    """Test no conflict when same time but different days"""
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#0000FF"}).json
    
    for day in ['MO', 'TU']:
        client.post(f'/api/aides/{aide["id"]}/availability', json={
            "weekday": day, "start_time": "08:00", "end_time": "16:00"
        })
    
    classroom = client.post('/api/classrooms', json={"name": "Test Room", "room_number": "TR1", "teacher": "Test Teacher", "capacity": 20}).json
    task = client.post('/api/tasks', json={
        "title": "Daily Task", "category": "CLASS_SUPPORT",
        "start_time": "09:00", "end_time": "10:00",
        "classroom_id": classroom['id']
    }).json
    
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    tuesday = monday + timedelta(days=1)
    
    # Assign Monday
    response1 = client.post('/api/assignments', json={
        "task_id": task['id'], "aide_id": aide['id'],
        "date": monday.isoformat(),
        "start_time": "09:00", "end_time": "10:00"
    })
    assert response1.status_code == 201
    
    # Assign Tuesday (same time, no conflict)
    response2 = client.post('/api/assignments', json={
        "task_id": task['id'], "aide_id": aide['id'],
        "date": tuesday.isoformat(),
        "start_time": "09:00", "end_time": "10:00"
    })
    assert response2.status_code == 201


def test_no_conflict_adjacent_times(client):
    """Test no conflict when assignments are back-to-back (no overlap)"""
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#FF00FF"}).json
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "WE", "start_time": "08:00", "end_time": "16:00"
    })
    
    classroom = client.post('/api/classrooms', json={"name": "Test Room", "room_number": "TR1", "teacher": "Test Teacher", "capacity": 20}).json
    
    task1 = client.post('/api/tasks', json={
        "title": "Task 1", "category": "CLASS_SUPPORT",
        "start_time": "09:00", "end_time": "10:00",
        "classroom_id": classroom['id']
    }).json
    
    task2 = client.post('/api/tasks', json={
        "title": "Task 2", "category": "CLASS_SUPPORT",
        "start_time": "10:00", "end_time": "11:00",
        "classroom_id": classroom['id']
    }).json
    
    wednesday = date.today() + timedelta(days=(9 - date.today().weekday()) % 7)
    
    # Create first assignment (09:00-10:00)
    response1 = client.post('/api/assignments', json={
        "task_id": task1['id'], "aide_id": aide['id'],
        "date": wednesday.isoformat(),
        "start_time": "09:00", "end_time": "10:00"
    })
    assert response1.status_code == 201
    
    # Create adjacent assignment (10:00-11:00) - should succeed
    response2 = client.post('/api/assignments', json={
        "task_id": task2['id'], "aide_id": aide['id'],
        "date": wednesday.isoformat(),
        "start_time": "10:00", "end_time": "11:00"
    })
    assert response2.status_code == 201



