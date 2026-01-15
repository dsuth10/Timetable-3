"""
T023: Integration test - Partial overlap auto-shorten
Tests automatic shortening from quickstart.md step 7
"""
import pytest
from datetime import date, time, timedelta


def test_partial_overlap_auto_shorten(client):
    """
    Test automatic shortening when partial overlap occurs
    
    Scenario from quickstart.md step 7:
    1. Aide has assignment 09:00-10:30 (90 minutes)
    2. Try to assign same aide to 10:00-11:00
    3. System automatically shortens first task to 09:00-10:00
    4. Second task assigned as 10:00-11:00
    """
    
    # Setup aide
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#FF5733"}).json
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "TH", "start_time": "08:00", "end_time": "16:00"
    })
    
    # Create classroom and tasks
    classroom = client.post('/api/classrooms', json={"name": "Room 101", "room_number": "101", "teacher": "Test Teacher", "capacity": 25}).json
    
    task1 = client.post('/api/tasks', json={
        "title": "Long Task",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:30",
        "classroom_id": classroom['id']
    }).json
    
    task2 = client.post('/api/tasks', json={
        "title": "Overlapping Task",
        "category": "CLASS_SUPPORT",
        "start_time": "10:00",
        "end_time": "11:00",
        "classroom_id": classroom['id']
    }).json
    
    thursday = date.today() + timedelta(days=(10 - date.today().weekday()) % 7)
    
    # Create first assignment (09:00-10:30)
    assign1 = client.post('/api/assignments', json={
        "task_id": task1['id'],
        "aide_id": aide['id'],
        "date": thursday.isoformat(),
        "start_time": "09:00",
        "end_time": "10:30"
    })
    assert assign1.status_code == 201
    assignment1_id = assign1.json['id']
    
    # Attempt overlapping assignment with auto-shorten enabled
    assign2 = client.post('/api/assignments', json={
        "task_id": task2['id'],
        "aide_id": aide['id'],
        "date": thursday.isoformat(),
        "start_time": "10:00",
        "end_time": "11:00",
        "auto_shorten": True  # Request automatic shortening
    })
    
    # Should succeed with 201
    assert assign2.status_code == 201
    
    # Verify first assignment was shortened
    get_assign1 = client.get(f'/api/assignments/{assignment1_id}')
    assert get_assign1.status_code == 200
    assert get_assign1.json['end_time'] == "10:00:00"  # Shortened from 10:30
    
    # Verify second assignment created successfully
    assert assign2.json['start_time'] == "10:00:00"
    assert assign2.json['end_time'] == "11:00:00"


def test_auto_shorten_requires_flag(client):
    """Test that auto-shorten only happens when explicitly requested"""
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#33C1FF"}).json
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "FR", "start_time": "08:00", "end_time": "16:00"
    })
    
    classroom = client.post('/api/classrooms', json={"name": "Test Room", "room_number": "TR1", "teacher": "Test Teacher", "capacity": 20}).json
    
    task1 = client.post('/api/tasks', json={
        "title": "Task 1", "category": "CLASS_SUPPORT",
        "start_time": "09:00", "end_time": "10:30",
        "classroom_id": classroom['id']
    }).json
    
    task2 = client.post('/api/tasks', json={
        "title": "Task 2", "category": "CLASS_SUPPORT",
        "start_time": "10:00", "end_time": "11:00",
        "classroom_id": classroom['id']
    }).json
    
    friday = date.today() + timedelta(days=(11 - date.today().weekday()) % 7)
    
    # Create first assignment
    client.post('/api/assignments', json={
        "task_id": task1['id'], "aide_id": aide['id'],
        "date": friday.isoformat(),
        "start_time": "09:00", "end_time": "10:30"
    })
    
    # Attempt overlap WITHOUT auto_shorten flag - should fail
    response = client.post('/api/assignments', json={
        "task_id": task2['id'], "aide_id": aide['id'],
        "date": friday.isoformat(),
        "start_time": "10:00", "end_time": "11:00"
        # Note: auto_shorten NOT set
    })
    
    assert response.status_code == 409  # Should conflict


def test_auto_shorten_multi_slot_task(client):
    """Test auto-shorten with multi-slot tasks (spanning multiple 30-min blocks)"""
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#9B59B6"}).json
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "MO", "start_time": "08:00", "end_time": "17:00"
    })
    
    classroom = client.post('/api/classrooms', json={"name": "Library", "room_number": "LIB", "teacher": "Librarian", "capacity": 50}).json
    
    # Create 2-hour task
    long_task = client.post('/api/tasks', json={
        "title": "Long Library Session",
        "category": "CLASS_SUPPORT",
        "start_time": "13:00",
        "end_time": "15:00",  # 2 hours, 4 slots
        "classroom_id": classroom['id']
    }).json
    
    # Create 1-hour task starting at 14:00
    short_task = client.post('/api/tasks', json={
        "title": "Afternoon Meeting",
        "category": "CLASS_SUPPORT",
        "start_time": "14:00",
        "end_time": "15:00",
        "classroom_id": classroom['id']
    }).json
    
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    # Assign long task (13:00-15:00)
    long_assign = client.post('/api/assignments', json={
        "task_id": long_task['id'], "aide_id": aide['id'],
        "date": monday.isoformat(),
        "start_time": "13:00", "end_time": "15:00"
    })
    assert long_assign.status_code == 201
    long_assign_id = long_assign.json['id']
    
    # Assign overlapping task with auto-shorten
    short_assign = client.post('/api/assignments', json={
        "task_id": short_task['id'], "aide_id": aide['id'],
        "date": monday.isoformat(),
        "start_time": "14:00", "end_time": "15:00",
        "auto_shorten": True
    })
    
    assert short_assign.status_code == 201
    
    # Verify long task shortened to 13:00-14:00
    get_long = client.get(f'/api/assignments/{long_assign_id}')
    assert get_long.json['end_time'] == "14:00:00"



