"""
T024: Integration test - Absence cascade
Tests absence creation and assignment release from quickstart.md steps 8-10
"""
import pytest
from datetime import date, time, timedelta


def test_absence_cascade_releases_assignments(client):
    """
    Test absence creation automatically releases all assignments for that day
    
    Scenario from quickstart.md steps 8-10:
    1. Aide has 3 assignments on Thursday
    2. Administrator marks aide absent on Thursday
    3. All 3 assignments automatically released (aide_id = null, status = UNASSIGNED)
    4. Assignments appear in unassigned pool
    """
    
    # Setup aide
    aide = client.post('/api/aides', json={
        "name": "John Smith",
        "qualifications": "Special Education",
        "colour_hex": "#E74C3C"
    }).json
    
    # Set availability
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "TH", "start_time": "08:00", "end_time": "16:00"
    })
    
    # Create classroom and tasks
    classroom = client.post('/api/classrooms', json={"name": "Room 202", "capacity": 30}).json
    
    tasks = []
    for i, (start, end) in enumerate([("09:00", "10:00"), ("11:00", "12:00"), ("14:00", "15:00")]):
        task = client.post('/api/tasks', json={
            "title": f"Task {i+1}",
            "category": "CLASS_SUPPORT",
            "start_time": start,
            "end_time": end,
            "classroom_id": classroom['id']
        }).json
        tasks.append(task)
    
    thursday = date.today() + timedelta(days=(10 - date.today().weekday()) % 7)
    
    # Create 3 assignments for Thursday
    assignments = []
    for task in tasks:
        assign = client.post('/api/assignments', json={
            "task_id": task['id'],
            "aide_id": aide['id'],
            "date": thursday.isoformat(),
            "start_time": task['start_time'],
            "end_time": task['end_time']
        }).json
        assignments.append(assign)
    
    # Verify all assigned
    for assign in assignments:
        assert assign['status'] == 'ASSIGNED'
        assert assign['aide_id'] == aide['id']
    
    # Create absence for Thursday
    absence = client.post('/api/absences', json={
        "aide_id": aide['id'],
        "date": thursday.isoformat(),
        "reason": "Medical appointment"
    })
    
    assert absence.status_code == 201
    assert 'released_assignments' in absence.json
    assert len(absence.json['released_assignments']) == 3
    
    # Verify all assignments now unassigned
    for assign_id in [a['id'] for a in assignments]:
        get_assign = client.get(f'/api/assignments/{assign_id}')
        assert get_assign.status_code == 200
        assert get_assign.json['status'] == 'UNASSIGNED'
        assert get_assign.json['aide_id'] is None
    
    # Verify assignments appear in unassigned pool
    unassigned = client.get(f'/api/assignments/unassigned?date={thursday.isoformat()}')
    assert unassigned.status_code == 200
    assert len(unassigned.json) >= 3


def test_absence_does_not_affect_other_days(client):
    """Test absence only releases assignments for the specific date"""
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#3498DB"}).json
    
    for day in ['TU', 'WE']:
        client.post(f'/api/aides/{aide["id"]}/availability', json={
            "weekday": day, "start_time": "08:00", "end_time": "16:00"
        })
    
    classroom = client.post('/api/classrooms', json={"name": "Test Room", "capacity": 20}).json
    task = client.post('/api/tasks', json={
        "title": "Daily Task", "category": "PLAYGROUND",
        "start_time": "12:00", "end_time": "12:30",
        "classroom_id": classroom['id']
    }).json
    
    tuesday = date.today() + timedelta(days=(8 - date.today().weekday()) % 7)
    wednesday = tuesday + timedelta(days=1)
    
    # Create assignments for Tuesday and Wednesday
    assign_tue = client.post('/api/assignments', json={
        "task_id": task['id'], "aide_id": aide['id'],
        "date": tuesday.isoformat(),
        "start_time": "12:00", "end_time": "12:30"
    }).json
    
    assign_wed = client.post('/api/assignments', json={
        "task_id": task['id'], "aide_id": aide['id'],
        "date": wednesday.isoformat(),
        "start_time": "12:00", "end_time": "12:30"
    }).json
    
    # Mark absent on Tuesday only
    client.post('/api/absences', json={
        "aide_id": aide['id'],
        "date": tuesday.isoformat(),
        "reason": "Sick"
    })
    
    # Verify Tuesday assignment unassigned
    get_tue = client.get(f'/api/assignments/{assign_tue["id"]}')
    assert get_tue.json['status'] == 'UNASSIGNED'
    
    # Verify Wednesday assignment still assigned
    get_wed = client.get(f'/api/assignments/{assign_wed["id"]}')
    assert get_wed.json['status'] == 'ASSIGNED'
    assert get_wed.json['aide_id'] == aide['id']


def test_deleting_absence_does_not_restore_assignments(client):
    """
    Test that deleting an absence does NOT restore assignments
    Administrators must manually reassign tasks
    """
    
    aide = client.post('/api/aides', json={"name": "Test Aide", "colour_hex": "#1ABC9C"}).json
    client.post(f'/api/aides/{aide["id"]}/availability', json={
        "weekday": "FR", "start_time": "08:00", "end_time": "16:00"
    })
    
    classroom = client.post('/api/classrooms', json={"name": "Test Room", "capacity": 20}).json
    task = client.post('/api/tasks', json={
        "title": "Test Task", "category": "CLASS_SUPPORT",
        "start_time": "09:00", "end_time": "10:00",
        "classroom_id": classroom['id']
    }).json
    
    friday = date.today() + timedelta(days=(11 - date.today().weekday()) % 7)
    
    # Create assignment
    assignment = client.post('/api/assignments', json={
        "task_id": task['id'], "aide_id": aide['id'],
        "date": friday.isoformat(),
        "start_time": "09:00", "end_time": "10:00"
    }).json
    
    # Create absence (releases assignment)
    absence = client.post('/api/absences', json={
        "aide_id": aide['id'],
        "date": friday.isoformat(),
        "reason": "Test"
    }).json
    
    # Verify assignment released
    get_assign = client.get(f'/api/assignments/{assignment["id"]}')
    assert get_assign.json['status'] == 'UNASSIGNED'
    
    # Delete absence
    delete_response = client.delete(f'/api/absences/{absence["id"]}')
    assert delete_response.status_code in [200, 204]
    
    # Verify assignment remains unassigned (NOT automatically restored)
    get_assign_after = client.get(f'/api/assignments/{assignment["id"]}')
    assert get_assign_after.json['status'] == 'UNASSIGNED'
    assert get_assign_after.json['aide_id'] is None



