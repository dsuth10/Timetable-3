import pytest
from datetime import date, time
from api.models.teacher_aide import TeacherAide
from api.models.task import Task
from api.models.assignment import Assignment
from api.models.availability import Availability
from api.models import db
from api.services.daily_view_service import DailyViewService

@pytest.fixture
def daily_service():
    return DailyViewService()

def test_assign_task_availability_violation(daily_service, app, sample_aide, sample_task):
    """Test that assign_task fails if the aide is not available at that time"""
    with app.app_context():
        view_date = date(2025, 12, 8) # A Monday
        
        # Set availability for Monday only 8:00 - 9:00
        avail = Availability(
            aide_id=sample_aide.id,
            weekday='MO',
            start_time=time(8, 0),
            end_time=time(9, 0)
        )
        db.session.add(avail)
        db.session.commit()
        
        # Try to assign task at 10:00 (outside availability)
        payload = {
            "type": "FROM_BANK",
            "id": sample_task.id,
            "date": view_date.isoformat(),
            "aide_id": sample_aide.id,
            "start_time": "10:00",
            "end_time": "11:00"
        }
        
        result = daily_service.assign_task(payload)
        
        assert "error" in result
        assert "available" in result["error"].lower()
        assert result.get("availability_issue")

def test_assign_task_availability_success(daily_service, app, sample_aide, sample_task):
    """Test that assign_task succeeds if the aide is available"""
    with app.app_context():
        view_date = date(2025, 12, 8) # A Monday
        
        # Set availability for Monday 8:00 - 15:00
        avail = Availability(
            aide_id=sample_aide.id,
            weekday='MO',
            start_time=time(8, 0),
            end_time=time(15, 0)
        )
        db.session.add(avail)
        db.session.commit()
        
        # Try to assign task at 10:00 (within availability)
        payload = {
            "type": "FROM_BANK",
            "id": sample_task.id,
            "date": view_date.isoformat(),
            "aide_id": sample_aide.id,
            "start_time": "10:00",
            "end_time": "11:00"
        }
        
        result = daily_service.assign_task(payload)
        
        assert "error" not in result
        assert result["id"] is not None
