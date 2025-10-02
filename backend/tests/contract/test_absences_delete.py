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


def test_delete_absence_does_not_restore_assignments(client, sample_aide):
    """Test DELETE /api/absences does not automatically restore assignments
    
    Note: Assignments released due to absence remain unassigned after absence deletion.
    Administrator must manually reassign them.
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
    
    # Create absence (should release assignment)
    absence = Absence(
        aide_id=sample_aide.id,
        date=date(2025, 10, 10),
        reason="Test"
    )
    db.session.add(absence)
    db.session.commit()
    
    # Delete absence
    response = client.delete(f'/api/absences/{absence.id}')
    assert response.status_code in [200, 204]
    
    # Verify assignment is still unassigned
    assignment_response = client.get(f'/api/assignments/{assignment.id}')
    assert assignment_response.json['status'] == 'UNASSIGNED'
    assert assignment_response.json['aide_id'] is None

