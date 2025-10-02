"""
T035: Classroom Model
Represents a physical or virtual learning space.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.orm import relationship, validates
from api.models import db


class Classroom(db.Model):
    """
    Classroom model representing learning spaces.
    
    Relationships:
    - tasks: One-to-Many with Task
    - requests: One-to-Many with Request
    """
    
    __tablename__ = 'classrooms'
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    capacity = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    tasks = relationship(
        'Task',
        back_populates='classroom',
        foreign_keys='Task.classroom_id',
        lazy='dynamic'
    )
    
    requests = relationship(
        'Request',
        back_populates='classroom',
        foreign_keys='Request.classroom_id',
        lazy='dynamic'
    )
    
    # Validation
    @validates('name')
    def validate_name(self, key, value):
        """Validate name is 1-100 characters"""
        if not value or len(value.strip()) == 0:
            raise ValueError("Classroom name is required")
        if len(value) > 100:
            raise ValueError("Classroom name must not exceed 100 characters")
        return value.strip()
    
    @validates('capacity')
    def validate_capacity(self, key, value):
        """Validate capacity is positive if provided"""
        if value is not None and value <= 0:
            raise ValueError("Capacity must be a positive integer")
        return value
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'capacity': self.capacity,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Classroom {self.id}: {self.name}>'


# Indexes
Index('idx_classrooms_name', Classroom.name, unique=True)



