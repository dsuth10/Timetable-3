"""
Contract tests for DELETE /api/assignments/{id}/recurring-series-for-aide
Tests the selective recurring assignment deletion endpoint.
"""
import pytest
from datetime import date, time, timedelta
from api.models import db
from api.models.assignment import Assignment
from api.models.recurring_series import RecurringSeries


class TestDeleteRecurringSeriesForAide:
    """Tests for DELETE /api/assignments/{id}/recurring-series-for-aide endpoint."""

    def _create_recurring_series(self, db_session, task, aide):
        """Helper to create a recurring series and assignments."""
        series = RecurringSeries(
            task_id=task.id,
            aide_id=aide.id,
            recurrence_rule="FREQ=WEEKLY;BYDAY=MO",
            expires_on=date.today() + timedelta(weeks=4),
            start_time=time(9, 0),
            end_time=time(10, 0),
            base_date=date.today()
        )
        db_session.add(series)
        db_session.flush()

        assignments = []
        for i in range(4):
            occ_date = date.today() + timedelta(weeks=i)
            assignment = Assignment(
                task_id=task.id,
                aide_id=aide.id,
                recurring_series_id=series.id,
                date=occ_date,
                start_time=time(9, 0),
                end_time=time(10, 0),
                status='ASSIGNED',
                version=1
            )
            db_session.add(assignment)
            assignments.append(assignment)
        
        db_session.commit()
        return series, assignments

    def test_successful_deletion(self, client, db_session, sample_task, sample_aide):
        """Should delete current and future assignments in series for this aide."""
        series, assignments = self._create_recurring_series(db_session, sample_task, sample_aide)
        start_assignment = assignments[1] # Week 2
        
        response = client.delete(
            f'/api/assignments/{start_assignment.id}/recurring-series-for-aide',
            json={'version': 1}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['deleted_count'] == 3 # Week 2, 3, 4
        assert len(data['deleted_ids']) == 3
        assert 'removed' in data['message'].lower()
        
        # Verify Week 1 remains
        assert db_session.get(Assignment, assignments[0].id) is not None
        # Verify others deleted
        assert db_session.get(Assignment, assignments[1].id) is None
        assert db_session.get(Assignment, assignments[2].id) is None
        assert db_session.get(Assignment, assignments[3].id) is None

    def test_preview_mode(self, client, db_session, sample_task, sample_aide):
        """Should return counts without deleting when preview=true."""
        series, assignments = self._create_recurring_series(db_session, sample_task, sample_aide)
        start_assignment = assignments[1]
        
        response = client.delete(
            f'/api/assignments/{start_assignment.id}/recurring-series-for-aide?preview=true',
            json={'version': 1}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['preview'] is True
        assert data['would_delete_count'] == 3
        
        # Verify none deleted
        for a in assignments:
            assert db_session.get(Assignment, a.id) is not None

    def test_non_recurring_assignment(self, client, db_session, sample_task, sample_aide):
        """Returns 400 when assignment has no recurring_series_id."""
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date.today(),
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='ASSIGNED',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        
        response = client.delete(
            f'/api/assignments/{assignment.id}/recurring-series-for-aide',
            json={'version': 1}
        )
        
        assert response.status_code == 400
        assert 'not part of a recurring series' in response.get_json()['error'].lower()

    def test_version_conflict(self, client, db_session, sample_task, sample_aide):
        """Returns 409 when version mismatch."""
        series, assignments = self._create_recurring_series(db_session, sample_task, sample_aide)
        
        response = client.delete(
            f'/api/assignments/{assignments[0].id}/recurring-series-for-aide',
            json={'version': 99} # Wrong version
        )
        
        assert response.status_code == 409
        assert 'modified by another user' in response.get_json()['error'].lower()

    def test_missing_version(self, client, db_session, sample_task, sample_aide):
        """Returns 400 when version missing."""
        series, assignments = self._create_recurring_series(db_session, sample_task, sample_aide)
        
        response = client.delete(
            f'/api/assignments/{assignments[0].id}/recurring-series-for-aide',
            json={}
        )
        
        assert response.status_code == 400
        assert 'version' in response.get_json()['error'].lower()

    def test_deletion_skips_modified_assignments(self, client, db_session, sample_task, sample_aide):
        """Should skip assignments whose times have been modified."""
        series, assignments = self._create_recurring_series(db_session, sample_task, sample_aide)
        
        # Modify Week 3 (index 2)
        modified_assignment = assignments[2]
        modified_assignment.start_time = time(10, 0)
        modified_assignment.end_time = time(11, 0)
        db_session.commit()
        
        # Delete from Week 1
        response = client.delete(
            f'/api/assignments/{assignments[0].id}/recurring-series-for-aide',
            json={'version': 1}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['deleted_count'] == 3 # Week 1, 2, 4
        assert data['skipped_count'] == 1 # Week 3
        
        # Verify Week 3 still exists
        assert db_session.get(Assignment, modified_assignment.id) is not None
        # Others deleted
        assert db_session.get(Assignment, assignments[0].id) is None
        assert db_session.get(Assignment, assignments[1].id) is None
        assert db_session.get(Assignment, assignments[3].id) is None

    def test_deletion_includes_relief_pool_assignments(self, client, db_session, sample_task, sample_aide):
        """Should include assignments in Relief Pool if they belong to the same aide and series."""
        series, assignments = self._create_recurring_series(db_session, sample_task, sample_aide)
        
        # Move Week 3 (index 2) to Relief Pool
        relief_assignment = assignments[2]
        relief_assignment.aide_id = None
        relief_assignment.original_aide_id = sample_aide.id
        relief_assignment.status = 'RELIEF_POOL'
        db_session.commit()
        
        # Delete from Week 1
        response = client.delete(
            f'/api/assignments/{assignments[0].id}/recurring-series-for-aide',
            json={'version': 1}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['deleted_count'] == 4 # All 4 deleted
        
        # Verify Relief Pool assignment is deleted
        assert db_session.get(Assignment, relief_assignment.id) is None

    def test_past_assignments_preserved(self, client, db_session, sample_task, sample_aide):
        """Only future and current assignments should be deleted."""
        # Create series starting in the past
        past_date = date.today() - timedelta(weeks=2)
        series, assignments = self._create_recurring_series(db_session, sample_task, sample_aide)
        
        # Update dates to be past/present/future
        for i in range(4):
            assignments[i].date = past_date + timedelta(weeks=i)
        db_session.commit()
        
        # Assignments: Week 1 (2 wks ago), Week 2 (1 wk ago), Week 3 (today), Week 4 (1 wk from now)
        # Delete from Week 3 (today)
        response = client.delete(
            f'/api/assignments/{assignments[2].id}/recurring-series-for-aide',
            json={'version': 1}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['deleted_count'] == 2 # Week 3, 4
        
        # Verify past assignments remain
        assert db_session.get(Assignment, assignments[0].id) is not None
        assert db_session.get(Assignment, assignments[1].id) is not None
        # Future/present deleted
        assert db_session.get(Assignment, assignments[2].id) is None
        assert db_session.get(Assignment, assignments[3].id) is None


