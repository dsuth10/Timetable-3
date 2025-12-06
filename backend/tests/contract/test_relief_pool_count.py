"""
Contract tests for GET /api/relief-pool/count
Tests the Relief Pool count endpoint for badge display.
"""
import pytest
from datetime import date, time
from api.models.assignment import Assignment


class TestReliefPoolCount:
    """Tests for GET /api/relief-pool/count endpoint."""

    def test_empty_relief_pool_count(self, client):
        """Returns zero count when no tasks in Relief Pool."""
        response = client.get('/api/relief-pool/count')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] == 0
        assert data['by_date'] == {}

    def test_returns_correct_count(self, client, db_session, sample_task, sample_aide):
        """Returns correct total count of Relief Pool tasks."""
        # Create multiple Relief Pool tasks
        for i in range(3):
            assignment = Assignment(
                task_id=sample_task.id,
                aide_id=None,
                original_aide_id=sample_aide.id,
                date=date.today(),
                start_time=time(9 + i, 0),
                end_time=time(23, 30),  # Late end time
                status='RELIEF_POOL',
                version=1
            )
            db_session.add(assignment)
        db_session.commit()
        
        response = client.get('/api/relief-pool/count')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] == 3

    def test_count_by_date(self, client, db_session, sample_task, sample_aide):
        """Returns count broken down by date."""
        today = date.today()
        tomorrow = date(today.year, today.month, today.day + 1 if today.day < 28 else 1)
        
        # Create 2 tasks for today
        for i in range(2):
            assignment = Assignment(
                task_id=sample_task.id,
                aide_id=None,
                original_aide_id=sample_aide.id,
                date=today,
                start_time=time(9 + i, 0),
                end_time=time(23, 30),
                status='RELIEF_POOL',
                version=1
            )
            db_session.add(assignment)
        
        # Create 1 task for tomorrow
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=tomorrow,
            start_time=time(10, 0),
            end_time=time(10, 30),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        
        response = client.get('/api/relief-pool/count')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] == 3
        assert data['by_date'][today.isoformat()] == 2
        assert data['by_date'][tomorrow.isoformat()] == 1

    def test_excludes_expired_from_count(self, client, db_session, sample_task, sample_aide):
        """Expired tasks are not included in count."""
        # Create a task from yesterday (expired)
        yesterday = date(2020, 1, 1)
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=yesterday,
            start_time=time(9, 0),
            end_time=time(9, 30),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        
        response = client.get('/api/relief-pool/count')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] == 0

    def test_excludes_non_relief_pool_status(self, client, db_session, sample_task, sample_aide):
        """Only counts RELIEF_POOL status tasks."""
        # Create ASSIGNED task
        assignment1 = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date.today(),
            start_time=time(9, 0),
            end_time=time(9, 30),
            status='ASSIGNED',
            version=1
        )
        # Create UNASSIGNED task
        assignment2 = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            date=date.today(),
            start_time=time(10, 0),
            end_time=time(10, 30),
            status='UNASSIGNED',
            version=1
        )
        # Create RELIEF_POOL task
        assignment3 = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=date.today(),
            start_time=time(11, 0),
            end_time=time(23, 30),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add_all([assignment1, assignment2, assignment3])
        db_session.commit()
        
        response = client.get('/api/relief-pool/count')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] == 1




