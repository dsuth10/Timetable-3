"""
T033: Assignment Model
Represents a specific occurrence of a task assigned to an aide (or unassigned).
"""
from datetime import datetime, date as dt_date, time as dt_time
from sqlalchemy import Column, Integer, Date, Time, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
from api.models import db


ASSIGNMENT_STATUSES = {'UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETE', 'RELIEF_POOL'}


class Assignment(db.Model):
    """
    Assignment model representing task occurrences.
    
    Relationships:
    - task: Many-to-One with Task
    - aide: Many-to-One with TeacherAide (nullable)
    """
    
    __tablename__ = 'assignments'
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False, index=True)
    aide_id = Column(Integer, ForeignKey('teacher_aides.id', ondelete='SET NULL'), nullable=True)
    original_aide_id = Column(Integer, ForeignKey('teacher_aides.id', ondelete='SET NULL'), nullable=True, index=True)
    recurring_series_id = Column(Integer, ForeignKey('recurring_series.id', ondelete='CASCADE'), nullable=True, index=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String(20), nullable=False, default='UNASSIGNED')
    version = Column(Integer, nullable=False, default=1)  # Optimistic locking
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    task = relationship('Task', back_populates='assignments')
    aide = relationship('TeacherAide', back_populates='assignments', foreign_keys=[aide_id])
    original_aide = relationship('TeacherAide', foreign_keys=[original_aide_id])
    recurring_series = relationship('RecurringSeries', back_populates='assignments')
    
    # Indexes for collision detection and weekly queries
    __table_args__ = (
        Index('idx_assignments_aide_date_time', 'aide_id', 'date', 'start_time'),
        Index('idx_assignments_date', 'date'),
        Index('idx_assignments_task_id', 'task_id'),
        Index('idx_assignments_status_date', 'status', 'date', 'start_time'),
    )
    
    # Validation
    @validates('date')
    def validate_date(self, key, value):
        """Validate date is provided"""
        if not isinstance(value, dt_date):
            raise ValueError("date must be a date object")
        return value
    
    @validates('start_time')
    def validate_start_time(self, key, value):
        """Validate start_time is provided"""
        if not isinstance(value, dt_time):
            raise ValueError("start_time must be a time object")
        
        # Allow all 5-minute increments for custom schedule segments
        if value.minute % 5 != 0:
            raise ValueError("start_time must be in 5-minute increments")
        
        return value
    
    @validates('end_time')
    def validate_end_time(self, key, value):
        """Validate end_time is provided and after start_time"""
        if not isinstance(value, dt_time):
            raise ValueError("end_time must be a time object")
        
        # Allow all 5-minute increments for custom schedule segments
        if value.minute % 5 != 0:
            raise ValueError("end_time must be in 5-minute increments")
        
        # Check end_time > start_time
        if hasattr(self, 'start_time') and self.start_time:
            if value <= self.start_time:
                raise ValueError("end_time must be after start_time")
        
        return value
    
    @validates('status')
    def validate_status(self, key, value):
        """Validate status is one of defined types"""
        if not value:
            raise ValueError("Assignment status is required")
        
        value = value.upper()
        if value not in ASSIGNMENT_STATUSES:
            raise ValueError(f"Status must be one of {ASSIGNMENT_STATUSES}")
        
        # RELIEF_POOL status has special rules
        if value == 'RELIEF_POOL':
            # RELIEF_POOL tasks should have aide_id = NULL
            # original_aide_id should be set (handled by service layer)
            pass
        # Auto-set status based on aide_id (skip for RELIEF_POOL)
        elif hasattr(self, 'aide_id'):
            if self.aide_id is None and value not in ['UNASSIGNED', 'RELIEF_POOL']:
                value = 'UNASSIGNED'
            elif self.aide_id is not None and value == 'UNASSIGNED':
                value = 'ASSIGNED'
        
        return value
    
    @validates('aide_id')
    def validate_aide_id(self, key, value):
        """Ensure status matches aide_id state"""
        # If aide_id is None, status should be UNASSIGNED or RELIEF_POOL
        if value is None and hasattr(self, 'status'):
            if self.status not in ['UNASSIGNED', 'RELIEF_POOL', None]:
                self.status = 'UNASSIGNED'
        
        return value
    
    def to_dict(self, include_relationships=False):
        """Convert to dictionary for JSON serialization"""
        data = {
            'id': self.id,
            'task_id': self.task_id,
            'aide_id': self.aide_id,
            'original_aide_id': self.original_aide_id,
            'recurring_series_id': self.recurring_series_id,
            'date': self.date.isoformat() if self.date else None,
            'start_time': self.start_time.strftime('%H:%M:%S') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M:%S') if self.end_time else None,
            'status': self.status,
            'version': self.version,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_relationships:
            if self.task:
                data['task'] = self.task.to_dict()
            if self.aide:
                data['aide'] = self.aide.to_dict()
            if self.original_aide:
                data['original_aide'] = self.original_aide.to_dict()
        
        return data
    
    def __repr__(self):
        aide_info = f'aide={self.aide_id}' if self.aide_id else 'unassigned'
        return f'<Assignment {self.id}: task={self.task_id} {aide_info} {self.date}>'

