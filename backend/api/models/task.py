"""
T032: Task Model
Represents a support duty or assignment (one-off or recurring).
"""
from datetime import datetime, date as dt_date, time as dt_time
from sqlalchemy import Column, Integer, String, Text, Time, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
from api.models import db
from dateutil.rrule import rrulestr


TASK_CATEGORIES = {'PLAYGROUND', 'CLASS_SUPPORT', 'GROUP_SUPPORT', 'INDIVIDUAL_SUPPORT'}
TASK_STATUSES = {'UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETE'}


class Task(db.Model):
    """
    Task model representing support duties (one-off or recurring).
    
    Relationships:
    - classroom: Many-to-One with Classroom
    - assignments: One-to-Many with Assignment
    """
    
    __tablename__ = 'tasks'
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    category = Column(String(20), nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    recurrence_rule = Column(Text, nullable=True)  # iCal RRULE
    expires_on = Column(Date, nullable=True)
    classroom_id = Column(Integer, ForeignKey('classrooms.id', ondelete='SET NULL'), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default='UNASSIGNED', index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    classroom = relationship('Classroom', back_populates='tasks')
    
    assignments = relationship(
        'Assignment',
        back_populates='task',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    
    # Indexes
    __table_args__ = (
        Index('idx_tasks_category', 'category'),
        Index('idx_tasks_status', 'status'),
    )
    
    # Validation
    @validates('title')
    def validate_title(self, key, value):
        """Validate title is 1-200 characters"""
        if not value or len(value.strip()) == 0:
            raise ValueError("Task title is required")
        if len(value) > 200:
            raise ValueError("Task title must not exceed 200 characters")
        return value.strip()
    
    @validates('category')
    def validate_category(self, key, value):
        """Validate category is one of defined types"""
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
            raise ValueError("Task status is required")
        
        value = value.upper()
        if value not in TASK_STATUSES:
            raise ValueError(f"Status must be one of {TASK_STATUSES}")
        
        return value
    
    @validates('start_time')
    def validate_start_time(self, key, value):
        """Validate start_time is in 30-minute increments"""
        if not isinstance(value, dt_time):
            raise ValueError("start_time must be a time object")
        
        # Check 30-minute increments
        if value.minute not in [0, 30]:
            raise ValueError("start_time must be in 30-minute increments (00 or 30)")
        
        return value
    
    @validates('end_time')
    def validate_end_time(self, key, value):
        """Validate end_time is in 30-minute increments and after start_time"""
        if not isinstance(value, dt_time):
            raise ValueError("end_time must be a time object")
        
        # Check 30-minute increments
        if value.minute not in [0, 30]:
            raise ValueError("end_time must be in 30-minute increments (00 or 30)")
        
        # Check end_time > start_time
        if hasattr(self, 'start_time') and self.start_time:
            if value <= self.start_time:
                raise ValueError("end_time must be after start_time")
        
        return value
    
    @validates('recurrence_rule')
    def validate_recurrence_rule(self, key, value):
        """Validate RRULE format if provided"""
        if value is None or value == '':
            return None
        
        try:
            # Attempt to parse RRULE
            rrulestr(value, dtstart=datetime.now())
        except Exception as e:
            raise ValueError(f"Invalid recurrence rule: {e}")
        
        return value
    
    @validates('expires_on')
    def validate_expires_on(self, key, value):
        """Validate expires_on is required for recurring tasks"""
        # This validation runs after recurrence_rule is set
        if hasattr(self, 'recurrence_rule') and self.recurrence_rule:
            if not value:
                raise ValueError("expires_on is required for recurring tasks")
        
        return value
    
    def to_dict(self, include_assignments=False):
        """Convert to dictionary for JSON serialization"""
        data = {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'start_time': self.start_time.strftime('%H:%M:%S') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M:%S') if self.end_time else None,
            'recurrence_rule': self.recurrence_rule,
            'expires_on': self.expires_on.isoformat() if self.expires_on else None,
            'classroom_id': self.classroom_id,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if self.classroom:
            data['classroom'] = self.classroom.to_dict()
        
        if include_assignments:
            data['assignments'] = [a.to_dict() for a in self.assignments.all()]
        
        return data
    
    def __repr__(self):
        return f'<Task {self.id}: {self.title} ({self.category})>'

