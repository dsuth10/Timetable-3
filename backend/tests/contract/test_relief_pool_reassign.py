"""
Contract tests for POST /api/relief-pool/{id}/reassign
Tests the Relief Pool reassignment endpoint.
"""
import pytest
from datetime import date, time
from api.models import db
from api.models.assignment import Assignment
from api.models.teacher_aide import TeacherAide


class TestReliefPoolReassign:
    """Tests for POST /api/relief-pool/{id}/reassign endpoint."""

    def _create_relief_pool_task(self, db_session, task, original_aide, task_date=None):
        """Helper to create a Relief Pool task."""
        assignment = Assignment(
            task_id=task.id,
            aide_id=None,
            original_aide_id=original_aide.id,
            date=task_date or date.today(),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        return assignment

    def test_successful_reassign(self, client, db_session, sample_task, sample_aide):
        """Task moves from RELIEF_POOL to ASSIGNED status on successful reassign."""
        # Create another aide to reassign to
        new_aide = TeacherAide(name="Jane Doe", details="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/reassign',
            json={'aide_id': new_aide.id, 'version': 1}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'ASSIGNED'
        assert data['aide_id'] == new_aide.id
        assert data['original_aide_id'] is None  # Cleared after reassignment
        assert data['version'] == 2

    def test_missing_aide_id(self, client, db_session, sample_task, sample_aide):
        """Returns 400 when aide_id not provided."""
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/reassign',
            json={'version': 1}
        )
        
        assert response.status_code == 400
        assert 'aide_id' in response.get_json()['error'].lower()

    def test_missing_version(self, client, db_session, sample_task, sample_aide):
        """Returns 400 when version not provided."""
        new_aide = TeacherAide(name="Jane Doe", details="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/reassign',
            json={'aide_id': new_aide.id}
        )
        
        assert response.status_code == 400
        assert 'version' in response.get_json()['error'].lower()

    def test_invalid_aide(self, client, db_session, sample_task, sample_aide):
        """Returns error when aide_id doesn't exist."""
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/reassign',
            json={'aide_id': 99999, 'version': 1}
        )
        
        # Route returns 404 for "not found" errors which includes invalid aide
        assert response.status_code in [400, 404]
        assert 'not found' in response.get_json()['error'].lower()

    def test_not_found(self, client):
        """Returns 404 when assignment doesn't exist."""
        response = client.post(
            '/api/relief-pool/99999/reassign',
            json={'aide_id': 1, 'version': 1}
        )
        
        assert response.status_code == 404

    def test_not_in_relief_pool(self, client, db_session, sample_task, sample_aide):
        """Returns error when assignment is not in Relief Pool status."""
        # Create another aide
        new_aide = TeacherAide(name="Jane Doe", details="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        # Create an ASSIGNED assignment (not in Relief Pool)
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
            f'/api/relief-pool/{assignment.id}/reassign',
            json={'aide_id': new_aide.id, 'version': 1}
        )
        
        # Route returns 400 for invalid status (not found only for non-existent)
        assert response.status_code in [400, 404]
        assert 'not in relief pool' in response.get_json()['error'].lower()

    def test_version_conflict(self, client, db_session, sample_task, sample_aide):
        """Returns 409 when version is stale."""
        new_aide = TeacherAide(name="Jane Doe", details="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/reassign',
            json={'aide_id': new_aide.id, 'version': 999}  # Wrong version
        )
        
        assert response.status_code == 409

    def test_time_conflict(self, client, db_session, sample_task, sample_aide):
        """Returns 409 when time slot conflict exists."""
        new_aide = TeacherAide(name="Jane Doe", details="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        # Create Relief Pool task
        relief_task = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        # Create existing assignment for new_aide at same time
        existing = Assignment(
            task_id=sample_task.id,
            aide_id=new_aide.id,
            date=date.today(),
            start_time=time(9, 0),  # Overlaps with 9:10-9:40
            end_time=time(9, 30),
            status='ASSIGNED',
            version=1
        )
        db_session.add(existing)
        db_session.commit()
        
        response = client.post(
            f'/api/relief-pool/{relief_task.id}/reassign',
            json={'aide_id': new_aide.id, 'version': 1}
        )
        
        assert response.status_code == 409
        assert 'conflict' in response.get_json()['error'].lower()

    def test_time_adjustment(self, client, db_session, sample_task, sample_aide):
        """New times are validated and applied."""
        new_aide = TeacherAide(name="Jane Doe", details="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        assignment = self._create_relief_pool_task(db_session, sample_task, sample_aide)
        
        response = client.post(
            f'/api/relief-pool/{assignment.id}/reassign',
            json={
                'aide_id': new_aide.id,
                'version': 1,
                'start_time': '10:00:00',
                'end_time': '10:30:00'
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['start_time'] == '10:00:00'
        assert data['end_time'] == '10:30:00'

