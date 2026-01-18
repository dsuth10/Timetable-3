"""
Aides routes: CRUD and related endpoints
"""
from flask import Blueprint, request
from sqlalchemy.exc import IntegrityError
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.availability import Availability, VALID_WEEKDAYS
import re
import csv
import io
from datetime import time as dt_time
import random
import charset_normalizer

bp = Blueprint('aides', __name__, url_prefix='/api/aides')


@bp.get('')
def list_aides():
    include = request.args.get('include')
    include_availability = include == 'availability'

    aides = TeacherAide.query.order_by(TeacherAide.id).all()
    result = []
    for a in aides:
        data = a.to_dict(include_relationships=False)
        if include_availability:
            avs = Availability.query.filter_by(aide_id=a.id).all()
            data['availability'] = [av.to_dict() for av in avs]
        result.append(data)
    return result, 200


@bp.post('')
def create_aide():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    colour_hex = data.get('colour_hex')
    details = data.get('details')

    if not name:
        return {'error': 'name is required'}, 400
    if not colour_hex:
        return {'error': 'colour_hex is required'}, 400
    if not re.match(r'^#[0-9A-Fa-f]{6}$', colour_hex):
        return {'error': 'colour_hex must match #RRGGBB'}, 400

    try:
        aide = TeacherAide(name=name, colour_hex=colour_hex, details=details)
        db.session.add(aide)
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400

    return aide.to_dict(), 201


@bp.get('/<int:aide_id>')
def get_aide(aide_id: int):
    aide = db.session.get(TeacherAide, aide_id)
    if not aide:
        return {'error': 'Aide not found'}, 404
    return aide.to_dict(), 200


@bp.put('/<int:aide_id>')
def update_aide(aide_id: int):
    aide = db.session.get(TeacherAide, aide_id)
    if not aide:
        return {'error': 'Aide not found'}, 404

    data = request.get_json(silent=True) or {}
    
    try:
        if 'name' in data and data['name'] is not None:
            aide.name = data['name']
        if 'details' in data:
            aide.details = data['details']
        if 'colour_hex' in data and data['colour_hex'] is not None:
            if not re.match(r'^#[0-9A-Fa-f]{6}$', data['colour_hex']):
                return {'error': 'colour_hex must match #RRGGBB'}, 400
            aide.colour_hex = data['colour_hex']

        db.session.add(aide)
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400

    return aide.to_dict(), 200


@bp.delete('/<int:aide_id>')
def delete_aide(aide_id: int):
    aide = db.session.get(TeacherAide, aide_id)
    if not aide:
        return {'error': 'Aide not found'}, 404
    
    try:
        db.session.delete(aide)
        db.session.commit()
        return {'message': 'Aide deleted successfully'}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to delete aide: {str(e)}'}, 500


# Color palette matching frontend generateRandomColor function
_COLOR_PALETTE = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b',
]


def _generate_random_color():
    """Generate a random color from the palette."""
    return random.choice(_COLOR_PALETTE)


@bp.post('/batch')
def batch_create_aides():
    """
    Batch create teacher aides from CSV file.
    
    Expected CSV format:
    - Headers: name, notes (case-insensitive)
    - name: required
    - notes: optional
    
    Behavior:
    - Skips duplicate names within CSV (only processes first occurrence)
    - Skips existing aides in database (only adds new ones)
    - Sets default availability (08:50-15:00) for all weekdays (MO-FR)
    - Assigns random color from palette
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
        
        # Track processed names to skip duplicates within CSV
        processed_names = set()
        # Get existing aide names from database
        existing_aides = {a.name.lower() for a in TeacherAide.query.all()}
        
        created_aides = []
        skipped_duplicates = []
        skipped_existing = []
        errors = []
        
        # Default availability times (08:50-15:00)
        default_start_time = dt_time(8, 50)
        default_end_time = dt_time(15, 0)
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
            # Extract name and notes (case-insensitive)
            name = None
            notes = None
            
            for key, value in row.items():
                key_lower = key.lower().strip()
                if key_lower == 'name':
                    name = (value or '').strip()
                elif key_lower == 'notes':
                    notes = (value or '').strip() or None
            
            # Validate name
            if not name:
                errors.append(f'Row {row_num}: Name is required')
                continue
            
            # Check for duplicate in CSV
            name_lower = name.lower()
            if name_lower in processed_names:
                skipped_duplicates.append(name)
                continue
            
            # Check if aide already exists
            if name_lower in existing_aides:
                skipped_existing.append(name)
                continue
            
            # Create aide
            try:
                colour_hex = _generate_random_color()
                aide = TeacherAide(name=name, colour_hex=colour_hex, details=notes)
                db.session.add(aide)
                db.session.flush()  # Get the ID
                
                # Create default availability for all weekdays
                for weekday in VALID_WEEKDAYS:
                    availability = Availability(
                        aide_id=aide.id,
                        weekday=weekday,
                        start_time=default_start_time,
                        end_time=default_end_time
                    )
                    db.session.add(availability)
                
                created_aides.append(aide.to_dict())
                processed_names.add(name_lower)
                
            except ValueError as e:
                errors.append(f'Row {row_num} ({name}): {str(e)}')
                db.session.rollback()
                continue
            except IntegrityError:
                # Name might have been added by another process
                db.session.rollback()
                skipped_existing.append(name)
                continue
        
        # Commit all successful creations
        if created_aides:
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
                return {'error': 'Database error during batch creation'}, 500
        
        # Build response
        result = {
            'created': len(created_aides),
            'skipped_duplicates': len(skipped_duplicates),
            'skipped_existing': len(skipped_existing),
            'errors': len(errors),
            'aides': created_aides,
        }
        
        if skipped_duplicates:
            result['skipped_duplicate_names'] = skipped_duplicates
        if skipped_existing:
            result['skipped_existing_names'] = skipped_existing
        if errors:
            result['error_details'] = errors
        
        return result, 201 if created_aides else 200
        
    except csv.Error as e:
        return {'error': f'CSV parsing error: {str(e)}'}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': f'Unexpected error: {str(e)}'}, 500
