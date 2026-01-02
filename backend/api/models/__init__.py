"""
SQLAlchemy models for CHARLOTTE
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models for easy access
from .teacher_aide import TeacherAide
from .availability import Availability
from .classroom import Classroom
from .task import Task
from .recurring_series import RecurringSeries
from .assignment import Assignment
from .absence import Absence
from .request import Request

# Base class for Alembic
Base = db.Model

__all__ = [
    'db',
    'Base',
    'TeacherAide',
    'Availability',
    'Classroom',
    'Task',
    'RecurringSeries',
    'Assignment',
    'Absence',
    'Request'
]
