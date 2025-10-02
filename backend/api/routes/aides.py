"""
Aides routes: CRUD and related endpoints
"""
from flask import Blueprint, request
from sqlalchemy.exc import IntegrityError
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.availability import Availability
import re

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
    qualifications = data.get('qualifications')

    if not name:
        return {'error': 'name is required'}, 400
    if not colour_hex:
        return {'error': 'colour_hex is required'}, 400
    if not re.match(r'^#[0-9A-Fa-f]{6}$', colour_hex):
        return {'error': 'colour_hex must match #RRGGBB'}, 400

    try:
        aide = TeacherAide(name=name, colour_hex=colour_hex, qualifications=qualifications)
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
    if 'name' in data and data['name'] is not None:
        aide.name = data['name']
    if 'qualifications' in data:
        aide.qualifications = data['qualifications']
    if 'colour_hex' in data and data['colour_hex'] is not None:
        if not re.match(r'^#[0-9A-Fa-f]{6}$', data['colour_hex']):
            return {'error': 'colour_hex must match #RRGGBB'}, 400
        aide.colour_hex = data['colour_hex']

    try:
        db.session.add(aide)
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400

    return aide.to_dict(), 200
