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
from api.models.teacher_aide import TeacherAide
from api.models.availability import Availability
from api.models.classroom import Classroom
from api.models.task import Task
from api.models.assignment import Assignment
from api.models.absence import Absence
from api.models.request import Request
from sqlalchemy import event, text as sa_text


@pytest.fixture(scope='session')
def app():
    """Create application for testing with a single shared DB connection and root tx."""
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False
    }

    app = create_app(test_config)

    with app.app_context():
        connection = db.engine.connect()
        app.config['_TEST_DB_CONNECTION'] = connection
        db.session.bind = connection
        db.create_all()
        root_tx = connection.begin()
        app.config['_TEST_DB_ROOT_TX'] = root_tx
        yield app
        try:
            root_tx.rollback()
        finally:
            db.session.remove()
            connection.close()


@pytest.fixture(autouse=True)
def _db_isolation(app):
    """Use a SAVEPOINT per test; also hard-reset table contents to avoid collisions."""
    # Fresh savepoint
    nested = db.session.begin_nested()

    # Hard reset tables (respect FK order)
    for table in ['assignments', 'availability', 'absences', 'requests', 'tasks', 'classrooms', 'teacher_aides']:
        db.session.execute(sa_text(f'DELETE FROM {table}'))
    db.session.flush()

    @event.listens_for(db.session, "after_transaction_end")
    def _restart_savepoint(sess, trans):  # noqa: N803
        if trans.nested and not trans._parent.nested:
            sess.begin_nested()

    try:
        yield
    finally:
        event.remove(db.session, "after_transaction_end", _restart_savepoint)
        db.session.rollback()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db_session(app):
    return db.session


@pytest.fixture
def sample_aide(db_session):
    aide = TeacherAide(
        name="John Smith",
        qualifications="Special Education",
        colour_hex="#FF5733"
    )
    db_session.add(aide)
    db_session.commit()
    return aide


@pytest.fixture
def sample_classroom(db_session):
    classroom = Classroom(
        name="Room 101",
        capacity=25,
        notes="Grade 3A"
    )
    db_session.add(classroom)
    db_session.commit()
    return classroom


@pytest.fixture
def sample_task(db_session, sample_classroom):
    task = Task(
        title="Reading Support",
        category="CLASS_SUPPORT",
        start_time=time(9, 0),
        end_time=time(10, 0),
        classroom_id=sample_classroom.id,
        notes="Small group reading"
    )
    db_session.add(task)
    db_session.commit()
    return task


@pytest.fixture
def sample_assignment(db_session, sample_task, sample_aide):
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
    db_session.commit()
    return assignment


@pytest.fixture
def sample_availability(db_session, sample_aide):
    avail = Availability(
        aide_id=sample_aide.id,
        weekday='MO',
        start_time=time(8, 0),
        end_time=time(16, 0)
    )
    db_session.add(avail)
    db_session.commit()
    return avail

