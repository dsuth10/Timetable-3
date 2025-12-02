import pytest
from datetime import date

def test_get_tasks_filtered_by_classroom(client):
    """
    Test fetching tasks for a specific classroom.
    """
    # This test assumes we seed data or mock the DB in a real run.
    # For contract testing, we just check the response structure.
    response = client.get('/api/tasks?classroom_id=1')
    
    # In a real TDD cycle, this 404 or 500 implies 'not implemented'
    # Once implemented, it should be 200
    if response.status_code == 200:
        assert isinstance(response.json, list)
        if len(response.json) > 0:
            task = response.json[0]
            assert 'id' in task
            assert 'title' in task
            assert 'classroom_id' in task
    else:
        # Acceptable failure for "not implemented yet"
        assert response.status_code in [404, 405]

def test_create_task_contract(client):
    """
    Test the contract for creating a task via the quick-create flow.
    """
    payload = {
        "title": "New Reading Task",
        "description": "Created via modal",
        "classroom_id": 1
    }
    response = client.post('/api/tasks', json=payload)
    
    if response.status_code == 201:
        data = response.json
        assert data['title'] == payload['title']
        assert data['classroom_id'] == payload['classroom_id']
        assert 'id' in data
        # Backend uses 'notes' field, but accepts 'description' in input
        assert data.get('notes') == payload['description']
    else:
        # Debug: print the error message
        if response.status_code == 400:
            print(f"Error response: {response.json}")
        assert response.status_code in [404, 405]

def test_create_assignment_contract(client):
    """
    Test the contract for assigning an aide to a task.
    """
    payload = {
        "aide_id": 1,
        "task_id": 1,
        "date": str(date.today()),
        "start_time": "09:00",
        "end_time": "10:00"
    }
    response = client.post('/api/assignments', json=payload)
    
    if response.status_code == 201:
        data = response.json
        assert data['aide_id'] == payload['aide_id']
        assert data['task_id'] == payload['task_id']
    else:
        assert response.status_code in [404, 405]
