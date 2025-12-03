"""
Integration tests for Relief Pool user flows.
Tests complete scenarios from absence creation to task reassignment.
"""
import pytest
from datetime import date, time, datetime, timedelta
from api.models import db
from api.models.assignment import Assignment
from api.models.absence import Absence
from api.models.teacher_aide import TeacherAide
from api.services.relief_pool_service import ReliefPoolService


class TestAbsenceCreatesReliefPool:
    """Integration test: Absence creates Relief Pool tasks."""

    def test_full_flow_absence_to_relief_pool(self, client, db_session, sample_task, sample_aide):
        """
        Scenario: Creating an absence moves tasks to Relief Pool.
        
        Given: An aide has tasks assigned for a date
        When: An absence is created for that aide on that date
        Then: Tasks are moved to Relief Pool with original aide preserved
        """
        # Setup: Aide has tasks assigned
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date(2025, 10, 6),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='ASSIGNED',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        assignment_id = assignment.id
        
        # Action: Create absence
        response = client.post('/api/absences', json={
            'aide_id': sample_aide.id,
            'date': '2025-10-06',
            'reason': 'Sick'
        })
        assert response.status_code == 201
        
        # Verify: Task is now in Relief Pool
        updated = db_session.get(Assignment, assignment_id)
        assert updated.status == 'RELIEF_POOL'
        assert updated.aide_id is None
        assert updated.original_aide_id == sample_aide.id
        
        # Verify: Task appears in Relief Pool API
        pool_response = client.get('/api/relief-pool?include_expired=true')
        assert pool_response.status_code == 200
        pool_data = pool_response.get_json()
        assert pool_data['total_count'] == 1


