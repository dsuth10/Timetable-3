"""
T030: TeacherAide Model
Represents a staff member who provides classroom and playground support.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.orm import relationship, validates
from api.models import db
import re


class TeacherAide(db.Model):
    """
    Teacher aide model with validation and relationships.
    
    Relationships:
    - availability: One-to-Many with Availability
    - assignments: One-to-Many with Assignment
    - absences: One-to-Many with Absence
    """
    
    __tablename__ = 'teacher_aides'
    
    # Columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    details = Column(Text, nullable=True)
    colour_hex = Column(String(7), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    availability = relationship(
        'Availability',
        back_populates='aide',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    
    assignments = relationship(
        'Assignment',
        back_populates='aide',
        foreign_keys='Assignment.aide_id',
        lazy='dynamic'
    )
    
    absences = relationship(
        'Absence',
        back_populates='aide',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    
    recurring_series = relationship(
        'RecurringSeries',
        back_populates='aide',
        foreign_keys='RecurringSeries.aide_id',
        lazy='dynamic'
    )
    
    # Validation
    @validates('name')
    def validate_name(self, key, value):
        """Validate name is 1-100 characters"""
        if not value or len(value.strip()) == 0:
            raise ValueError("Name is required")
        if len(value) > 100:
            raise ValueError("Name must not exceed 100 characters")
        return value.strip()
    
    @validates('colour_hex')
    def validate_colour_hex(self, key, value):
        """Validate colour is valid hex format (#RRGGBB)"""
        if not value:
            raise ValueError("Colour hex is required")
        
        hex_pattern = re.compile(r'^#[0-9A-Fa-f]{6}$')
        if not hex_pattern.match(value):
            raise ValueError("Colour must be in hex format (#RRGGBB)")
        
        return value.upper()
    
    def to_dict(self, include_relationships=False):
        """Convert to dictionary for JSON serialization"""
        data = {
            'id': self.id,
            'name': self.name,
            'details': self.details,
            'colour_hex': self.colour_hex,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_relationships:
            data['availability'] = [a.to_dict() for a in self.availability.all()]
        
        return data
    
    def __repr__(self):
        return f'<TeacherAide {self.id}: {self.name}>'


# Indexes
Index('idx_teacher_aides_name', TeacherAide.name)



