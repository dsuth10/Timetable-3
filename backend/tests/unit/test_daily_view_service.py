import pytest
from datetime import date, time
from api.models.teacher_aide import TeacherAide
from api.models.task import Task
from api.models.assignment import Assignment
from api.models.absence import Absence
from api.models import db
from api.services.daily_view_service import DailyViewService

@pytest.fixture
def daily_service():
    return DailyViewService()

def test_get_daily_data_empty(daily_service, app):
    with app.app_context():
        view_date = date(2025, 12, 8)
        data = daily_service.get_daily_data(view_date)
        
        assert "aides" in data
        assert "relief_pool" in data
        assert "task_bank" in data
        assert "timeline_config" in data
        assert len(data["aides"]) == 0

def test_get_daily_data_with_content(daily_service, app, sample_aide, sample_task):
    with app.app_context():
        view_date = date(2025, 12, 8)
        
        # Add assignment for today
        asg = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=view_date,
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='ASSIGNED'
        )
        db.session.add(asg)
        
        # Add absence for today
        absent = Absence(aide_id=sample_aide.id, date=view_date)
        db.session.add(absent)
        db.session.commit()
        
        data = daily_service.get_daily_data(view_date)
        
        assert len(data["aides"]) == 1
        assert data["aides"][0]["name"] == sample_aide.name
        assert data["aides"][0]["is_absent"] is True
        assert len(data["aides"][0]["assignments"]) == 1
        assert data["aides"][0]["assignments"][0]["start_time"] == "09:00"

def test_assign_task_from_bank(daily_service, app, sample_aide, sample_task):
    with app.app_context():
        view_date = date(2025, 12, 8)
        payload = {
            "type": "FROM_BANK",
            "id": sample_task.id,
            "date": view_date.isoformat(),
            "aide_id": sample_aide.id,
            "start_time": "10:00:00",
            "end_time": "11:00:00"
        }
        
        result = daily_service.assign_task(payload)
        assert "error" not in result
        assert result["id"] is not None
        
        # Verify assignment created
        asg = Assignment.query.filter_by(aide_id=sample_aide.id, date=view_date).first()
        assert asg is not None
        assert asg.start_time == time(10, 0)

def test_assign_task_collision(daily_service, app, sample_aide, sample_task):
    with app.app_context():
        view_date = date(2025, 12, 8)
        
        # Create existing assignment
        asg = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=view_date,
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='ASSIGNED'
        )
        db.session.add(asg)
        db.session.commit()
        
        # Try to assign overlapping task
        payload = {
            "type": "FROM_BANK",
            "id": sample_task.id,
            "date": view_date.isoformat(),
            "aide_id": sample_aide.id,
            "start_time": "09:30:00",
            "end_time": "10:30:00"
        }
        
        result = daily_service.assign_task(payload)
        assert "error" in result
        assert "error" in result
        assert "Time conflict" in result["error"]


