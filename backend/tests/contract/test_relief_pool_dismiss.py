"""
Contract tests for POST /api/relief-pool/{id}/dismiss
Tests the Relief Pool dismissal endpoint.
"""
import pytest
from datetime import date, time
from api.models import db
from api.models.assignment import Assignment


class TestReliefPoolDismiss:
    """Tests for POST /api/relief-pool/{id}/dismiss endpoint."""

    def _create_relief_pool_task(self, db_session, task, original_aide):
        """Helper to create a Relief Pool task."""
        assignment = Assignment(
            task_id=task.id,
            aide_id=None,
            original_aide_id=original_aide.id,
            date=date.today(),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        return assignment

    def test_successful_dismiss(self, client, db_session, sample_task, sample_aide):
        """Task is removed from Relief Pool on successful dismiss."""
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        assignment_id = assignment.id
        
        response = client.post(
            f'/api/relief-pool/{assignment_id}/dismiss',
            json={'version': 1}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == assignment_id
        assert data['status'] == 'dismissed'
        assert 'removed' in data['message'].lower()
        
        # Verify it's actually deleted
        deleted = db_session.get(Assignment, assignment_id)
        assert deleted is None

    def test_dismiss_with_reason(self, client, db_session, sample_task, sample_aide):
        """Dismiss accepts optional reason."""
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/dismiss',
            json={'version': 1, 'reason': 'Class cancelled for assembly'}
        )
        
        assert response.status_code == 200
        # Reason is accepted but not returned in current implementation

    def test_missing_version(self, client, db_session, sample_task, sample_aide):
        """Returns 400 when version not provided."""
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/dismiss',
            json={}
        )
        
        assert response.status_code == 400
        assert 'version' in response.get_json()['error'].lower()

    def test_not_found(self, client):
        """Returns 404 when assignment doesn't exist."""
        response = client.post(
            '/api/relief-pool/99999/dismiss',
            json={'version': 1}
        )
        
        assert response.status_code == 404

    def test_not_in_relief_pool(self, client, db_session, sample_task, sample_aide):
        """Returns 404 when assignment is not in Relief Pool status."""
        # Create an ASSIGNED assignment
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date.today(),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='ASSIGNED',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/dismiss',
            json={'version': 1}
        )
        
        assert response.status_code == 404
        assert 'not in relief pool' in response.get_json()['error'].lower()

    def test_version_conflict(self, client, db_session, sample_task, sample_aide):
        """Returns 409 when version is stale."""
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/dismiss',
            json={'version': 999}  # Wrong version
        )
        
        assert response.status_code == 409




