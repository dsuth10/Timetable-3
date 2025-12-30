"""
Unit tests for assignment series deletion logic.
"""
import pytest
from datetime import date, time, timedelta
from api.models.assignment import Assignment
from api.models.recurring_series import RecurringSeries
# Note: We'll need to implement AssignmentSeriesService later, but we'll use it in tests now (TDD)
from api.services.assignment_service import AssignmentSeriesService


class TestAssignmentSeriesDeleteLogic:
    """Tests for the logic of selective recurring assignment deletion."""

    def test_is_assignment_modified_detects_time_change(self):
        """Should detect if start_time or end_time differs from series template."""
        series = RecurringSeries(
            start_time=time(9, 0),
            end_time=time(10, 0)
        )
        
        # Matching times
        a1 = Assignment(start_time=time(9, 0), end_time=time(10, 0))
        assert AssignmentSeriesService.is_assignment_modified(a1, series) is False
        
        # Start time different
        a2 = Assignment(start_time=time(9, 30), end_time=time(10, 0))
        assert AssignmentSeriesService.is_assignment_modified(a2, series) is True
        
        # End time different
        a3 = Assignment(start_time=time(9, 0), end_time=time(10, 30))
        assert AssignmentSeriesService.is_assignment_modified(a3, series) is True

    def test_get_deletable_assignments_filters_correctly(self, db_session, sample_task, sample_aide):
        """Should find future, non-modified assignments for the same aide/series."""
        # Create series
        series = RecurringSeries(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            recurrence_rule="FREQ=WEEKLY;BYDAY=MO",
            expires_on=date.today() + timedelta(weeks=4),
            start_time=time(9, 0),
            end_time=time(10, 0),
            base_date=date.today()
        )
        db_session.add(series)
        db_session.flush()

        # Create assignments
        # 1. Past assignment (should be skipped)
        a_past = Assignment(
            task_id=sample_task.id, aide_id=sample_aide.id, recurring_series_id=series.id,
            date=date.today() - timedelta(days=7),
            start_time=time(9, 0), end_time=time(10, 0), status='ASSIGNED'
        )
        # 2. Today's assignment (selected)
        a_today = Assignment(
            task_id=sample_task.id, aide_id=sample_aide.id, recurring_series_id=series.id,
            date=date.today(),
            start_time=time(9, 0), end_time=time(10, 0), status='ASSIGNED'
        )
        # 3. Future matching assignment (should be included)
        a_future = Assignment(
            task_id=sample_task.id, aide_id=sample_aide.id, recurring_series_id=series.id,
            date=date.today() + timedelta(days=7),
            start_time=time(9, 0), end_time=time(10, 0), status='ASSIGNED'
        )
        # 4. Future modified assignment (should be skipped)
        a_modified = Assignment(
            task_id=sample_task.id, aide_id=sample_aide.id, recurring_series_id=series.id,
            date=date.today() + timedelta(days=14),
            start_time=time(10, 0), end_time=time(11, 0), status='ASSIGNED'
        )
        # 5. Future different aide (should be skipped)
        a_other_aide = Assignment(
            task_id=sample_task.id, aide_id=999, recurring_series_id=series.id,
            date=date.today() + timedelta(days=21),
            start_time=time(9, 0), end_time=time(10, 0), status='ASSIGNED'
        )
        # 6. Future Relief Pool matching original aide (should be included)
        a_relief = Assignment(
            task_id=sample_task.id, aide_id=None, original_aide_id=sample_aide.id, 
            recurring_series_id=series.id,
            date=date.today() + timedelta(days=28),
            start_time=time(9, 0), end_time=time(10, 0), status='RELIEF_POOL'
        )

        db_session.add_all([a_past, a_today, a_future, a_modified, a_other_aide, a_relief])
        db_session.commit()

        # Run service method
        deletable_ids, skipped_count = AssignmentSeriesService.get_deletable_assignments(a_today.id)
        
        assert a_today.id in deletable_ids
        assert a_future.id in deletable_ids
        assert a_relief.id in deletable_ids
        assert a_past.id not in deletable_ids
        assert a_modified.id not in deletable_ids
        assert a_other_aide.id not in deletable_ids
        
        assert len(deletable_ids) == 3
        # a_modified is skipped because of time. a_past and a_other_aide are skipped by query filters.
        assert skipped_count == 1 

