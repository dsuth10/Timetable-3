"""
Contract test for POST /api/quick-create-task
Tests quick-create task endpoint request/response schema and validation
"""
import pytest
from datetime import date, time


def test_quick_create_task_success(client, sample_aide, sample_classroom):
    """Test POST /api/quick-create-task creates task and assignment successfully"""
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
    data = response.json
    
    # Verify response structure
    assert 'task' in data
    assert 'assignment' in data
    
    # Verify task structure
    task = data['task']
    assert task['id'] is not None
    assert task['title'] == "One-on-one reading with Emma"
    assert task['category'] == "INDIVIDUAL_SUPPORT"
    assert task['start_time'] == "09:00:00"  # Placeholder time
    assert task['end_time'] == "10:00:00"  # Placeholder time
    assert task['classroom_id'] == sample_classroom.id
    assert task['notes'] == "Focus on blending and digraphs"
    assert task['status'] == 'UNASSIGNED'
    assert 'created_at' in task
    assert 'updated_at' in task
    
    # Verify assignment structure
    assignment = data['assignment']
    assert assignment['id'] is not None
    assert assignment['task_id'] == task['id']
    assert assignment['aide_id'] == sample_aide.id
    assert assignment['date'] == "2025-01-27"
    assert assignment['start_time'] == "10:00:00"
    assert assignment['end_time'] == "10:30:00"  # start_time + 30 minutes
    assert assignment['status'] == 'ASSIGNED'
    assert assignment['version'] == 1
    assert assignment['original_aide_id'] is None
    assert assignment['recurring_series_id'] is None
    assert 'created_at' in assignment
    assert 'updated_at' in assignment


def test_quick_create_task_without_classroom(client, sample_aide):
    """Test POST /api/quick-create-task works without classroom_id"""
    payload = {
        "title": "Playground supervision",
        "category": "PLAYGROUND",
        "date": "2025-01-27",
        "start_time": "11:00:00",
        "duration_minutes": 15,
        "aide_id": sample_aide.id,
        "notes": "Monitor recess"
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 201
    assert response.json['task']['classroom_id'] is None
    assert response.json['assignment']['end_time'] == "11:15:00"  # 11:00 + 15 minutes


def test_quick_create_task_missing_title(client, sample_aide):
    """Test POST /api/quick-create-task returns 400 when title is missing"""
    payload = {
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:00:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'message' in response.json


def test_quick_create_task_missing_category(client, sample_aide):
    """Test POST /api/quick-create-task returns 400 when category is missing"""
    payload = {
        "title": "Test task",
        "date": "2025-01-27",
        "start_time": "10:00:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_quick_create_task_invalid_category(client, sample_aide):
    """Test POST /api/quick-create-task returns 400 for invalid category"""
    payload = {
        "title": "Test task",
        "category": "INVALID_CATEGORY",
        "date": "2025-01-27",
        "start_time": "10:00:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_quick_create_task_invalid_duration(client, sample_aide):
    """Test POST /api/quick-create-task returns 400 for invalid duration"""
    payload = {
        "title": "Test task",
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:00:00",
        "duration_minutes": 23,  # Not a multiple of 5
        "aide_id": sample_aide.id
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_quick_create_task_invalid_time_increment(client, sample_aide):
    """Test POST /api/quick-create-task returns 400 for time not in 5-minute increments"""
    payload = {
        "title": "Test task",
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:07:00",  # Not in 5-minute increments
        "duration_minutes": 30,
        "aide_id": sample_aide.id
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_quick_create_task_invalid_aide_id(client):
    """Test POST /api/quick-create-task returns 404 for invalid aide_id"""
    payload = {
        "title": "Test task",
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:00:00",
        "duration_minutes": 30,
        "aide_id": 99999  # Non-existent aide
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'not found' in response.json['error'].lower() or 'does not exist' in response.json.get('message', '').lower()


def test_quick_create_task_invalid_classroom_id(client, sample_aide):
    """Test POST /api/quick-create-task returns 404 for invalid classroom_id"""
    payload = {
        "title": "Test task",
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:00:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id,
        "classroom_id": 99999  # Non-existent classroom
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 404
    assert 'error' in response.json


def test_quick_create_task_collision_detection(client, sample_aide, sample_task):
    """Test POST /api/quick-create-task returns 409 when assignment conflicts"""
    from api.models import db
    from api.models.assignment import Assignment
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
    
    # Try to create overlapping assignment
    payload = {
        "title": "Conflicting task",
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:15:00",  # Overlaps with 10:00-10:30
        "duration_minutes": 30,  # Would end at 10:45
        "aide_id": sample_aide.id
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 409
    assert 'error' in response.json
    assert 'conflict' in response.json['error'].lower() or 'conflict' in response.json.get('message', '').lower()
    assert 'conflicts' in response.json  # Should include conflict details


def test_quick_create_task_different_durations(client, sample_aide):
    """Test POST /api/quick-create-task handles different duration values"""
    from datetime import date as dt_date, timedelta
    
    durations = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
    
    # Use different dates to avoid conflicts
    base_date = dt_date(2025, 1, 27)
    
    for i, duration in enumerate(durations):
        # Use different dates for each duration test to avoid conflicts
        test_date = (base_date + timedelta(days=i)).isoformat()
        
        payload = {
            "title": f"Task {duration} minutes",
            "category": "CLASS_SUPPORT",
            "date": test_date,
            "start_time": "09:00:00",
            "duration_minutes": duration,
            "aide_id": sample_aide.id
        }
        
        response = client.post('/api/quick-create-task', json=payload)
        
        assert response.status_code == 201, f"Failed for duration {duration} on {test_date}"
        # Calculate expected end time (09:00 + duration)
        end_minutes = duration
        end_hour = 9 + (end_minutes // 60)
        end_minute = end_minutes % 60
        expected_end = f"{end_hour:02d}:{end_minute:02d}:00"
        assert response.json['assignment']['end_time'] == expected_end


def test_quick_create_task_atomicity(client, sample_aide):
    """Test POST /api/quick-create-task creates both task and assignment atomically"""
    from api.models import db
    from api.models.task import Task
    from api.models.assignment import Assignment
    
    # Count existing tasks and assignments
    initial_task_count = Task.query.count()
    initial_assignment_count = Assignment.query.count()
    
    payload = {
        "title": "Atomic test task",
        "category": "CLASS_SUPPORT",
        "date": "2025-01-27",
        "start_time": "10:00:00",
        "duration_minutes": 30,
        "aide_id": sample_aide.id
    }
    
    response = client.post('/api/quick-create-task', json=payload)
    
    assert response.status_code == 201
    
    # Verify both were created
    assert Task.query.count() == initial_task_count + 1
    assert Assignment.query.count() == initial_assignment_count + 1
    
    # Verify they're linked
    task_id = response.json['task']['id']
    assignment = Assignment.query.filter_by(task_id=task_id).first()
    assert assignment is not None
    assert assignment.aide_id == sample_aide.id


def test_quick_create_task_rollback_on_collision(client, sample_aide, sample_task):
    """Test POST /api/quick-create-task rolls back transaction on collision"""
    from api.models import db
    from api.models.task import Task
    from api.models.assignment import Assignment
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
    
    # Verify no new task or assignment was created (atomic rollback)
    assert Task.query.count() == initial_task_count
    assert Assignment.query.count() == initial_assignment_count



















