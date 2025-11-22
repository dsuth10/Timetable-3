"""
T014: Contract test for recurring tasks with new RecurringSeries architecture
Tests recurring task creation through task update endpoint
"""
import pytest
from datetime import date, timedelta


def test_create_recurring_series_success(client, sample_classroom):
    """Test creating a recurring series by updating a task after assignment"""
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()) or 7)
    
    # First create a task template
    task_response = client.post('/api/tasks', json={
        "title": "Daily Playground Duty",
        "category": "PLAYGROUND",
        "start_time": "10:30",
        "end_time": "11:00",
        "classroom_id": sample_classroom.id,
        "notes": "Morning recess supervision"
    })
    assert task_response.status_code == 201
    task_id = task_response.json['id']
    
    # Create an aide
    aide_response = client.post('/api/aides', json={
        "name": "Test Aide",
        "colour_hex": "#FF0000"
    })
    aide_id = aide_response.json['id']
    
    # Assign the task to create a base assignment
    assignment_response = client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide_id,
        "date": next_monday.isoformat(),
        "start_time": "10:30",
        "end_time": "11:00"
    })
    assert assignment_response.status_code == 201
    
    # Now make it recurring by updating the task with recurrence settings
    update_response = client.put(f'/api/tasks/{task_id}', json={
        "recurrence_rule": "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
        "expires_on": (next_monday + timedelta(weeks=4)).isoformat(),
        "aide_id": aide_id,
        "existing_assignment_date": next_monday.isoformat()
    })
    
    assert update_response.status_code == 200
    assert update_response.json['title'] == "Daily Playground Duty"
    # Task no longer has recurrence_rule field
    assert 'recurrence_rule' not in update_response.json or update_response.json.get('recurrence_rule') is None


def test_create_recurring_series_weekly_pattern(client, sample_classroom):
    """Test creating recurring series with FREQ=WEEKLY pattern"""
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()) or 7)
    
    # Create task and aide
    task_response = client.post('/api/tasks', json={
        "title": "Weekly Reading Group",
        "category": "GROUP_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "classroom_id": sample_classroom.id
    })
    task_id = task_response.json['id']
    
    aide_response = client.post('/api/aides', json={
        "name": "Test Aide",
        "colour_hex": "#00FF00"
    })
    aide_id = aide_response.json['id']
    
    # Create base assignment
    client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide_id,
        "date": next_monday.isoformat(),
        "start_time": "09:00",
        "end_time": "10:00"
    })
    
    # Make it recurring
    update_response = client.put(f'/api/tasks/{task_id}', json={
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        "expires_on": (next_monday + timedelta(weeks=10)).isoformat(),
        "aide_id": aide_id,
        "existing_assignment_date": next_monday.isoformat()
    })
    
    assert update_response.status_code == 200


def test_create_recurring_series_invalid_rrule(client, sample_classroom):
    """Test PUT returns 400 for invalid RRULE syntax"""
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()) or 7)
    
    # Create task and aide
    task_response = client.post('/api/tasks', json={
        "title": "Invalid Task",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "classroom_id": sample_classroom.id
    })
    task_id = task_response.json['id']
    
    aide_response = client.post('/api/aides', json={
        "name": "Test Aide",
        "colour_hex": "#0000FF"
    })
    aide_id = aide_response.json['id']
    
    # Create base assignment
    client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide_id,
        "date": next_monday.isoformat(),
        "start_time": "09:00",
        "end_time": "10:00"
    })
    
    # Try to make it recurring with invalid RRULE
    response = client.put(f'/api/tasks/{task_id}', json={
        "recurrence_rule": "INVALID_RRULE",
        "expires_on": (next_monday + timedelta(weeks=4)).isoformat(),
        "aide_id": aide_id,
        "existing_assignment_date": next_monday.isoformat()
    })
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_recurring_series_missing_expires_on(client, sample_classroom):
    """Test PUT returns 400 when expires_on is missing for recurring series"""
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()) or 7)
    
    # Create task and aide
    task_response = client.post('/api/tasks', json={
        "title": "Missing Expiry",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "classroom_id": sample_classroom.id
    })
    task_id = task_response.json['id']
    
    aide_response = client.post('/api/aides', json={
        "name": "Test Aide",
        "colour_hex": "#FFFF00"
    })
    aide_id = aide_response.json['id']
    
    # Create base assignment
    client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide_id,
        "date": next_monday.isoformat(),
        "start_time": "09:00",
        "end_time": "10:00"
    })
    
    # Try to make it recurring without expires_on
    response = client.put(f'/api/tasks/{task_id}', json={
        "recurrence_rule": "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
        "aide_id": aide_id,
        "existing_assignment_date": next_monday.isoformat()
    })
    
    # Should fail because expires_on is required for recurring series
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_recurring_series_generates_assignments(client, sample_classroom):
    """Test recurring series creation generates assignment instances"""
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()) or 7)
    
    # Create task and aide
    task_response = client.post('/api/tasks', json={
        "title": "Test Recurring",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "classroom_id": sample_classroom.id
    })
    task_id = task_response.json['id']
    
    aide_response = client.post('/api/aides', json={
        "name": "Test Aide",
        "colour_hex": "#FF00FF"
    })
    aide_id = aide_response.json['id']
    
    # Create base assignment
    client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide_id,
        "date": next_monday.isoformat(),
        "start_time": "09:00",
        "end_time": "10:00"
    })
    
    # Make it recurring
    client.put(f'/api/tasks/{task_id}', json={
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO",
        "expires_on": (next_monday + timedelta(weeks=2)).isoformat(),
        "aide_id": aide_id,
        "existing_assignment_date": next_monday.isoformat()
    })
    
    # Check that assignments were generated
    assignments_response = client.get(f'/api/tasks/{task_id}/assignments')
    
    assert assignments_response.status_code == 200
    # Should have at least 2 new assignments (plus 1 base = 3 total)
    assignments = [a for a in assignments_response.json if a['aide_id'] == aide_id]
    assert len(assignments) >= 2



