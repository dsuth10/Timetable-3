"""
Contract tests for POST /api/absences (Relief Pool cascade)
Tests that creating an absence moves assignments to Relief Pool.
"""
import pytest
from datetime import date, time
from api.models import db
from api.models.assignment import Assignment


class TestAbsencesReliefPoolCascade:
    """Tests for POST /api/absences with Relief Pool behavior."""

    def test_creates_relief_pool_tasks(self, client, db_session, sample_task, sample_aide):
        """Tasks move to RELIEF_POOL status instead of UNASSIGNED."""
        # Create assignment for the aide
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date(2025, 10, 6),
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='ASSIGNED',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        assignment_id = assignment.id
        
        # Create absence
        response = client.post('/api/absences', json={
            'aide_id': sample_aide.id,
            'date': '2025-10-06',
            'reason': 'Sick leave'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        
        # Check response has Relief Pool info
        assert 'relief_pool_tasks' in data
        assert 'relief_pool_count' in data
        assert data['relief_pool_count'] == 1
        assert data['relief_pool_tasks'][0]['status'] == 'RELIEF_POOL'

    def test_preserves_original_aide_id(self, client, db_session, sample_task, sample_aide):
        """Original aide is stored when moving to Relief Pool."""
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date(2025, 10, 6),
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='ASSIGNED',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        assignment_id = assignment.id
        
        # Create absence
        response = client.post('/api/absences', json={
            'aide_id': sample_aide.id,
            'date': '2025-10-06'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        
        # Verify original_aide_id is set
        assert data['relief_pool_tasks'][0]['original_aide_id'] == sample_aide.id

    def test_returns_relief_pool_count(self, client, db_session, sample_task, sample_aide):
        """Response includes relief_pool_count."""
        # Create multiple assignments
        for i in range(3):
            assignment = Assignment(
                task_id=sample_task.id,
                aide_id=sample_aide.id,
                date=date(2025, 10, 6),
                start_time=time(9 + i, 0),
                end_time=time(9 + i, 30),
                status='ASSIGNED',
                version=1
            )
            db_session.add(assignment)
        db_session.commit()
        
        response = client.post('/api/absences', json={
            'aide_id': sample_aide.id,
            'date': '2025-10-06'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['relief_pool_count'] == 3

    def test_only_affects_assigned_and_in_progress(self, client, db_session, sample_task, sample_aide):
        """Only ASSIGNED and IN_PROGRESS tasks are moved to Relief Pool."""
        # ASSIGNED - should be moved
        a1 = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date(2025, 10, 6),
            start_time=time(9, 0),
            end_time=time(9, 30),
            status='ASSIGNED',
            version=1
        )
        # IN_PROGRESS - should be moved
        a2 = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date(2025, 10, 6),
            start_time=time(10, 0),
            end_time=time(10, 30),
            status='IN_PROGRESS',
            version=1
        )
        # COMPLETE - should NOT be moved
        a3 = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date(2025, 10, 6),
            start_time=time(11, 0),
            end_time=time(11, 30),
            status='COMPLETE',
            version=1
        )
        db_session.add_all([a1, a2, a3])
        db_session.commit()
        
        response = client.post('/api/absences', json={
            'aide_id': sample_aide.id,
            'date': '2025-10-06'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['relief_pool_count'] == 2  # Only ASSIGNED and IN_PROGRESS

    def test_no_tasks_to_release(self, client, db_session, sample_aide):
        """Works correctly when aide has no tasks on that date."""
        response = client.post('/api/absences', json={
            'aide_id': sample_aide.id,
            'date': '2025-10-06'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['relief_pool_tasks'] == []
        assert data['relief_pool_count'] == 0



