class TestReassignReliefPoolTask:
    """Integration test: Reassign Relief Pool task to new aide."""

    def test_full_flow_reassignment(self, client, db_session, sample_task, sample_aide):
        """
        Scenario: Reassigning a Relief Pool task to another aide.
        
        Given: A task is in the Relief Pool
        When: The task is reassigned to a different aide
        Then: The task is removed from Relief Pool and assigned to new aide
        """
        # Setup: Create Relief Pool task
        relief_task = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=date.today(),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(relief_task)
        
        new_aide = TeacherAide(name="Jane Doe", qualifications="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        relief_task_id = relief_task.id
        
        # Action: Reassign to new aide
        response = client.post(
            f'/api/relief-pool/{relief_task_id}/reassign',
            json={'aide_id': new_aide.id, 'version': 1}
        )
        assert response.status_code == 200
        
        # Verify: Task is now assigned to new aide
        updated = db_session.get(Assignment, relief_task_id)
        assert updated.status == 'ASSIGNED'
        assert updated.aide_id == new_aide.id
        assert updated.original_aide_id is None  # Cleared
        
        # Verify: Task no longer in Relief Pool
        pool_response = client.get('/api/relief-pool')
        assert pool_response.get_json()['total_count'] == 0


class TestDateRestriction:
    """Integration test: Date restriction enforcement."""

    def test_date_implicit_on_reassign(self, client, db_session, sample_task, sample_aide):
        """
        Scenario: Relief Pool tasks retain their original date.
        
        Given: A Relief Pool task for a specific date
        When: The task is reassigned
        Then: It keeps its original date
        """
        # Setup: Relief Pool task for today
        relief_task = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=date.today(),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(relief_task)
        
        new_aide = TeacherAide(name="Jane Doe", qualifications="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        original_date = relief_task.date
        
        # Action: Reassign
        response = client.post(
            f'/api/relief-pool/{relief_task.id}/reassign',
            json={'aide_id': new_aide.id, 'version': 1}
        )
        
        # Verify: Date is preserved
        assert response.status_code == 200
        data = response.get_json()
        assert data['date'] == original_date.isoformat()


class TestAbsenceRestoration:
    """Integration test: Absence restoration."""

    def test_full_restoration_flow(self, client, db_session, sample_task, sample_aide):
        """
        Scenario: Deleting an absence restores tasks to original aide.
        
        Given: An absence exists with Relief Pool tasks
        When: The absence is deleted
        Then: Tasks are restored to the original aide (if slots available)
        """
        # Setup: Create absence and Relief Pool task directly
        absence = Absence(aide_id=sample_aide.id, date=date(2025, 10, 6), reason='Sick')
        db_session.add(absence)
        db_session.commit()
        
        relief_task = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=date(2025, 10, 6),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=2
        )
        db_session.add(relief_task)
        db_session.commit()
        relief_task_id = relief_task.id
        
        # Action: Delete absence
        response = client.delete(f'/api/absences/{absence.id}')
        assert response.status_code == 200
        
        # Verify: Task restored to original aide
        updated = db_session.get(Assignment, relief_task_id)
        assert updated.status == 'ASSIGNED'
        assert updated.aide_id == sample_aide.id
        assert updated.original_aide_id is None


class TestCleanup:
    """Integration test: End-of-day cleanup."""

    def test_cleanup_removes_expired(self, client, db_session, sample_task, sample_aide):
        """
        Scenario: Cleanup removes expired Relief Pool tasks.
        
        Given: Relief Pool tasks from past dates exist
        When: Cleanup runs
        Then: Expired tasks are removed
        """
        # Setup: Create expired Relief Pool task (yesterday)
        yesterday = date.today() - timedelta(days=1)
        expired_task = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=yesterday,
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(expired_task)
        db_session.commit()
        expired_id = expired_task.id
        
        # Action: Run cleanup
        result = ReliefPoolService.cleanup_expired()
        
        # Verify: Task removed
        assert result['cleaned_up'] >= 1
        assert db_session.get(Assignment, expired_id) is None

    def test_cleanup_preserves_future(self, client, db_session, sample_task, sample_aide):
        """
        Scenario: Cleanup preserves future Relief Pool tasks.
        
        Given: Relief Pool tasks for future dates exist
        When: Cleanup runs
        Then: Future tasks are preserved
        """
        # Setup: Create future Relief Pool task
        tomorrow = date.today() + timedelta(days=1)
        future_task = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=tomorrow,
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(future_task)
        db_session.commit()
        future_id = future_task.id
        
        # Action: Run cleanup
        ReliefPoolService.cleanup_expired()
        
        # Verify: Task still exists
        assert db_session.get(Assignment, future_id) is not None


class TestTimeAdjustmentOnReassign:
    """Integration test: Time adjustment during reassignment."""

    def test_time_adjustment_applied(self, client, db_session, sample_task, sample_aide):
        """
        Scenario: User adjusts start/end times during reassignment.
        
        Given: A Relief Pool task with specific times
        When: User reassigns with different times
        Then: New times are applied
        """
        # Setup: Relief Pool task
        relief_task = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=date.today(),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(relief_task)
        
        new_aide = TeacherAide(name="Jane Doe", qualifications="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        # Action: Reassign with new times
        response = client.post(
            f'/api/relief-pool/{relief_task.id}/reassign',
            json={
                'aide_id': new_aide.id,
                'version': 1,
                'start_time': '10:00:00',
                'end_time': '10:30:00'
            }
        )
        
        # Verify: New times applied
        assert response.status_code == 200
        data = response.get_json()
        assert data['start_time'] == '10:00:00'
        assert data['end_time'] == '10:30:00'


class TestConflictDuringReassign:
    """Integration test: Conflict during Relief Pool reassignment."""

    def test_conflict_prevents_reassign(self, client, db_session, sample_task, sample_aide):
        """
        Scenario: Conflict detection during Relief Pool reassignment.
        
        Given: A Relief Pool task and a target aide with overlapping assignment
        When: User tries to reassign to that aide
        Then: Conflict is detected and reassignment fails
        """
        # Setup: Relief Pool task
        relief_task = Assignment(
            task_id=sample_task.id,
            aide_id=None,
            original_aide_id=sample_aide.id,
            date=date.today(),
            start_time=time(9, 10),
            end_time=time(9, 40),
            status='RELIEF_POOL',
            version=1
        )
        db_session.add(relief_task)
        
        new_aide = TeacherAide(name="Jane Doe", qualifications="General", colour_hex="#00FF00")
        db_session.add(new_aide)
        db_session.commit()
        
        # Create conflicting assignment for new_aide
        conflict = Assignment(
            task_id=sample_task.id,
            aide_id=new_aide.id,
            date=date.today(),
            start_time=time(9, 0),
            end_time=time(9, 30),  # Overlaps with 9:10-9:40
            status='ASSIGNED',
            version=1
        )
        db_session.add(conflict)
        db_session.commit()
        
        # Action: Try to reassign
        response = client.post(
            f'/api/relief-pool/{relief_task.id}/reassign',
            json={'aide_id': new_aide.id, 'version': 1}
        )
        
        # Verify: Conflict detected
        assert response.status_code == 409
        assert 'conflict' in response.get_json()['error'].lower()
        
        # Verify: Task remains in Relief Pool
        updated = db_session.get(Assignment, relief_task.id)
        assert updated.status == 'RELIEF_POOL'

