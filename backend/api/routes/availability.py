"""
Availability routes: create/list for a specific aide
"""
from flask import Blueprint, request
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.availability import Availability, VALID_WEEKDAYS
from sqlalchemy.exc import IntegrityError
from datetime import time as dt_time

bp = Blueprint('availability', __name__, url_prefix='/api/aides')


@bp.post('/<int:aide_id>/availability')
def create_availability(aide_id: int):
    aide = db.session.get(TeacherAide, aide_id)
    if not aide:
        return {'error': 'Aide not found'}, 404

    data = request.get_json(silent=True) or {}
    weekday = (data.get('weekday') or '').upper()
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    if weekday not in VALID_WEEKDAYS:
        return {'error': 'Invalid weekday'}, 400
    if not start_time or not end_time:
        return {'error': 'start_time and end_time are required'}, 400

    try:
        s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
        e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
        s_t = dt_time(s_h, s_m)
        e_t = dt_time(e_h, e_m)
    except Exception:
        return {'error': 'Invalid time format, expected HH:MM'}, 400

    if e_t <= s_t:
        return {'error': 'end_time must be after start_time'}, 400

    # Enforce one availability per weekday per aide (spec simplification)
    existing_day = Availability.query.filter_by(aide_id=aide.id, weekday=weekday).first()
    if existing_day:
        return {'error': 'Availability for this weekday already exists'}, 409

    availability = Availability(
        aide_id=aide.id,
        weekday=weekday,
        start_time=s_t,
        end_time=e_t
    )

    try:
        db.session.add(availability)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {'error': 'Availability already exists'}, 409

    return availability.to_dict(), 201


@bp.get('/<int:aide_id>/availability')
def list_availability(aide_id: int):
    aide = db.session.get(TeacherAide, aide_id)
    if not aide:
        return {'error': 'Aide not found'}, 404

    items = Availability.query.filter_by(aide_id=aide.id).order_by(Availability.weekday).all()
    return [a.to_dict() for a in items], 200


@bp.delete('/api/availability/<int:availability_id>')
def delete_availability(availability_id: int):
    """Delete a specific availability record"""
    availability = db.session.get(Availability, availability_id)
    if not availability:
        return {'error': 'Availability not found'}, 404

    try:
        db.session.delete(availability)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return {'error': 'Failed to delete availability'}, 500