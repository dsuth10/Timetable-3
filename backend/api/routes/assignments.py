"""
Assignments routes: create, batch, update, get, weekly matrix
"""
from flask import Blueprint, request
from datetime import date as dt_date, datetime, time as dt_time, timedelta
from typing import List, Dict
from sqlalchemy.exc import IntegrityError

from api.models import db
from api.models.assignment import Assignment, ASSIGNMENT_STATUSES
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from api.models.task import Task
from api.models.teacher_aide import TeacherAide
from api.models.term_week import TermWeek
from api.services.collision_service import CollisionService
from api.services.conflict_resolver import ConflictResolver
from api.services.assignment_service import AssignmentSeriesService
from api.middleware.validation import require_json, validate_time_30min

bp = Blueprint('assignments', __name__, url_prefix='/api')


@bp.get('/assignments')
def list_assignments():
    stmt = select(Assignment).order_by(Assignment.date, Assignment.start_time)
    items = db.session.execute(stmt).scalars().all()
    return [a.to_dict() for a in items], 200


@bp.get('/assignments/<int:assignment_id>')
def get_assignment(assignment_id: int):
    assignment = db.session.get(Assignment, assignment_id)
    if not assignment:
        return {'error': 'Assignment not found'}, 404
    return assignment.to_dict(), 200


@bp.get('/assignments/<int:assignment_id>/tooltip')
def get_assignment_tooltip(assignment_id: int):
    """
    GET /api/assignments/{id}/tooltip
    Returns aggregated data for task tooltip.
    """
    data = AssignmentSeriesService.get_tooltip_data(assignment_id)
    if not data:
        return {'error': 'Assignment not found'}, 404
    return data, 200


