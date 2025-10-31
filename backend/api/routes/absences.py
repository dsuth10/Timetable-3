"""
Absences routes: create/delete with cascade release
"""
from flask import Blueprint, request
from datetime import date as dt_date
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.absence import Absence
from api.models.assignment import Assignment

bp = Blueprint('absences', __name__, url_prefix='/api')


@bp.post('/absences')
def create_absence():
    data = request.get_json(silent=True) or {}

    aide_id = data.get('aide_id')
    date_str = data.get('date')
    reason = data.get('reason')

    if not aide_id or not date_str:
        return {'error': 'aide_id and date are required'}, 400

    aide = db.session.get(TeacherAide, aide_id)
    if not aide:
        return {'error': 'Aide not found'}, 404

    try:
        absence_date = dt_date.fromisoformat(date_str)
    except Exception:
        return {'error': 'Invalid date format'}, 400

    # Create absence if not exists
    existing = Absence.query.filter_by(aide_id=aide_id, date=absence_date).first()
    if existing:
        return {'error': 'Absence already exists for this date'}, 409

    # Determine which assignments will be released
    to_release = (
        Assignment.query
        .filter(
            Assignment.aide_id == aide_id,
            Assignment.date == absence_date,
            Assignment.status.in_(['ASSIGNED', 'IN_PROGRESS'])
        ).all()
    )

    absence = Absence(aide_id=aide_id, date=absence_date, reason=reason)
    db.session.add(absence)
    # Flush triggers after_insert hook that unassigns
    db.session.flush()
    db.session.commit()

    released = [a.to_dict() for a in to_release]

    return {
        'id': absence.id,
        'aide_id': absence.aide_id,
        'date': absence.date.isoformat(),
        'reason': absence.reason,
        'released_assignments': released
    }, 201


@bp.delete('/absences/<int:absence_id>')
def delete_absence(absence_id: int):
    absence = db.session.get(Absence, absence_id)
    if not absence:
        return {'error': 'Absence not found'}, 404

    db.session.delete(absence)
    db.session.commit()
    # No auto-restore of assignments
    return '', 204


@bp.get('/aides/<int:aide_id>/absences')
def list_absences_for_aide(aide_id: int):
    aide = db.session.get(TeacherAide, aide_id)
    if not aide:
        return {'error': 'Aide not found'}, 404

    items = Absence.query.filter_by(aide_id=aide_id).order_by(Absence.date).all()
    return [
        {
            'id': a.id,
            'aide_id': a.aide_id,
            'date': a.date.isoformat(),
            'reason': a.reason
        } for a in items
    ], 200
