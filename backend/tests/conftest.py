"""
Pytest configuration and shared fixtures
"""
import os
import sys
import pytest
from datetime import date, time

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from api.models import db
from sqlalchemy.orm import Session
from api.models.teacher_aide import TeacherAide
from api.models.availability import Availability
from api.models.classroom import Classroom
from api.models.task import Task
from api.models.assignment import Assignment
from api.models.absence import Absence
from api.models.recurring_series import RecurringSeries
from api.models.request import Request
from sqlalchemy import event, text as sa_text
from sqlalchemy.pool import StaticPool


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite://',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SQLALCHEMY_ENGINE_OPTIONS': {
            'poolclass': StaticPool,
        }
    }

    app = create_app(test_config)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def db_session(app):
    """Creates a new database session for a test with absolute isolation."""
    with app.app_context():
        # 1. Setup connection and transaction
        connection = db.engine.connect()
        transaction = connection.begin()
        
        # 2. Configure session
        db.session.configure(bind=connection, expire_on_commit=False)
        
        # 3. Global Monkeypatch of Session.commit to Session.flush
        # This is more robust than patching just the proxy.
        original_commit = Session.commit
        def mocked_commit(self):
            self.flush()
        Session.commit = mocked_commit
        
        # 4. Clean tables
        for table in ['assignments', 'recurring_series', 'availability', 'absences', 'requests', 'tasks', 'classrooms', 'teacher_aides']:
            db.session.execute(sa_text(f'DELETE FROM {table}'))
        db.session.flush()
        
        try:
            yield db.session
        finally:
            # 5. Restore and cleanup
            Session.commit = original_commit
            transaction.rollback()
            connection.close()
            db.session.remove()


@pytest.fixture(autouse=True)
def _isolation(db_session):
    """Ensure db_session is used for every test."""
    pass


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def sample_aide(db_session, app):
    with app.app_context():
        aide = TeacherAide(
            name="John Smith",
            details="Special Education",
            colour_hex="#FF5733"
        )
        db_session.add(aide)
        db_session.flush()
        return aide


@pytest.fixture
def sample_classroom(db_session, app):
    with app.app_context():
        classroom = Classroom(
            name="Room 101",
            capacity=25,
            notes="Grade 3A"
        )
        db_session.add(classroom)
        db_session.flush()
        return classroom


@pytest.fixture
def sample_task(db_session, app, sample_classroom):
    with app.app_context():
        task = Task(
            title="Reading Support",
            category="CLASS_SUPPORT",
            start_time=time(9, 0),
            end_time=time(10, 0),
            classroom_id=sample_classroom.id,
            notes="Small group reading"
        )
        db_session.add(task)
        db_session.flush()
        return task


@pytest.fixture
def sample_assignment(db_session, app, sample_task, sample_aide):
    with app.app_context():
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date(2025, 10, 6),
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='ASSIGNED',
            version=1
        )
        db_session.add(assignment)
        db_session.flush()
        return assignment


@pytest.fixture
def sample_availability(db_session, app, sample_aide):
    with app.app_context():
        avail = Availability(
            aide_id=sample_aide.id,
            weekday='MO',
            start_time=time(8, 0),
            end_time=time(16, 0)
        )
        db_session.add(avail)
        db_session.flush()
        return avail

