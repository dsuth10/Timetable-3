"""
T020: Contract test for DELETE /api/absences/{id}
Tests absence deletion
"""
import pytest
from datetime import date, time


def test_delete_absence_success(client, sample_aide):
    """Test DELETE /api/absences/{id} deletes absence successfully"""
    from api.models.absence import Absence
    from api.models import db
    
    absence = Absence(
        aide_id=sample_aide.id,
        date=date(2025, 10, 10),
        reason="Test"
    )
    db.session.add(absence)
    db.session.commit()
    absence_id = absence.id
    
    response = client.delete(f'/api/absences/{absence_id}')
    
    assert response.status_code == 204 or response.status_code == 200


def test_delete_absence_not_found(client):
    """Test DELETE /api/absences/{id} returns 404 for non-existent absence"""
    response = client.delete('/api/absences/99999')
    
    assert response.status_code == 404
    assert 'error' in response.json


def test_delete_absence_restores_assignments(client, sample_aide):
    """Test DELETE /api/absences automatically restores assignments to original aide.
    
    Note: Assignments released due to absence are moved to Relief Pool.
    On absence deletion, they are automatically restored if the slot is still free.
    """
    from api.models.absence import Absence
    from api.models.assignment import Assignment
    from api.models.task import Task
    from api.models import db
    
    # Create task and assignment
    task = Task(
        title="Test Task",
        category="CLASS_SUPPORT",
        start_time=time(9, 0),
        end_time=time(10, 0),
        classroom_id=1
    )
    db.session.add(task)
    db.session.flush()
    
    assignment = Assignment(
        task_id=task.id,
        aide_id=sample_aide.id,
        date=date(2025, 10, 10),
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='ASSIGNED',
        version=1
    )
    db.session.add(assignment)
    db.session.flush()
    
    # Create absence via API (should release assignment)
    response = client.post('/api/absences', json={
        "aide_id": sample_aide.id,
        "date": "2025-10-10",
        "reason": "Test"
    })
    assert response.status_code == 201
    absence_id = response.json['id']
    
    # Delete absence
    response = client.delete(f'/api/absences/{absence_id}')
    assert response.status_code in [200, 204]
    
    # Verify assignment is restored to the aide
    assignment_response = client.get(f'/api/assignments/{assignment.id}')
    assert assignment_response.json['status'] == 'ASSIGNED'
    assert assignment_response.json['aide_id'] == sample_aide.id

