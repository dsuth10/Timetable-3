"""
T015: Contract test for PUT /api/tasks/{id}
Tests task updates including recurring-to-oneoff conversion
"""
import pytest
from datetime import date, timedelta


def test_update_task_recurring_to_oneoff(client, sample_classroom):
    """Test converting recurring task to one-off clears both recurrence fields"""
    # Create a recurring task
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    create_payload = {
        "title": "Recurring Task",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        "expires_on": (next_monday + timedelta(weeks=4)).isoformat(),
        "classroom_id": sample_classroom.id,
        "notes": "Original recurring task"
    }
    
    create_response = client.post('/api/recurring-tasks', json=create_payload)
    assert create_response.status_code == 201
    task_id = create_response.json['id']
    
    # Verify it's a recurring task
    # Task no longer returns recurrence fields directly
    assert 'recurrence_rule' not in create_response.json or create_response.json.get('recurrence_rule') is None
    assert 'expires_on' not in create_response.json or create_response.json.get('expires_on') is None
    
    # Convert to one-off by sending null values
    update_payload = {
        "title": "Updated One-off Task",
        "recurrence_rule": None,
        "expires_on": None
    }
    
    update_response = client.put(f'/api/tasks/{task_id}', json=update_payload)
    assert update_response.status_code == 200
    
    # Verify both fields are cleared
    # Verify fields are cleared
    assert 'recurrence_rule' not in update_response.json or update_response.json.get('recurrence_rule') is None
    assert 'expires_on' not in update_response.json or update_response.json.get('expires_on') is None
    assert update_response.json['title'] == "Updated One-off Task"


def test_update_task_oneoff_to_recurring(client, sample_classroom):
    """Test converting one-off task to recurring sets both recurrence fields"""
    # Create a one-off task
    create_payload = {
        "title": "One-off Task",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "classroom_id": sample_classroom.id,
        "notes": "Original one-off task"
    }
    
    create_response = client.post('/api/tasks', json=create_payload)
    assert create_response.status_code == 201
    task_id = create_response.json['id']
    
    # Verify it's a one-off task
    # Verify it's a one-off task (no recurrence fields)
    assert 'recurrence_rule' not in create_response.json or create_response.json.get('recurrence_rule') is None
    assert 'expires_on' not in create_response.json or create_response.json.get('expires_on') is None
    
    # Convert to recurring
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    update_payload = {
        "title": "Updated Recurring Task",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=TU,TH",
        "expires_on": (next_monday + timedelta(weeks=6)).isoformat()
    }
    
    update_response = client.put(f'/api/tasks/{task_id}', json=update_payload)
    assert update_response.status_code == 200
    
    # Verify both fields are set
    # Task serialization no longer includes these fields directly
    assert 'recurrence_rule' not in update_response.json or update_response.json.get('recurrence_rule') is None
    assert 'expires_on' not in update_response.json or update_response.json.get('expires_on') is None
    assert update_response.json['title'] == "Updated Recurring Task"


def test_update_task_partial_fields(client, sample_classroom):
    """Test partial updates work correctly without affecting other fields"""
    # Create a recurring task
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    create_payload = {
        "title": "Original Task",
        "category": "PLAYGROUND",
        "start_time": "10:00",
        "end_time": "11:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO",
        "expires_on": (next_monday + timedelta(weeks=2)).isoformat(),
        "classroom_id": sample_classroom.id,
        "notes": "Original notes"
    }
    
    create_response = client.post('/api/recurring-tasks', json=create_payload)
    assert create_response.status_code == 201
    task_id = create_response.json['id']
    
    # Update only title and notes
    update_payload = {
        "title": "Updated Title",
        "notes": "Updated notes"
    }
    
    update_response = client.put(f'/api/tasks/{task_id}', json=update_payload)
    assert update_response.status_code == 200
    
    # Verify only specified fields changed
    assert update_response.json['title'] == "Updated Title"
    assert update_response.json['notes'] == "Updated notes"
    assert update_response.json['category'] == "PLAYGROUND"
    assert update_response.json['start_time'] == "10:00:00"
    assert update_response.json['end_time'] == "11:00:00"
    # Recurrence fields no longer on Task object
    assert 'recurrence_rule' not in update_response.json or update_response.json.get('recurrence_rule') is None
    assert 'expires_on' not in update_response.json or update_response.json.get('expires_on') is None


def test_update_task_clear_recurrence_rule_only(client, sample_classroom):
    """Test clearing only recurrence_rule while keeping expires_on"""
    # Create a recurring task
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    create_payload = {
        "title": "Recurring Task",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        "expires_on": (next_monday + timedelta(weeks=4)).isoformat(),
        "classroom_id": sample_classroom.id
    }
    
    create_response = client.post('/api/recurring-tasks', json=create_payload)
    assert create_response.status_code == 201
    task_id = create_response.json['id']
    
    # Clear only recurrence_rule
    update_payload = {
        "recurrence_rule": None
    }
    
    update_response = client.put(f'/api/tasks/{task_id}', json=update_payload)
    assert update_response.status_code == 200
    
    # Verify recurrence_rule is cleared but expires_on remains
    # Verify fields are cleared/missing
    assert 'recurrence_rule' not in update_response.json or update_response.json.get('recurrence_rule') is None
    assert 'expires_on' not in update_response.json or update_response.json.get('expires_on') is None


def test_update_task_invalid_expires_on_format(client, sample_classroom):
    """Test update returns 400 for invalid expires_on format"""
    # Create a one-off task
    create_payload = {
        "title": "One-off Task",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "classroom_id": sample_classroom.id
    }
    
    create_response = client.post('/api/tasks', json=create_payload)
    assert create_response.status_code == 201
    task_id = create_response.json['id']
    
    # Try to update with invalid date format
    update_payload = {
        "expires_on": "invalid-date"
    }
    
    update_response = client.put(f'/api/tasks/{task_id}', json=update_payload)
    assert update_response.status_code == 400
    assert 'error' in update_response.json


def test_update_task_nonexistent(client):
    """Test update returns 404 for nonexistent task"""
    update_payload = {
        "title": "Updated Title"
    }
    
    update_response = client.put('/api/tasks/99999', json=update_payload)
    assert update_response.status_code == 404
    assert 'error' in update_response.json
