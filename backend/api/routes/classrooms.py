"""
Classrooms routes: create, list, update, delete
"""
from flask import Blueprint, request
from api.models import db
from api.models.classroom import Classroom

bp = Blueprint('classrooms', __name__, url_prefix='/api/classrooms')


@bp.post('')
def create_classroom():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    room_number = (data.get('room_number') or '').strip()
    teacher = (data.get('teacher') or '').strip()
    capacity = data.get('capacity')
    notes = data.get('notes')
    year_level = data.get('year_level')
    is_composite = data.get('is_composite', False)
    composite_year_levels = data.get('composite_year_levels')

    if not name:
        return {'error': 'Name is required'}, 400
    if not room_number:
        return {'error': 'Room number is required'}, 400
    if not teacher:
        return {'error': 'Teacher name is required'}, 400

    # Check for duplicates (name must be unique)
    if Classroom.query.filter_by(name=name).first():
        return {'error': 'Classroom with this name already exists'}, 409

    c = Classroom(
        name=name,
        room_number=room_number,
        teacher=teacher,
        capacity=capacity,
        notes=notes,
        year_level=year_level,
        is_composite=is_composite,
        composite_year_levels=composite_year_levels
    )
    try:
        db.session.add(c)
        db.session.commit()
        return c.to_dict(), 201
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400


@bp.get('')
def list_classrooms():
    items = Classroom.query.order_by(Classroom.name).all()
    return [c.to_dict() for c in items], 200


@bp.put('/<int:classroom_id>')
def update_classroom(classroom_id):
    c = db.session.get(Classroom, classroom_id)
    if not c:
        return {'error': 'Classroom not found'}, 404

    data = request.get_json(silent=True) or {}
    
    # Update fields if provided
    if 'name' in data:
        name = (data.get('name') or '').strip()
        if not name:
            return {'error': 'Name is required'}, 400
        # Check uniqueness if name changing
        if name != c.name and Classroom.query.filter_by(name=name).first():
            return {'error': 'Classroom with this name already exists'}, 409
        c.name = name
        
    if 'room_number' in data:
        room_number = (data.get('room_number') or '').strip()
        if not room_number:
            return {'error': 'Room number is required'}, 400
        c.room_number = room_number
        
    if 'teacher' in data:
        teacher = (data.get('teacher') or '').strip()
        if not teacher:
            return {'error': 'Teacher name is required'}, 400
        c.teacher = teacher
        
    if 'capacity' in data:
        c.capacity = data.get('capacity')
        
    if 'notes' in data:
        c.notes = data.get('notes')

    if 'year_level' in data:
        c.year_level = data.get('year_level')
        
    if 'is_composite' in data:
        c.is_composite = data.get('is_composite')
        
    if 'composite_year_levels' in data:
        c.composite_year_levels = data.get('composite_year_levels')

    try:
        db.session.commit()
        return c.to_dict(), 200
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400


@bp.delete('/<int:classroom_id>')
def delete_classroom(classroom_id):
    c = db.session.get(Classroom, classroom_id)
    if not c:
        return {'error': 'Classroom not found'}, 404

    try:
        db.session.delete(c)
        db.session.commit()
        return {}, 204
    except Exception as e:
        db.session.rollback()
        # Check if the error is due to foreign key constraints (tasks using this classroom)
        # SQLAlchemy usually raises IntegrityError
        return {'error': 'Failed to delete classroom. It may be in use by existing tasks.'}, 400
