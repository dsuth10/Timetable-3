import pytest
from datetime import date, time
from api.models.assignment import Assignment
from api.models.task import Task
from api.models.classroom import Classroom
from api.models.teacher_aide import TeacherAide
from api.models.recurring_series import RecurringSeries
from api.services.assignment_service import AssignmentSeriesService

def test_get_tooltip_data_basic(db_session, sample_assignment, sample_task, sample_classroom, sample_aide):
    """Test get_tooltip_data returns correct aggregated data"""
    data = AssignmentSeriesService.get_tooltip_data(sample_assignment.id)
    
    assert data is not None
    assert data['task_title'] == sample_task.title
    assert data['category'] == sample_task.category
    assert data['classroom']['name'] == sample_classroom.name
    assert data['start_time'] == "09:00:00"
    assert data['end_time'] == "10:00:00"
    assert "John Smith" in data['assigned_aides']
    assert data['recurrence']['is_recurring'] is False
    assert data['notes'] == sample_task.notes

def test_get_tooltip_data_recurring(db_session, sample_task, sample_aide):
    """Test get_tooltip_data handles recurring series correctly"""
    # Create a series
    series = RecurringSeries(
        task_id=sample_task.id,
        aide_id=sample_aide.id,
        recurrence_rule="FREQ=DAILY;COUNT=15",
        expires_on=date(2025, 12, 31),
        start_time=time(9, 0),
        end_time=time(10, 0),
        base_date=date(2025, 10, 6)
    )
    db_session.add(series)
    db_session.flush()
    
    # Create 12 assignments in the series
    assignments = []
    for i in range(12):
        asg = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            recurring_series_id=series.id,
            date=date(2025, 10, 6 + i),
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='ASSIGNED'
        )
        db_session.add(asg)
        assignments.append(asg)
    
    db_session.commit()
    
    # Check the first assignment
    data = AssignmentSeriesService.get_tooltip_data(assignments[0].id)
    assert data['recurrence']['is_recurring'] is True
    assert len(data['recurrence']['dates']) == 10
    assert data['recurrence']['has_more'] is True
    
    # Check the 11th assignment (only 2 left including self)
    data = AssignmentSeriesService.get_tooltip_data(assignments[10].id)
    assert len(data['recurrence']['dates']) == 2
    assert data['recurrence']['has_more'] is False

    # Create a fresh task with no notes
    task = Task(
        title="No Notes Task",
        category="CLASS_SUPPORT",
        start_time=time(9, 0),
        end_time=time(10, 0),
        classroom_id=1,
        notes=None
    )
    db_session.add(task)
    db_session.flush()
    
    asg = Assignment(
        task_id=task.id,
        aide_id=sample_aide.id,
        date=date(2025, 10, 6),
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='ASSIGNED'
    )
    db_session.add(asg)
    db_session.commit()
    
    data = AssignmentSeriesService.get_tooltip_data(asg.id)
    assert data['notes'] == "No notes provided"

def test_get_tooltip_data_unassigned(db_session, sample_task):
    """Test get_tooltip_data handles unassigned tasks"""
    asg = Assignment(
        task_id=sample_task.id,
        aide_id=None,
        date=date(2025, 10, 6),
        start_time=time(9, 0),
        end_time=time(10, 0),
        status='UNASSIGNED'
    )
    db_session.add(asg)
    db_session.commit()
    
    data = AssignmentSeriesService.get_tooltip_data(asg.id)
    assert data['assigned_aides'] == ["None"]

def test_get_tooltip_data_not_found(db_session):
    """Test get_tooltip_data returns None for non-existent ID"""
    data = AssignmentSeriesService.get_tooltip_data(99999)
    assert data is None

