"""
T021: Integration test - Drag-drop assignment flow
Tests the complete user journey from quickstart.md steps 1-5
"""
import pytest
from datetime import date, time, timedelta


def test_drag_drop_assignment_flow(client):
    """
    Integration test: Drag-and-drop assignment workflow
    
    Scenario from quickstart.md:
    1. Create teacher aide
    2. Set weekly availability
    3. Create recurring task
    4. Drag task from unassigned pool to aide's timetable slot
    5. Verify assignment created with correct status
    """
    
    # Step 1: Create teacher aide
    aide_payload = {
        "name": "Sarah Johnson",
        "details": "Special Education, Reading Support",
        "colour_hex": "#4A90E2"
    }
    aide_response = client.post('/api/aides', json=aide_payload)
    assert aide_response.status_code == 201
    aide_id = aide_response.json['id']
    
    # Step 2: Set weekly availability (Mon-Fri, 08:00-16:00)
    for weekday in ['MO', 'TU', 'WE', 'TH', 'FR']:
        avail_payload = {
            "weekday": weekday,
            "start_time": "08:00",
            "end_time": "16:00"
        }
        avail_response = client.post(f'/api/aides/{aide_id}/availability', json=avail_payload)
        assert avail_response.status_code == 201
    
    # Step 3: Create classroom
    classroom_payload = {
        "name": "Room 101",
        "room_number": "101",
        "teacher": "Mr. Brown",
        "capacity": 25,
        "notes": "Grade 3A"
    }
    classroom_response = client.post('/api/classrooms', json=classroom_payload)
    assert classroom_response.status_code == 201
    classroom_id = classroom_response.json['id']
    
    # Step 4: Create recurring task (Mon/Wed/Fri reading support)
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    task_payload = {
        "title": "Reading Support - Grade 3A",
        "category": "GROUP_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        "expires_on": (next_monday + timedelta(weeks=4)).isoformat(),
        "classroom_id": classroom_id,
        "notes": "Small group reading intervention"
    }
    task_response = client.post('/api/recurring-tasks', json=task_payload)
    assert task_response.status_code == 201
    task_id = task_response.json['id']
    
    # Step 5: Simulate drag-and-drop assignment
    # User drags task from unassigned pool to Sarah's Monday 09:00 slot
    assign_payload = {
        "task_id": task_id,
        "aide_id": aide_id,
        "date": next_monday.isoformat(),
        "start_time": "09:00",
        "end_time": "10:00"
    }
    assign_response = client.post('/api/assignments', json=assign_payload)
    
    # Verify assignment created successfully
    assert assign_response.status_code == 201
    assignment = assign_response.json
    assert assignment['status'] == 'ASSIGNED'
    assert assignment['aide_id'] == aide_id
    assert assignment['task_id'] == task_id
    assert assignment['version'] == 1
    
    # Step 6: Verify weekly matrix shows assignment
    matrix_response = client.get(f'/api/assignments/weekly-matrix?start_date={next_monday.isoformat()}')
    assert matrix_response.status_code == 200
    
    matrix = matrix_response.json
    assert len(matrix['aides']) == 1
    assert matrix['aides'][0]['id'] == aide_id
    
    # Verify assignment appears in matrix
    aide_key = str(aide_id)
    assert aide_key in matrix['matrix']


def test_drag_drop_reassignment_flow(client):
    """
    Integration test: Reassigning task from one aide to another
    
    Scenario:
    1. Create two aides with availability
    2. Assign task to Aide A
    3. Drag task from Aide A to Aide B (reassignment)
    4. Verify task now assigned to Aide B
    """
    
    # Create two aides
    aide1_payload = {"name": "Aide A", "colour_hex": "#FF0000"}
    aide2_payload = {"name": "Aide B", "colour_hex": "#00FF00"}
    
    aide1 = client.post('/api/aides', json=aide1_payload).json
    aide2 = client.post('/api/aides', json=aide2_payload).json
    
    # Set availability for both
    for aide_id in [aide1['id'], aide2['id']]:
        avail = {"weekday": "MO", "start_time": "08:00", "end_time": "16:00"}
        client.post(f'/api/aides/{aide_id}/availability', json=avail)
    
    # Create classroom and task
    classroom = client.post('/api/classrooms', json={"name": "Test Room", "room_number": "TR1", "teacher": "Test Teacher", "capacity": 20}).json
    task = client.post('/api/tasks', json={
        "title": "Test Task",
        "category": "CLASS_SUPPORT",
        "start_time": "10:00",
        "end_time": "11:00",
        "classroom_id": classroom['id']
    }).json
    
    # Assign to Aide A
    monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    assignment = client.post('/api/assignments', json={
        "task_id": task['id'],
        "aide_id": aide1['id'],
        "date": monday.isoformat(),
        "start_time": "10:00",
        "end_time": "11:00"
    }).json
    
    # Simulate drag from Aide A to Aide B (update assignment)
    reassign_response = client.put(f'/api/assignments/{assignment["id"]}', json={
        "aide_id": aide2['id'],
        "version": 1
    })
    
    assert reassign_response.status_code == 200
    assert reassign_response.json['aide_id'] == aide2['id']
    assert reassign_response.json['version'] == 2


def test_drag_drop_unassign_flow(client):
    """
    Integration test: Dragging task back to unassigned pool
    
    Scenario:
    1. Create aide and assign task
    2. Drag task back to unassigned pool
    3. Verify task is unassigned
    """
    
    # Setup
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#0000FF"}).json
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "TU", "start_time": "08:00", "end_time": "16:00"
    })
    
    classroom = client.post('/api/classrooms', json={
        "name": "Test Room",
        "room_number": "TR2",
        "teacher": "Test Teacher 2",
        "capacity": 20
    }).json
    task = client.post('/api/tasks', json={
        "title": "Test Task",
        "category": "PLAYGROUND",
        "start_time": "12:00",
        "end_time": "12:30",
        "classroom_id": classroom['id']
    }).json
    
    tuesday = date.today() + timedelta(days=(8 - date.today().weekday()) % 7)
    assignment = client.post('/api/assignments', json={
        "task_id": task['id'],
        "aide_id": aide['id'],
        "date": tuesday.isoformat(),
        "start_time": "12:00",
        "end_time": "12:30"
    }).json
    
    # Unassign (drag to unassigned pool)
    unassign_response = client.put(f'/api/assignments/{assignment["id"]}', json={
        "aide_id": None,
        "version": 1
    })
    
    assert unassign_response.status_code == 200
    assert unassign_response.json['aide_id'] is None
    assert unassign_response.json['status'] == 'UNASSIGNED'



