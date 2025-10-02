"""
SQLAlchemy models for Teacher Aide Scheduler
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models for easy access
from .teacher_aide import TeacherAide
from .availability import Availability
from .classroom import Classroom
from .task import Task
from .assignment import Assignment
from .absence import Absence
from .request import Request

# Base class for Alembic
from sqlalchemy.orm import declarative_base
Base = declarative_base()

__all__ = [
    'db',
    'Base',
    'TeacherAide',
    'Availability',
    'Classroom',
    'Task',
    'Assignment',
    'Absence',
    'Request'
]
