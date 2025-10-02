"""
T014: Contract test for POST /api/recurring-tasks
Tests recurring task creation with RRULE
"""
import pytest
from datetime import date, timedelta


def test_create_recurring_task_success(client, sample_classroom):
    """Test POST /api/recurring-tasks creates task with recurrence rule"""
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    payload = {
        "title": "Daily Playground Duty",
        "category": "PLAYGROUND",
        "start_time": "10:30",
        "end_time": "11:00",
        "recurrence_rule": "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
        "expires_on": (next_monday + timedelta(weeks=4)).isoformat(),
        "classroom_id": sample_classroom.id,
        "notes": "Morning recess supervision"
    }
    
    response = client.post('/api/recurring-tasks', json=payload)
    
    assert response.status_code == 201
    assert response.json['title'] == "Daily Playground Duty"
    assert response.json['recurrence_rule'] == "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"
    assert 'id' in response.json


def test_create_recurring_task_weekly_pattern(client, sample_classroom):
    """Test POST with FREQ=WEEKLY pattern"""
    payload = {
        "title": "Weekly Reading Group",
        "category": "GROUP_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        "expires_on": (date.today() + timedelta(weeks=10)).isoformat(),
        "classroom_id": sample_classroom.id
    }
    
    response = client.post('/api/recurring-tasks', json=payload)
    
    assert response.status_code == 201
    assert "FREQ=WEEKLY" in response.json['recurrence_rule']


def test_create_recurring_task_invalid_rrule(client, sample_classroom):
    """Test POST returns 400 for invalid RRULE syntax"""
    payload = {
        "title": "Invalid Task",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "INVALID_RRULE",
        "expires_on": (date.today() + timedelta(weeks=4)).isoformat(),
        "classroom_id": sample_classroom.id
    }
    
    response = client.post('/api/recurring-tasks', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_recurring_task_missing_expires_on(client, sample_classroom):
    """Test POST returns 400 when expires_on is missing for recurring task"""
    payload = {
        "title": "Missing Expiry",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
        "classroom_id": sample_classroom.id
    }
    
    response = client.post('/api/recurring-tasks', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'expires_on' in response.json['error'].lower()


def test_create_recurring_task_generates_assignments(client, sample_classroom):
    """Test recurring task creation generates assignment instances"""
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    payload = {
        "title": "Test Recurring",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO",
        "expires_on": (next_monday + timedelta(weeks=2)).isoformat(),
        "classroom_id": sample_classroom.id
    }
    
    response = client.post('/api/recurring-tasks', json=payload)
    task_id = response.json['id']
    
    # Check that assignments were generated
    assignments_response = client.get(f'/api/tasks/{task_id}/assignments')
    
    assert assignments_response.status_code == 200
    # Should have at least 2 assignments (2 Mondays)
    assert len(assignments_response.json) >= 2



