"""
T031: Availability Model
Represents regular weekly availability pattern for a teacher aide.
"""
from datetime import time as dt_time
from sqlalchemy import Column, Integer, String, Time, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship, validates
from api.models import db


VALID_WEEKDAYS = {'MO', 'TU', 'WE', 'TH', 'FR'}


class Availability(db.Model):
    """
    Weekly availability pattern for teacher aides.
    
    Relationships:
    - aide: Many-to-One with TeacherAide
    """
    
    __tablename__ = 'availability'
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    aide_id = Column(Integer, ForeignKey('teacher_aides.id', ondelete='CASCADE'), nullable=False)
    weekday = Column(String(2), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Relationships
    aide = relationship('TeacherAide', back_populates='availability')
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('aide_id', 'weekday', 'start_time', name='uq_availability_aide_day_time'),
        Index('idx_availability_aide_weekday', 'aide_id', 'weekday'),
    )
    
    # Validation
    @validates('weekday')
    def validate_weekday(self, key, value):
        """Validate weekday is MO-FR"""
        if not value:
            raise ValueError("Weekday is required")
        
        value = value.upper()
        if value not in VALID_WEEKDAYS:
            raise ValueError(f"Weekday must be one of {VALID_WEEKDAYS}")
        
        return value
    
    @validates('start_time')
    def validate_start_time(self, key, value):
        """Validate start_time is in 5-minute increments"""
        if not isinstance(value, dt_time):
            raise ValueError("start_time must be a time object")
        
        # Check 5-minute increments
        if value.minute % 5 != 0:
            raise ValueError("start_time must be in 5-minute increments")
        
        return value
    
    @validates('end_time')
    def validate_end_time(self, key, value):
        """Validate end_time is in 5-minute increments and after start_time"""
        if not isinstance(value, dt_time):
            raise ValueError("end_time must be a time object")
        
        # Check 5-minute increments
        if value.minute % 5 != 0:
            raise ValueError("end_time must be in 5-minute increments")
        
        # Check end_time > start_time
        if hasattr(self, 'start_time') and self.start_time:
            if value <= self.start_time:
                raise ValueError("end_time must be after start_time")
        
        return value
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'aide_id': self.aide_id,
            'weekday': self.weekday,
            'start_time': self.start_time.strftime('%H:%M:%S') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M:%S') if self.end_time else None
        }
    
    def __repr__(self):
        return f'<Availability aide={self.aide_id} {self.weekday} {self.start_time}-{self.end_time}>'

