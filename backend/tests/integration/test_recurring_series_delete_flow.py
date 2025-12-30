"""
Integration test for full recurring series deletion flow for a specific aide.
"""
import pytest
from datetime import date, time, timedelta
from api.models import db
from api.models.assignment import Assignment
from api.models.recurring_series import RecurringSeries
from api.models.teacher_aide import TeacherAide


class TestRecurringSeriesDeleteFlow:
    """Tests the full flow of deleting recurring assignments for a specific aide."""

    def _create_aide(self, db_session, name, colour):
        """Helper to create an aide."""
        aide = TeacherAide(name=name, colour_hex=colour)
        db_session.add(aide)
        db_session.flush()
        return aide

    def _create_series_assignments(self, db_session, task, aide, start_date, weeks=4):
        """Helper to create a series and its assignments."""
        series = RecurringSeries(
            task_id=task.id,
            aide_id=aide.id,
            recurrence_rule="FREQ=WEEKLY;BYDAY=MO",
            expires_on=start_date + timedelta(weeks=weeks),
            start_time=time(9, 0),
            end_time=time(10, 0),
            base_date=start_date
        )
        db_session.add(series)
        db_session.flush()

        assignments = []
        for i in range(weeks):
            occ_date = start_date + timedelta(weeks=i)
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
        
        db_session.flush()
        return series, assignments

    def test_delete_flow_for_one_aide_preserves_others(self, client, db_session, sample_task):
        """Deleting a series for one aide should not affect another aide assigned to the same task template."""
        aide_smith = self._create_aide(db_session, "Aide Smith", "#FF0000")
        aide_jones = self._create_aide(db_session, "Aide Jones", "#00FF00")
        
        # Today is a Monday for the test
        today = date(2025, 10, 6) # Oct 6, 2025 is a Monday
        
        # 1. Create series for Aide Smith (4 weeks)
        series_smith, assignments_smith = self._create_series_assignments(db_session, sample_task, aide_smith, today)
        
        # 2. Create series for Aide Jones (4 weeks) - same task template, different series
        series_jones, assignments_jones = self._create_series_assignments(db_session, sample_task, aide_jones, today)
        
        db_session.commit()
        
        # 3. Delete from Week 2 for Aide Smith
        start_assignment = assignments_smith[1]
        
        response = client.delete(
            f'/api/assignments/{start_assignment.id}/recurring-series-for-aide',
            json={'version': 1}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['deleted_count'] == 3 # Week 2, 3, 4
        
        # 4. Verify Smith's assignments
        assert db_session.get(Assignment, assignments_smith[0].id) is not None # Week 1 preserved (not future)
        assert db_session.get(Assignment, assignments_smith[1].id) is None     # Week 2 deleted
        assert db_session.get(Assignment, assignments_smith[2].id) is None     # Week 3 deleted
        assert db_session.get(Assignment, assignments_smith[3].id) is None     # Week 4 deleted
        
        # 5. Verify Jones's assignments are UNTOUCHED
        for a in assignments_jones:
            assert db_session.get(Assignment, a.id) is not None
            
        # 6. Verify Task template remains
        assert db_session.get(type(sample_task), sample_task.id) is not None

