"""
RecurringSeries Model
Represents an independent recurring assignment series for a specific task/aide combination.
"""
from datetime import datetime, date as dt_date, time as dt_time
from sqlalchemy import Column, Integer, String, Text, Time, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
from api.models import db
from dateutil.rrule import rrulestr


class RecurringSeries(db.Model):
    """
    RecurringSeries model representing an independent recurring assignment series.
    
    This allows the same task template to have multiple independent recurring instances,
    each with different recurrence patterns, assigned to different aides.
    
    Relationships:
    - task: Many-to-One with Task
    - aide: Many-to-One with TeacherAide (nullable for unassigned recurring)
    - assignments: One-to-Many with Assignment
    """
    
    __tablename__ = 'recurring_series'
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False, index=True)
    aide_id = Column(Integer, ForeignKey('teacher_aides.id', ondelete='SET NULL'), nullable=True)
    recurrence_rule = Column(Text, nullable=False)  # iCal RRULE
    expires_on = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    base_date = Column(Date, nullable=False)  # Original assignment date that was made recurring
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    task = relationship('Task', back_populates='recurring_series')
    aide = relationship('TeacherAide', back_populates='recurring_series', foreign_keys=[aide_id])
    assignments = relationship(
        'Assignment',
        back_populates='recurring_series',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    
    # Indexes
    __table_args__ = (
        Index('idx_recurring_series_task', 'task_id'),
        Index('idx_recurring_series_aide', 'aide_id'),
    )
    
    # Validation
    @validates('recurrence_rule')
    def validate_recurrence_rule(self, key, value):
        """Validate RRULE format"""
        if not value or value == '':
            raise ValueError("recurrence_rule is required for recurring series")
        
        try:
            # Attempt to parse RRULE
            rrulestr(value, dtstart=datetime.now())
        except Exception as e:
            raise ValueError(f"Invalid recurrence rule: {e}")
        
        return value
    
    @validates('expires_on')
    def validate_expires_on(self, key, value):
        """Validate expires_on is provided"""
        if not value:
            raise ValueError("expires_on is required for recurring series")
        return value
    
    @validates('start_time')
    def validate_start_time(self, key, value):
        """Validate start_time is in 5-minute increments"""
        if not isinstance(value, dt_time):
            raise ValueError("start_time must be a time object")
        
        # Allow 5-minute increments to support custom schedule segments (e.g. 08:50, 09:10, 11:50)
        if value.minute % 5 != 0:
            raise ValueError("start_time must be in 5-minute increments")
        
        return value
    
    @validates('end_time')
    def validate_end_time(self, key, value):
        """Validate end_time is in 5-minute increments and after start_time"""
        if not isinstance(value, dt_time):
            raise ValueError("end_time must be a time object")
        
        # Allow 5-minute increments to support custom schedule segments (e.g. 08:50, 09:10, 12:20)
        if value.minute % 5 != 0:
            raise ValueError("end_time must be in 5-minute increments")
        
        # Check end_time > start_time
        if hasattr(self, 'start_time') and self.start_time:
            if value <= self.start_time:
                raise ValueError("end_time must be after start_time")
        
        return value
    
    @validates('base_date')
    def validate_base_date(self, key, value):
        """Validate base_date is provided"""
        if not isinstance(value, dt_date):
            raise ValueError("base_date must be a date object")
        return value
    
    def to_dict(self, include_relationships=False):
        """Convert to dictionary for JSON serialization"""
        data = {
            'id': self.id,
            'task_id': self.task_id,
            'aide_id': self.aide_id,
            'recurrence_rule': self.recurrence_rule,
            'expires_on': self.expires_on.isoformat() if self.expires_on else None,
            'start_time': self.start_time.strftime('%H:%M:%S') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M:%S') if self.end_time else None,
            'base_date': self.base_date.isoformat() if self.base_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_relationships:
            if self.task:
                data['task'] = self.task.to_dict()
            if self.aide:
                data['aide'] = self.aide.to_dict()
            # Note: We don't include all assignments by default as there could be many
            data['assignments_count'] = self.assignments.count()
        
        return data
    
    def __repr__(self):
        aide_info = f'aide={self.aide_id}' if self.aide_id else 'unassigned'
        return f'<RecurringSeries {self.id}: task={self.task_id} {aide_info} expires={self.expires_on}>'

