"""
T034: Absence Model
Represents a teacher aide being unavailable on a specific date.
"""
from datetime import datetime, date as dt_date
from sqlalchemy import Column, Integer, Date, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship, validates
from sqlalchemy import event, text as sa_text
from api.models import db


class Absence(db.Model):
    """
    Absence model representing aide unavailability.
    
    Relationships:
    - aide: Many-to-One with TeacherAide
    
    Cascade Behavior:
    - On creation: Releases all assignments for aide on date
    - On deletion: Assignments remain unassigned (manual reassignment required)
    """
    
    __tablename__ = 'absences'
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    aide_id = Column(Integer, ForeignKey('teacher_aides.id', ondelete='CASCADE'), nullable=False)
    date = Column(Date, nullable=False, index=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    aide = relationship('TeacherAide', back_populates='absences')
    
    # Constraints - Unique aide per date
    __table_args__ = (
        UniqueConstraint('aide_id', 'date', name='uq_absence_aide_date'),
        Index('idx_absences_aide_date', 'aide_id', 'date', unique=True),
        Index('idx_absences_date', 'date'),
    )
    
    # Validation
    @validates('aide_id')
    def validate_aide_id(self, key, value):
        """Validate aide_id is provided"""
        if not value:
            raise ValueError("aide_id is required")
        return value
    
    @validates('date')
    def validate_date(self, key, value):
        """Validate date is provided"""
        if not isinstance(value, dt_date):
            raise ValueError("date must be a date object")
        return value
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'aide_id': self.aide_id,
            'date': self.date.isoformat() if self.date else None,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Absence aide={self.aide_id} date={self.date}>'



