"""
T036: Request Model
Represents a teacher's request for aide support.
"""
from datetime import datetime, date as dt_date, time as dt_time
from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
from api.models import db


REQUEST_STATUSES = {'PENDING', 'APPROVED', 'REJECTED'}
TASK_CATEGORIES = {'PLAYGROUND', 'CLASS_SUPPORT', 'GROUP_SUPPORT', 'INDIVIDUAL_SUPPORT'}


class Request(db.Model):
    """
    Request model representing teacher aide support requests.
    
    Relationships:
    - classroom: Many-to-One with Classroom (optional)
    
    Workflow:
    1. Teacher submits request (status = PENDING)
    2. Admin reviews request
    3. On APPROVED: Create Task → Create Assignment (UNASSIGNED)
    4. On REJECTED: Update status only
    """
    
    __tablename__ = 'requests'
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    requesting_teacher = Column(String(100), nullable=False)
    task_title = Column(String(200), nullable=False)
    task_category = Column(String(20), nullable=False)
    preferred_date = Column(Date, nullable=False)
    preferred_time = Column(Time, nullable=False)
    classroom_id = Column(Integer, ForeignKey('classrooms.id', ondelete='SET NULL'), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default='PENDING', index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Relationships
    classroom = relationship('Classroom', back_populates='requests')
    
    # Indexes
    __table_args__ = (
        Index('idx_requests_status', 'status'),
        Index('idx_requests_created_at', 'created_at'),
    )
    
    # Validation
    @validates('requesting_teacher')
    def validate_requesting_teacher(self, key, value):
        """Validate requesting_teacher is 1-100 characters"""
        if not value or len(value.strip()) == 0:
            raise ValueError("Requesting teacher name is required")
        if len(value) > 100:
            raise ValueError("Requesting teacher name must not exceed 100 characters")
        return value.strip()
    
    @validates('task_title')
    def validate_task_title(self, key, value):
        """Validate task_title is 1-200 characters"""
        if not value or len(value.strip()) == 0:
            raise ValueError("Task title is required")
        if len(value) > 200:
            raise ValueError("Task title must not exceed 200 characters")
        return value.strip()
    
    @validates('task_category')
    def validate_task_category(self, key, value):
        """Validate task_category matches Task categories"""
        if not value:
            raise ValueError("Task category is required")
        
        value = value.upper()
        if value not in TASK_CATEGORIES:
            raise ValueError(f"Category must be one of {TASK_CATEGORIES}")
        
        return value
    
    @validates('status')
    def validate_status(self, key, value):
        """Validate status is one of defined types"""
        if not value:
            raise ValueError("Request status is required")
        
        value = value.upper()
        if value not in REQUEST_STATUSES:
            raise ValueError(f"Status must be one of {REQUEST_STATUSES}")
        
        return value
    
    @validates('preferred_date')
    def validate_preferred_date(self, key, value):
        """Validate preferred_date is provided"""
        if not isinstance(value, dt_date):
            raise ValueError("preferred_date must be a date object")
        return value
    
    @validates('preferred_time')
    def validate_preferred_time(self, key, value):
        """Validate preferred_time is in 15-minute increments"""
        if not isinstance(value, dt_time):
            raise ValueError("preferred_time must be a time object")
        
        # Check 15-minute increments
        if value.minute not in [0, 15, 30, 45]:
            raise ValueError("preferred_time must be in 15-minute increments (00, 15, 30, or 45)")
        
        return value
    
    def to_dict(self, include_classroom=False):
        """Convert to dictionary for JSON serialization"""
        data = {
            'id': self.id,
            'requesting_teacher': self.requesting_teacher,
            'task_title': self.task_title,
            'task_category': self.task_category,
            'preferred_date': self.preferred_date.isoformat() if self.preferred_date else None,
            'preferred_time': self.preferred_time.strftime('%H:%M:%S') if self.preferred_time else None,
            'classroom_id': self.classroom_id,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_classroom and self.classroom:
            data['classroom'] = self.classroom.to_dict()
        
        return data
    
    def __repr__(self):
        return f'<Request {self.id}: {self.task_title} by {self.requesting_teacher} ({self.status})>'



