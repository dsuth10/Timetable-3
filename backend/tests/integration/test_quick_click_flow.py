"""
Integration test for quick-click task creation workflow
Tests full workflow from API call to database persistence
"""
import pytest
from datetime import date, time as dt_time
from api.models import db
from api.models.task import Task
from api.models.assignment import Assignment


def test_quick_click_creates_task_and_assignment(client, sample_aide, sample_classroom):
    """Test quick-click creates both task and assignment in database"""
    payload = {
        "title": "One-on-one reading with Emma",
        "category": "INDIVIDUAL_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:00:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id,
        "classroom_id": sample_classroom.id,
        "notes": "Focus on blending and digraphs"
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 201
    
    # Verify task exists in database
    task_id = response.json['task']['id']
    task = Task.query.get(task_id)
    assert task is not None
    assert task.title == "One-on-one reading with Emma"
    assert task.category == "INDIVIDUAL_SUPPORT"
    assert task.start_time == dt_time(9, 0)  # Placeholder
    assert task.end_time == dt_time(10, 0)  # Placeholder
    assert task.classroom_id == sample_classroom.id
    assert task.notes == "Focus on blending and digraphs"
    assert task.status == 'UNASSIGNED'
    
    # Verify assignment exists in database
    assignment_id = response.json['assignment']['id']
    assignment = Assignment.query.get(assignment_id)
    assert assignment is not None
    assert assignment.task_id == task_id
    assert assignment.aide_id == sample_aide.id
    assert assignment.date == date(2025, 1, 27)
    assert assignment.start_time == dt_time(10, 0)
    assert assignment.end_time == dt_time(10, 30)  # 10:00 + 30 minutes
    assert assignment.status == 'ASSIGNED'
    assert assignment.version == 1
    assert assignment.original_aide_id is None
    assert assignment.recurring_series_id is None


def test_quick_click_task_appears_in_task_bank(client, sample_aide):
    """Test created task appears in Task Bank (GET /api/tasks)"""
    payload = {
        "title": "Morning Check-in",
        "category": "PLAYGROUND",
        "date": "2025-01-27",
        "start_time": "08:45:00",
        "duration_minutes": 15,
        "aide_id": sample_aide.id
    }
    
    # Create via quick-click
    create_response = client.post('/api/quick-create-task', json=payload)
    assert create_response.status_code == 201
    task_id = create_response.json['task']['id']
    
    # Verify task appears in Task Bank
    list_response = client.get('/api/tasks')
    assert list_response.status_code == 200
    
    tasks = list_response.json
    task = next((t for t in tasks if t['id'] == task_id), None)
    assert task is not None
    assert task['title'] == "Morning Check-in"
    assert task['category'] == "PLAYGROUND"
    assert task['start_time'] == "09:00:00"  # Placeholder
    assert task['end_time'] == "10:00:00"  # Placeholder


def test_quick_click_assignment_appears_in_schedule(client, sample_aide):
    """Test created assignment appears in schedule (GET /api/assignments)"""
    payload = {
        "title": "Lunch Supervision",
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "11:30:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id
    }
    
    # Create via quick-click
    create_response = client.post('/api/quick-create-task', json=payload)
    assert create_response.status_code == 201
    assignment_id = create_response.json['assignment']['id']
    
    # Verify assignment appears in assignments list
    list_response = client.get('/api/assignments')
    assert list_response.status_code == 200
    
    assignments = list_response.json
    assignment = next((a for a in assignments if a['id'] == assignment_id), None)
    assert assignment is not None
    assert assignment['aide_id'] == sample_aide.id
    assert assignment['date'] == "2025-01-27"
    assert assignment['start_time'] == "11:30:00"
    assert assignment['end_time'] == "12:00:00"  # 11:30 + 30 minutes
    assert assignment['status'] == 'ASSIGNED'


def test_quick_click_task_is_reusable(client, sample_aide):
    """Test created task can be reused to create additional assignments"""
    payload = {
        "title": "Transition Support",
        "category": "GROUP_SUPPORT",
        "date": "2025-01-27",
        "start_time": "13:15:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id
    }
    
    # Create via quick-click
    create_response = client.post('/api/quick-create-task', json=payload)
    assert create_response.status_code == 201
    task_id = create_response.json['task']['id']
    first_assignment_id = create_response.json['assignment']['id']
    
    # Create second assignment using same task (simulating drag from Task Bank)
    second_payload = {
        "task_id": task_id,
        "aide_id": sample_aide.id,
        "date": "2025-01-28",  # Different date
        "start_time": "13:15:00",
        "end_time": "13:45:00"
    }
    
    second_response = client.post('/api/assignments', json=second_payload)
    assert second_response.status_code == 201
    
    # Verify both assignments reference same task
    first_assignment = Assignment.query.get(first_assignment_id)
    second_assignment = Assignment.query.get(second_response.json['id'])
    
    assert first_assignment.task_id == task_id
    assert second_assignment.task_id == task_id
    assert first_assignment.task_id == second_assignment.task_id


def test_quick_click_atomicity_on_collision(client, sample_aide, sample_task):
    """Test atomic rollback when collision detected"""
    from datetime import date as dt_date, time as dt_time
    
    # Create existing assignment
    existing = Assignment(
        task_id=sample_task.id,
        aide_id=sample_aide.id,
        date=dt_date(2025, 1, 27),
        start_time=dt_time(10, 0),
        end_time=dt_time(10, 30),
        status='ASSIGNED',
        version=1
    )
    db.session.add(existing)
    db.session.commit()
    
    initial_task_count = Task.query.count()
    initial_assignment_count = Assignment.query.count()
    
    # Try to create conflicting assignment
    payload = {
        "title": "Should not be created",
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:15:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 409
    
    # Verify no partial data created (atomic rollback)
    assert Task.query.count() == initial_task_count
    assert Assignment.query.count() == initial_assignment_count


def test_quick_click_multiple_tasks_created(client, sample_aide):
    """Test creating multiple tasks via quick-click builds task library"""
    tasks_data = [
        {
            "title": "Morning Check-in",
            "category": "PLAYGROUND",
            "date": "2025-01-27",
            "start_time": "08:45:00",
            "duration_minutes": 15,
            "aide_id": sample_aide.id
        },
        {
            "title": "Lunch Supervision",
            "category": "CLASS_SUPPORT",
            "date": "2025-01-27",
            "start_time": "11:30:00",
            "duration_minutes": 30,
            "aide_id": sample_aide.id
        },
        {
            "title": "Transition Support",
            "category": "GROUP_SUPPORT",
            "date": "2025-01-27",
            "start_time": "13:15:00",
            "duration_minutes": 30,
            "aide_id": sample_aide.id
        }
    ]
    
    created_task_ids = []
    
    for task_data in tasks_data:
        response = client.post('/api/quick-create-task', json=task_data)
        assert response.status_code == 201
        created_task_ids.append(response.json['task']['id'])
    
    # Verify all tasks in Task Bank
    list_response = client.get('/api/tasks')
    assert list_response.status_code == 200
    
    tasks = list_response.json
    task_titles = [t['title'] for t in tasks if t['id'] in created_task_ids]
    
    assert "Morning Check-in" in task_titles
    assert "Lunch Supervision" in task_titles
    assert "Transition Support" in task_titles
    
    # Verify all assignments created
    assignments = Assignment.query.filter(Assignment.task_id.in_(created_task_ids)).all()
    assert len(assignments) == 3










