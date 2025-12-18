"""
Contract tests for DELETE /api/absences/{id} (restoration)
Tests that deleting an absence restores Relief Pool tasks.
"""
import pytest
from datetime import date, time
from api.models import db
from api.models.assignment import Assignment
from api.models.absence import Absence
from api.models.teacher_aide import TeacherAide


class TestAbsencesRestore:
    """Tests for DELETE /api/absences/{id} with task restoration."""

    def _create_absence_with_relief_pool(self, db_session, aide, task, absence_date):
        """Helper to create an absence and Relief Pool task."""
        # Create absence first
        absence = Absence(aide_id=aide.id, date=absence_date, reason='Test')
        db_session.add(absence)
        db_session.commit()
        
        # Create Relief Pool task (simulating what the cascade would do)
        assignment = Assignment(
            task_id=task.id,
            aide_id=None,
            original_aide_id=aide.id,
            date=absence_date,
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='RELIEF_POOL',
            version=2
        )
        db_session.add(assignment)
        db_session.commit()
        
        return absence, assignment

    def test_restores_tasks_to_original_aide(self, client, db_session, sample_task, sample_aide):
        """Available slots are restored to original aide."""
        absence_date = date(2025, 10, 6)
        absence, assignment = self._create_absence_with_relief_pool(
            db_session, sample_aide, sample_task, absence_date
        )
        assignment_id = assignment.id
        
        response = client.delete(f'/api/absences/{absence.id}')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['message'] == 'Absence removed'
        assert data['restored_count'] == 1
        assert len(data['restored_tasks']) == 1
        assert data['restored_tasks'][0]['aide_id'] == sample_aide.id
        assert data['restored_tasks'][0]['status'] == 'ASSIGNED'

    def test_reports_conflicts(self, client, db_session, sample_task, sample_aide):
        """Occupied slots are reported and tasks stay in Relief Pool."""
        absence_date = date(2025, 10, 6)
        absence, relief_assignment = self._create_absence_with_relief_pool(
            db_session, sample_aide, sample_task, absence_date
        )
        
        # Create a conflicting assignment at the same time for the original aide
        conflict = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=absence_date,
            start_time=time(9, 0),  # Same time as Relief Pool task
            end_time=time(9, 30),
            status='ASSIGNED',
            version=1
        )
        db_session.add(conflict)
        db_session.commit()
        
        response = client.delete(f'/api/absences/{absence.id}')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['conflict_count'] == 1
        assert len(data['conflict_tasks']) == 1
        assert 'Time slot now occupied' in data['conflict_tasks'][0]['reason']

    def test_partial_restore(self, client, db_session, sample_task, sample_aide):
        """Mix of restored and conflicting tasks is handled."""
        absence_date = date(2025, 10, 6)
        
        # Create absence
        absence = Absence(aide_id=sample_aide.id, date=absence_date, reason='Test')
        db_session.add(absence)
        db_session.commit()
        
        # Create two Relief Pool tasks
        rp1 = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=absence_date,
            start_time=time(9, 0),
            end_time=time(9, 30),
            status='RELIEF_POOL',
            version=2
        )
        rp2 = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=absence_date,
            start_time=time(10, 0),
            end_time=time(10, 30),
            status='RELIEF_POOL',
            version=2
        )
        db_session.add_all([rp1, rp2])
        db_session.commit()
        
        # Create conflict for first slot only
        conflict = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=absence_date,
            start_time=time(9, 15),  # Overlaps with rp1
            end_time=time(9, 45),
            status='ASSIGNED',
            version=1
        )
        db_session.add(conflict)
        db_session.commit()
        
        response = client.delete(f'/api/absences/{absence.id}')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['restored_count'] == 1  # rp2 restored
        assert data['conflict_count'] == 1  # rp1 conflicted

    def test_absence_not_found(self, client):
        """Returns 404 when absence doesn't exist."""
        response = client.delete('/api/absences/99999')
        
        assert response.status_code == 404

    def test_no_relief_pool_tasks(self, client, db_session, sample_aide):
        """Works correctly when no Relief Pool tasks exist."""
        absence_date = date(2025, 10, 6)
        absence = Absence(aide_id=sample_aide.id, date=absence_date, reason='Test')
        db_session.add(absence)
        db_session.commit()
        
        response = client.delete(f'/api/absences/{absence.id}')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['restored_count'] == 0
        assert data['conflict_count'] == 0
        assert data['restored_tasks'] == []
        assert data['conflict_tasks'] == []

















