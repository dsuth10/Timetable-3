"""
T013: Contract test for GET /api/tasks
Tests task listing and filtering
"""
import pytest
from datetime import time


def test_get_tasks_empty(client):
    """Test GET /api/tasks returns empty list when no tasks exist"""
    response = client.get('/api/tasks')
    
    assert response.status_code == 200
    assert response.json == []


def test_get_tasks_returns_list(client, sample_task):
    """Test GET /api/tasks returns list of tasks"""
    response = client.get('/api/tasks')
    
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 1
    
    task = response.json[0]
    assert task['id'] == sample_task.id
    assert task['title'] == "Reading Support"
    assert task['category'] == "CLASS_SUPPORT"
    assert task['start_time'] == "09:00:00"
    assert task['end_time'] == "10:00:00"


def test_get_task_by_id(client, sample_task):
    """Test GET /api/tasks/{id} returns specific task"""
    response = client.get(f'/api/tasks/{sample_task.id}')
    
    assert response.status_code == 200
    assert response.json['id'] == sample_task.id
    assert response.json['title'] == "Reading Support"


def test_get_task_not_found(client):
    """Test GET /api/tasks/{id} returns 404 for non-existent task"""
    response = client.get('/api/tasks/99999')
    
    assert response.status_code == 404
    assert 'error' in response.json


def test_get_tasks_filter_by_category(client, sample_task, sample_classroom):
    """Test GET /api/tasks?category=X filters by category"""
    # Create another task with different category
    from api.models.task import Task
    from api.models import db
    
    playground_task = Task(
        title="Playground Duty",
        category="PLAYGROUND",
        start_time=time(12, 0),
        end_time=time(12, 30),
        classroom_id=sample_classroom.id
    )
    db.session.add(playground_task)
    db.session.commit()
    
    response = client.get('/api/tasks?category=CLASS_SUPPORT')
    
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['category'] == "CLASS_SUPPORT"


def test_get_tasks_filter_by_category_case_insensitive(client, sample_task, sample_classroom):
    """Test GET /api/tasks?category=X handles mixed-case input"""
    from api.models.task import Task
    from api.models import db
    
    playground_task = Task(
        title="Playground Duty",
        category="PLAYGROUND",
        start_time=time(12, 0),
        end_time=time(12, 30),
        classroom_id=sample_classroom.id
    )
    db.session.add(playground_task)
    db.session.commit()
    
    # Test lowercase query parameter
    response = client.get('/api/tasks?category=playground')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['category'] == "PLAYGROUND"
    
    # Test mixed-case query parameter
    response = client.get('/api/tasks?category=PlayGround')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['category'] == "PLAYGROUND"
    
    # Verify uppercase still works
    response = client.get('/api/tasks?category=PLAYGROUND')
    assert response.status_code == 200
    assert len(response.json) == 1


def test_get_tasks_includes_classroom(client, sample_task):
    """Test GET /api/tasks includes classroom details"""
    response = client.get('/api/tasks')
    
    assert response.status_code == 200
    task = response.json[0]
    assert 'classroom' in task
    assert task['classroom']['name'] == "Room 101"



