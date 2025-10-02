"""
T025: Integration test - Recurring task multi-day assignment
Tests multi-day selection from quickstart.md step 11
"""
import pytest
from datetime import date, time, timedelta


def test_recurring_task_multi_day_selection(client):
    """
    Test multi-day selection for recurring tasks
    
    Scenario from quickstart.md step 11:
    1. Create recurring task (Mon/Wed/Fri for 4 weeks)
    2. System prompts: "Assign for which dates?"
    3. Administrator selects specific dates (e.g., next 3 Mondays only)
    4. Batch assignment created for selected dates
    """
    
    # Setup aide
    aide = client.post('/api/aides', json={
        "name": "Sarah Williams",
        "qualifications": "Reading Specialist",
        "colour_hex": "#27AE60"
    }).json
    
    # Set availability for Mon/Wed/Fri
    for day in ['MO', 'WE', 'FR']:
        client.post(f'/api/aides/{aide["id"]}/availability', json={
            "weekday": day, "start_time": "08:00", "end_time": "16:00"
        })
    
    # Create classroom
    classroom = client.post('/api/classrooms', json={"name": "Library", "capacity": 50}).json
    
    # Create recurring task (Mon/Wed/Fri for 4 weeks)
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    task = client.post('/api/recurring-tasks', json={
        "title": "Reading Group",
        "category": "GROUP_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        "expires_on": (next_monday + timedelta(weeks=4)).isoformat(),
        "classroom_id": classroom['id']
    }).json
    
    # Get all generated assignment dates for this recurring task
    task_assignments = client.get(f'/api/tasks/{task["id"]}/assignments')
    assert task_assignments.status_code == 200
    
    all_dates = [a['date'] for a in task_assignments.json]
    
    # Select only Mondays (user choice)
    monday_dates = [d for d in all_dates if date.fromisoformat(d).weekday() == 0][:3]
    
    # Batch assign for selected dates only
    batch_response = client.post('/api/assignments/batch', json={
        "task_id": task['id'],
        "aide_id": aide['id'],
        "dates": monday_dates,
        "start_time": "09:00",
        "end_time": "10:00"
    })
    
    assert batch_response.status_code == 201
    assert 'assignments' in batch_response.json
    assert len(batch_response.json['assignments']) == 3
    
    # Verify all assignments are for Mondays
    for assignment in batch_response.json['assignments']:
        assignment_date = date.fromisoformat(assignment['date'])
        assert assignment_date.weekday() == 0  # Monday
        assert assignment['aide_id'] == aide['id']
        assert assignment['status'] == 'ASSIGNED'


def test_recurring_task_full_series_assignment(client):
    """Test assigning aide to entire recurring series"""
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#E67E22"}).json
    
    # Set availability for all weekdays
    for day in ['MO', 'TU', 'WE', 'TH', 'FR']:
        client.post(f'/api/aides/{aide["id"]}/availability', json={
            "weekday": day, "start_time": "08:00", "end_time": "17:00"
        })
    
    classroom = client.post('/api/classrooms', json={"name": "Playground", "capacity": 100}).json
    
    # Create daily recurring task (Mon-Fri for 2 weeks)
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    
    task = client.post('/api/recurring-tasks', json={
        "title": "Lunch Duty",
        "category": "PLAYGROUND",
        "start_time": "12:00",
        "end_time": "12:30",
        "recurrence_rule": "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
        "expires_on": (next_monday + timedelta(weeks=2)).isoformat(),
        "classroom_id": classroom['id']
    }).json
    
    # Get all assignment dates
    task_assignments = client.get(f'/api/tasks/{task["id"]}/assignments')
    all_dates = [a['date'] for a in task_assignments.json]
    
    # Assign to entire series
    batch_response = client.post('/api/assignments/batch', json={
        "task_id": task['id'],
        "aide_id": aide['id'],
        "dates": all_dates,
        "start_time": "12:00",
        "end_time": "12:30"
    })
    
    assert batch_response.status_code == 201
    # Should have assigned all generated assignments (count depends on current day)
    # Verify we got at least 10 assignments (should be 10-14 depending on day of week)
    assigned_count = len(batch_response.json['assignments'])
    assert assigned_count >= 10, f"Expected at least 10 assignments, got {assigned_count}"
    # Verify all requested dates were assigned
    assert assigned_count == len(all_dates), f"Not all dates were assigned: {assigned_count} != {len(all_dates)}"


def test_recurring_task_partial_series_with_conflicts(client):
    """Test multi-day assignment with some dates having conflicts"""
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#16A085"}).json
    
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "TU", "start_time": "08:00", "end_time": "16:00"
    })
    
    classroom = client.post('/api/classrooms', json={"name": "Test Room", "capacity": 20}).json
    
    # Create recurring task (Tuesdays for 3 weeks)
    next_tuesday = date.today() + timedelta(days=(8 - date.today().weekday()) % 7)
    
    task = client.post('/api/recurring-tasks', json={
        "title": "Weekly Meeting",
        "category": "CLASS_SUPPORT",
        "start_time": "10:00",
        "end_time": "11:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=TU",
        "expires_on": (next_tuesday + timedelta(weeks=3)).isoformat(),
        "classroom_id": classroom['id']
    }).json
    
    task_assignments = client.get(f'/api/tasks/{task["id"]}/assignments')
    tuesday_dates = [a['date'] for a in task_assignments.json]
    
    # Create a conflict on the second Tuesday
    conflicting_task = client.post('/api/tasks', json={
        "title": "Conflicting Task", "category": "PLAYGROUND",
        "start_time": "10:30", "end_time": "11:30",
        "classroom_id": classroom['id']
    }).json
    
    client.post('/api/assignments', json={
        "task_id": conflicting_task['id'],
        "aide_id": aide['id'],
        "date": tuesday_dates[1],  # Second Tuesday
        "start_time": "10:30",
        "end_time": "11:30"
    })
    
    # Try to batch assign all Tuesdays
    batch_response = client.post('/api/assignments/batch', json={
        "task_id": task['id'],
        "aide_id": aide['id'],
        "dates": tuesday_dates,
        "start_time": "10:00",
        "end_time": "11:00"
    })
    
    # Should handle partial conflicts gracefully
    # Either: 207 Multi-Status, or 201 with warnings
    assert batch_response.status_code in [201, 207, 409]
    
    if batch_response.status_code == 201:
        # Some assignments succeeded
        assert 'assignments' in batch_response.json or 'warnings' in batch_response.json



