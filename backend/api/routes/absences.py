"""
Absences routes: create/delete with Relief Pool cascade
"""
from flask import Blueprint, request
from datetime import date as dt_date
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.absence import Absence
from api.models.assignment import Assignment
from api.services.absence_service import AbsenceService

bp = Blueprint('absences', __name__, url_prefix='/api')


@bp.post('/absences')
def create_absence():
    """
    POST /api/absences
    
    Create an absence for an aide, moving their assignments to Relief Pool.
    
    Request Body:
        aide_id: (required) ID of the aide
        date: (required) ISO date string
        reason: (optional) Reason for absence
    
    Returns:
        Created absence with relief_pool_tasks and relief_pool_count
    """
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

    # Query assignments that will be moved to Relief Pool (before the cascade)
    to_release = (
        Assignment.query
        .filter(
            Assignment.aide_id == aide_id,
            Assignment.date == absence_date,
            Assignment.status.in_(['ASSIGNED', 'IN_PROGRESS'])
        ).all()
    )
    assignment_ids = [a.id for a in to_release]

    absence = Absence(aide_id=aide_id, date=absence_date, reason=reason)
    db.session.add(absence)
    # Flush triggers after_insert hook that moves to Relief Pool
    db.session.flush()
    db.session.commit()

    # Re-fetch the assignments to get their updated state (now in Relief Pool)
    relief_pool_tasks = []
    if assignment_ids:
        updated = Assignment.query.filter(Assignment.id.in_(assignment_ids)).all()
        relief_pool_tasks = [a.to_dict() for a in updated]

    return {
        'id': absence.id,
        'aide_id': absence.aide_id,
        'date': absence.date.isoformat(),
        'reason': absence.reason,
        'relief_pool_tasks': relief_pool_tasks,
        'relief_pool_count': len(relief_pool_tasks)
    }, 201


@bp.delete('/absences/<int:absence_id>')
def delete_absence(absence_id: int):
    """
    DELETE /api/absences/{id}
    
    Delete an absence, attempting to restore Relief Pool tasks to the original aide.
    
    Returns:
        JSON with restored_tasks, conflict_tasks, and counts
        
    Errors:
        404: Absence not found
    """
    absence = db.session.get(Absence, absence_id)
    if not absence:
        return {'error': 'Absence not found'}, 404

    # Store info before deletion
    aide_id = absence.aide_id
    absence_date = absence.date

    # Attempt to restore Relief Pool tasks for this aide/date
    restored, conflicts = AbsenceService.restore_assignments_from_relief_pool(
        aide_id=aide_id,
        absence_date=absence_date
    )

    # Delete the absence
    db.session.delete(absence)
    db.session.commit()

    return {
        'message': 'Absence removed',
        'restored_tasks': restored,
        'conflict_tasks': conflicts,
        'restored_count': len(restored),
        'conflict_count': len(conflicts)
    }, 200


@bp.get('/aides/<int:aide_id>/absences')
def list_absences_for_aide(aide_id: int):
    """
    GET /api/aides/{aide_id}/absences
    
    List all absences for an aide.
    
    Returns:
        List of absences
    """
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
