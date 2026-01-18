"""
Classrooms routes: create, list, update, delete
"""
from flask import Blueprint, request
from sqlalchemy.exc import IntegrityError
from api.models import db
from api.models.classroom import Classroom
import csv
import io
import random
import re
import charset_normalizer

bp = Blueprint('classrooms', __name__, url_prefix='/api/classrooms')


# Color palette matching aide palette and frontend generateRandomColor function
_COLOR_PALETTE = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b',
]


def _generate_random_color():
    """Generate a random color from the palette."""
    return random.choice(_COLOR_PALETTE)


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
    colour_hex = data.get('colour_hex') or _generate_random_color()

    if not name:
        return {'error': 'Name is required'}, 400
    if not room_number:
        return {'error': 'Room number is required'}, 400
    if not teacher:
        return {'error': 'Teacher name is required'}, 400
    if colour_hex and not re.match(r'^#[0-9A-Fa-f]{6}$', colour_hex):
        return {'error': 'colour_hex must match #RRGGBB'}, 400

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
        composite_year_levels=composite_year_levels,
        colour_hex=colour_hex
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

    if 'colour_hex' in data:
        colour_hex = data.get('colour_hex')
        if colour_hex and not re.match(r'^#[0-9A-Fa-f]{6}$', colour_hex):
            return {'error': 'colour_hex must match #RRGGBB'}, 400
        c.colour_hex = colour_hex

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


# Valid year levels
VALID_YEAR_LEVELS = {'Prep', '1', '2', '3', '4', '5', '6'}


@bp.post('/batch')
def batch_create_classrooms():
    """
    Batch create classrooms from CSV file.
    
    Expected CSV format:
    - Headers: name, year_level, room_number, teacher (case-insensitive)
    - name: required
    - year_level: required, must be one of: Prep, 1, 2, 3, 4, 5, 6
    - room_number: optional (if empty, defaults to 'TBD')
    - teacher: required
    
    Behavior:
    - Skips duplicate names within CSV (only processes first occurrence)
    - Skips existing classrooms in database (only adds new ones)
    - Returns detailed results (created, skipped, errors)
    """
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400
    
    file = request.files['file']
    if file.filename == '':
        return {'error': 'No file selected'}, 400
    
    if not file.filename.lower().endswith('.csv'):
        return {'error': 'File must be a CSV file'}, 400
    
    try:
        # Read and parse CSV with robust encoding detection
        file.seek(0)
        raw_content = file.read()
        
        # Try charset-normalizer first
        try:
            detection = charset_normalizer.from_bytes(raw_content).best()
            detected_encoding = detection.encoding if detection else None
        except Exception:
            detected_encoding = None
            
        # Try to decode with a list of common encodings
        content = None
        for enc in [detected_encoding, 'utf-8-sig', 'cp1252', 'latin-1', 'utf-8']:
            if not enc:
                continue
            try:
                content = raw_content.decode(enc)
                break
            except (UnicodeDecodeError, LookupError):
                continue
                
        if content is None:
            return {'error': 'Could not decode CSV file. Please ensure it is saved as UTF-8 or standard CSV format.'}, 400
            
        stream = io.StringIO(content)
        reader = csv.DictReader(stream)
        
        # Normalize header names (case-insensitive)
        fieldnames = [f.lower().strip() for f in reader.fieldnames or []]
        
        if 'name' not in fieldnames:
            return {'error': 'CSV must contain a "name" column'}, 400
        if 'year_level' not in fieldnames:
            return {'error': 'CSV must contain a "year_level" column'}, 400
        if 'teacher' not in fieldnames:
            return {'error': 'CSV must contain a "teacher" column'}, 400
        
        # Track processed names to skip duplicates within CSV
        processed_names = set()
        # Get existing classroom names from database
        existing_classrooms = {c.name.lower() for c in Classroom.query.all()}
        
        created_classrooms = []
        skipped_duplicates = []
        skipped_existing = []
        errors = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
            # Extract fields (case-insensitive)
            name = None
            year_level = None
            room_number = None
            teacher = None
            
            for key, value in row.items():
                key_lower = key.lower().strip()
                if key_lower == 'name':
                    name = (value or '').strip()
                elif key_lower == 'year_level':
                    year_level = (value or '').strip()
                elif key_lower == 'room_number':
                    room_number = (value or '').strip()
                elif key_lower == 'teacher':
                    teacher = (value or '').strip()
            
            # Validate required fields
            if not name:
                errors.append(f'Row {row_num}: Name is required')
                continue
            
            if not year_level:
                errors.append(f'Row {row_num}: Year level is required')
                continue
            
            if year_level not in VALID_YEAR_LEVELS:
                errors.append(f'Row {row_num}: Invalid year level "{year_level}". Must be one of: {", ".join(sorted(VALID_YEAR_LEVELS))}')
                continue
            
            if not teacher:
                errors.append(f'Row {row_num}: Teacher name is required')
                continue
            
            # Handle optional room_number (default to 'TBD' if empty)
            if not room_number:
                room_number = 'TBD'
            
            # Check for duplicate in CSV
            name_lower = name.lower()
            if name_lower in processed_names:
                skipped_duplicates.append(name)
                continue
            
            # Check if classroom already exists
            if name_lower in existing_classrooms:
                skipped_existing.append(name)
                continue
            
            # Create classroom
            try:
                colour_hex = _generate_random_color()
                classroom = Classroom(
                    name=name,
                    year_level=year_level,
                    room_number=room_number,
                    teacher=teacher,
                    colour_hex=colour_hex
                )
                db.session.add(classroom)
                db.session.flush()  # Get the ID
                
                created_classrooms.append(classroom.to_dict())
                processed_names.add(name_lower)
                
            except ValueError as e:
                errors.append(f'Row {row_num} ({name}): {str(e)}')
                db.session.rollback()
                continue
            except IntegrityError:
                # Name might have been added by another process or duplicate
                db.session.rollback()
                skipped_existing.append(name)
                continue
        
        # Commit all successful creations
        if created_classrooms:
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
                return {'error': 'Database error during batch creation'}, 500
        
        # Build response
        result = {
            'created': len(created_classrooms),
            'skipped_duplicates': len(skipped_duplicates),
            'skipped_existing': len(skipped_existing),
            'errors': len(errors),
            'classrooms': created_classrooms,
        }
        
        if skipped_duplicates:
            result['skipped_duplicate_names'] = skipped_duplicates
        if skipped_existing:
            result['skipped_existing_names'] = skipped_existing
        if errors:
            result['error_details'] = errors
        
        return result, 201 if created_classrooms else 200
        
    except csv.Error as e:
        return {'error': f'CSV parsing error: {str(e)}'}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': f'Unexpected error: {str(e)}'}, 500