@bp.post('/assignments')
@require_json(["task_id", "date", "start_time", "end_time"])
@validate_time_30min(["start_time", "end_time"])
def create_assignment():
    data = request.get_json(silent=True) or {}

    task_id = data.get('task_id')
    aide_id = data.get('aide_id')  # may be None
    date_str = data.get('date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    auto_shorten = bool(data.get('auto_shorten'))

    try:
        assign_date = dt_date.fromisoformat(date_str)
        s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
        e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
        s_t = dt_time(s_h, s_m)
        e_t = dt_time(e_h, e_m)
    except Exception:
        return {'error': 'Invalid date/time format'}, 400

    # If aide provided, validate conflicts and availability
    if aide_id is not None:
        validation = CollisionService.validate_assignment(
            aide_id=aide_id,
            assignment_date=assign_date,
            start_time=s_t,
            end_time=e_t
        )
        
        if not validation['valid']:
            if auto_shorten and validation['conflicts']:
                # Try auto-shorten
                resolution = ConflictResolver.resolve_with_auto_shorten(
                    aide_id=aide_id,
                    assignment_date=assign_date,
                    start_time=s_t,
                    end_time=e_t
                )
                if not resolution['can_resolve']:
                    return {'error': resolution['error'] or 'Conflict'}, 409
            else:
                # Format conflicts for response
                formatted_conflicts = []
                for conflict in validation['conflicts']:
                    formatted_conflicts.append({
                        'existing_assignment_id': conflict.id,
                        'task_id': conflict.task_id,
                        'date': conflict.date.isoformat(),
                        'start_time': conflict.start_time.strftime('%H:%M:%S'),
                        'end_time': conflict.end_time.strftime('%H:%M:%S'),
                        'status': conflict.status
                    })
                return {
                    'error': validation['error'] or 'Conflict',
                    'conflicts': formatted_conflicts
                }, 409

    initial_status = 'ASSIGNED' if aide_id is not None else 'UNASSIGNED'
    assignment = Assignment(
        task_id=task_id,
        aide_id=aide_id,
        date=assign_date,
        start_time=s_t,
        end_time=e_t,
        status=initial_status,
        version=1
    )
    
    try:
        db.session.add(assignment)
        db.session.commit()
        # Build response explicitly to ensure required fields
        # Use model serializer for full fidelity
        result = assignment.to_dict(include_seconds=auto_shorten)
        try:
            print("DEBUG_CREATE_ASSIGNMENT_RES", result)
        except Exception:
            pass
        return result, 201
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to create assignment: {str(e)}'}, 500


@bp.post('/assignments/batch')
@require_json(["task_id", "dates", "start_time", "end_time"])
@validate_time_30min(["start_time", "end_time"])
def batch_assignments():
    data = request.get_json(silent=True) or {}

    task_id = data.get('task_id')
    aide_id = data.get('aide_id')  # may be None
    dates = data.get('dates') or []
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    # dates list must be non-empty per contract
    if not dates:
        return {'error': 'dates must be a non-empty array'}, 400

    try:
        s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
        e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
        s_t = dt_time(s_h, s_m)
        e_t = dt_time(e_h, e_m)
    except Exception:
        return {'error': 'Invalid time format'}, 400

    created = []
    conflicts = []

    for d in dates:
        try:
            assign_date = dt_date.fromisoformat(d)
        except Exception:
            conflicts.append({'date': d, 'reason': 'Invalid date'})
            continue

        if aide_id is not None:
            validation = CollisionService.validate_assignment(
                aide_id=aide_id,
                assignment_date=assign_date,
                start_time=s_t,
                end_time=e_t
            )
            if not validation['valid']:
                conflicts.append({'date': d, 'reason': validation['error']})
                continue

        a = Assignment(
            task_id=task_id,
            aide_id=aide_id,
            date=assign_date,
            start_time=s_t,
            end_time=e_t,
            status='ASSIGNED' if aide_id is not None else 'UNASSIGNED',
            version=1
        )
        db.session.add(a)
        created.append(a)

    try:
        db.session.commit()
        status_code = 201 if not conflicts else (207 if created else 409)
        return {
            'assignments': [a.to_dict() for a in created],
            'conflicts': conflicts
        }, status_code
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to commit batch assignments: {str(e)}'}, 500


@bp.delete('/assignments/<int:assignment_id>')
def delete_assignment(assignment_id: int):
    """Delete a specific assignment instance"""
    assignment = db.session.get(Assignment, assignment_id)
    if not assignment:
        return {'error': 'Assignment not found'}, 404
    
    try:
        db.session.delete(assignment)
        db.session.commit()
        return {'message': 'Assignment deleted successfully'}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to delete assignment: {str(e)}'}, 500


@bp.put('/assignments/<int:assignment_id>')
def update_assignment(assignment_id: int):
    assignment = db.session.get(Assignment, assignment_id)
    if not assignment:
        return {'error': 'Assignment not found'}, 404

    data = request.get_json(silent=True) or {}

    # Optimistic locking
    client_version = data.get('version')
    if client_version is None:
        return {'error': 'version is required for optimistic locking'}, 400
    if assignment.version != int(client_version):
        return {'error': 'Version conflict'}, 409

    # Update fields
    aide_id = data.get('aide_id', assignment.aide_id)
    date_str = data.get('date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    status = data.get('status', assignment.status)
    
    # Auto-update status based on aide_id change
    if aide_id is not None and assignment.aide_id is None:
        # Assigning an aide to an unassigned task
        status = 'ASSIGNED'
    elif aide_id is None and assignment.aide_id is not None:
        # Unassigning a task
        status = 'UNASSIGNED'

    # Validate status early to return 400 instead of raising
    if status and status.upper() not in ASSIGNMENT_STATUSES:
        return {'error': f"Status must be one of {ASSIGNMENT_STATUSES}"}, 400

    s_t = assignment.start_time
    e_t = assignment.end_time
    assign_date = assignment.date

    if start_time:
        s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
        s_t = dt_time(s_h, s_m)
    if end_time:
        e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
        e_t = dt_time(e_h, e_m)
    if date_str:
        try:
            assign_date = dt_date.fromisoformat(date_str)
        except Exception:
            return {'error': 'Invalid date format'}, 400

    # Validate if aide assigned
    if aide_id is not None:
        validation = CollisionService.validate_assignment(
            aide_id=aide_id,
            assignment_date=assign_date,
            start_time=s_t,
            end_time=e_t,
            exclude_assignment_id=assignment.id
        )
        if not validation['valid']:
            return {
                'error': validation['error'], 
                'conflicts': [c.to_dict() for c in validation['conflicts']],
                'assignment_id': assignment_id,
                'requested_aide_id': aide_id
            }, 409

    # Apply updates
    assignment.aide_id = aide_id
    assignment.date = assign_date
    assignment.start_time = s_t
    assignment.end_time = e_t
    assignment.status = status.upper() if isinstance(status, str) else status
    assignment.version += 1

    try:
        db.session.add(assignment)
        db.session.commit()
        return assignment.to_dict(), 200
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to update assignment: {str(e)}'}, 500


@bp.route('/assignments/<int:assignment_id>/recurring-series-for-aide', methods=['DELETE'])
def delete_assignment_series_for_aide(assignment_id: int):
    """
    DELETE /api/assignments/{id}/recurring-series-for-aide
    
    Delete this and future recurring assignments for the same aide.
    Supports preview mode via ?preview=true query parameter.
    """
    data = request.get_json(silent=True) or {}
    version = data.get('version')
    preview = request.args.get('preview', 'false').lower() == 'true'
    
    if version is None:
        return {'error': 'version is required'}, 400
        
    try:
        if preview:
            # Preview mode: return what would be deleted
            deletable_ids, skipped_count = AssignmentSeriesService.get_deletable_assignments(assignment_id)
            return {
                "preview": True,
                "would_delete_count": len(deletable_ids),
                "would_delete_ids": deletable_ids,
                "would_skip_count": skipped_count,
                "would_skip_reason": f"{skipped_count} modified assignment(s) would be preserved" if skipped_count > 0 else None
            }, 200
        else:
            # Execution mode: delete assignments
            result = AssignmentSeriesService.delete_recurring_series_for_aide(assignment_id, version)
            return result, 200
            
    except ValueError as e:
        error_msg = str(e)
        if 'not found' in error_msg.lower():
            return {'error': error_msg}, 404
        if 'version mismatch' in error_msg.lower():
            # Return detail for conflict resolution if needed
            return {
                'error': 'Assignment was modified by another user',
                'current_version': None, # We could fetch it if we want
                'your_version': version
            }, 409
        return {'error': error_msg}, 400
    except Exception as e:
        return {'error': f"Internal server error: {str(e)}"}, 500


@bp.get('/assignments/unassigned')
def get_unassigned_assignments():
    """Get all unassigned assignments regardless of date"""
    # Remove date filtering - show all unassigned tasks
    stmt = (
        select(Assignment)
        .filter(Assignment.status == 'UNASSIGNED')
        .order_by(Assignment.date, Assignment.start_time)
    )
    
    assignments = db.session.execute(stmt).scalars().all()
    return [a.to_dict() for a in assignments], 200


@bp.get('/assignments/assigned')
def get_assigned_assignments():
    """Get all assigned assignments from today forward"""
    today = dt_date.today()
    stmt = (
        select(Assignment)
        .options(joinedload(Assignment.aide))
        .filter(
            Assignment.aide_id.isnot(None),
            Assignment.date >= today
        )
        .order_by(Assignment.date, Assignment.start_time)
    )
    assignments = db.session.execute(stmt).scalars().all()
    return [a.to_dict(include_relationships=True) for a in assignments], 200


@bp.get('/assignments/weekly-matrix')
def weekly_matrix():
    start_date_str = request.args.get('start_date')
    if not start_date_str:
        return {'error': 'start_date is required (YYYY-MM-DD)'}, 400
    try:
        start_date = dt_date.fromisoformat(start_date_str)
    except Exception:
        return {'error': 'Invalid date format'}, 400

    # 5 weekdays horizon (Mon-Fri)
    days = [start_date + timedelta(days=i) for i in range(5)]

    # Fetch Term Information for the week (try to find the first available record in the week)
    term_info = db.session.execute(
        select(TermWeek)
        .filter(TermWeek.date >= days[0], TermWeek.date <= days[-1])
        .order_by(TermWeek.date)
        .limit(1)
    ).scalar_one_or_none()
    term_data = term_info.to_dict() if term_info else None

    # Build aides list
    stmt = select(TeacherAide).order_by(TeacherAide.id)
    aides = db.session.execute(stmt).scalars().all()
    aides_json = [a.to_dict() for a in aides]

    from api.config import SCHEDULE_CONFIG
    
    # Use centralized configuration
    time_slots = []
    for start_time, duration in SCHEDULE_CONFIG["SEGMENTS"]:
        time_slots.append({'start_time': start_time, 'duration_minutes': duration})

    timeline_config = {
        "slots": time_slots,
        "start_time": SCHEDULE_CONFIG["START_TIME"],
        "end_time": SCHEDULE_CONFIG["END_TIME"]
    }
    
    # ...
    # Skip build matrix lines as they are unchanged

    # Build matrix: aide_id -> {date -> [assignments/conflicts info]}
    matrix = {str(a.id): {} for a in aides}

    # Load assignments for the week
    stmt = (
        select(Assignment)
        .options(joinedload(Assignment.task))
        .options(joinedload(Assignment.task).joinedload(Task.classroom))  # Also load classroom for color info
        .filter(Assignment.date >= days[0], Assignment.date <= days[-1])
        .order_by(Assignment.aide_id, Assignment.date, Assignment.start_time)
    )
    items = db.session.execute(stmt).scalars().all()

    # Simple aggregation: group by aide/date
    for a in aides:
        for d in days:
            matrix[str(a.id)][d.isoformat()] = []

    conflicts = []

    def _to_time(value):
        if isinstance(value, str):
            parts = value.split(':')
            return dt_time(int(parts[0]), int(parts[1]))
        return value

    for asg in items:
        key = str(asg.aide_id) if asg.aide_id else None
        if key and asg.date.isoformat() in matrix[key]:
            lst = matrix[key][asg.date.isoformat()]
            overlap = any(
                CollisionService.check_time_overlap(
                    _to_time(item['start_time']),
                    _to_time(item['end_time']),
                    asg.start_time,
                    asg.end_time
                ) for item in lst
            )
            if overlap:
                conflicts.append({'assignment_id': asg.id, 'aide_id': asg.aide_id, 'date': asg.date.isoformat()})
            lst.append(asg.to_dict(include_relationships=True))

    return {
        'aides': aides_json,
        'time_slots': time_slots,
        'matrix': matrix,
        'conflicts': conflicts,
        'timeline_config': timeline_config,
        'term_info': term_data
    }, 200
