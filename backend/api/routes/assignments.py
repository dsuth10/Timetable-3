"""
Assignments routes: create, batch, update, get, weekly matrix
"""
from flask import Blueprint, request
from datetime import date as dt_date, datetime, time as dt_time, timedelta
from typing import List, Dict
from sqlalchemy.exc import IntegrityError

from api.models import db
from api.models.assignment import Assignment, ASSIGNMENT_STATUSES
from api.models.task import Task
from api.models.teacher_aide import TeacherAide
from api.services.collision_service import CollisionService
from api.services.conflict_resolver import ConflictResolver

bp = Blueprint('assignments', __name__, url_prefix='/api')


@bp.get('/assignments/<int:assignment_id>')
def get_assignment(assignment_id: int):
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return {'error': 'Assignment not found'}, 404
    return assignment.to_dict(), 200


@bp.post('/assignments')
def create_assignment():
    data = request.get_json(silent=True) or {}

    task_id = data.get('task_id')
    aide_id = data.get('aide_id')  # may be None
    date_str = data.get('date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    auto_shorten = bool(data.get('auto_shorten'))

    if not task_id or not date_str or not start_time or not end_time:
        return {'error': 'task_id, date, start_time, end_time are required'}, 400

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
                        'start_time': conflict.start_time.strftime('%H:%M'),
                        'end_time': conflict.end_time.strftime('%H:%M'),
                        'status': conflict.status
                    })
                return {
                    'error': validation['error'] or 'Conflict',
                    'conflicts': formatted_conflicts
                }, 409

    assignment = Assignment(
        task_id=task_id,
        aide_id=aide_id,
        date=assign_date,
        start_time=s_t,
        end_time=e_t,
        status='ASSIGNED' if aide_id is not None else 'UNASSIGNED',
        version=1
    )
    db.session.add(assignment)
    db.session.commit()
    return assignment.to_dict(), 201


@bp.post('/assignments/batch')
def batch_assignments():
    data = request.get_json(silent=True) or {}

    task_id = data.get('task_id')
    aide_id = data.get('aide_id')  # may be None
    dates = data.get('dates') or []
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    if not task_id or not dates or not start_time or not end_time:
        return {'error': 'task_id, dates, start_time, end_time are required'}, 400

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

    db.session.commit()

    status_code = 201 if not conflicts else (207 if created else 409)
    return {
        'assignments': [a.to_dict() for a in created],
        'conflicts': conflicts
    }, status_code


@bp.put('/assignments/<int:assignment_id>')
def update_assignment(assignment_id: int):
    assignment = Assignment.query.get(assignment_id)
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
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    status = data.get('status', assignment.status)

    # Validate status early to return 400 instead of raising
    if status and status.upper() not in ASSIGNMENT_STATUSES:
        return {'error': f"Status must be one of {ASSIGNMENT_STATUSES}"}, 400

    s_t = assignment.start_time
    e_t = assignment.end_time

    if start_time:
        s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
        s_t = dt_time(s_h, s_m)
    if end_time:
        e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
        e_t = dt_time(e_h, e_m)

    # Validate if aide assigned
    if aide_id is not None:
        validation = CollisionService.validate_assignment(
            aide_id=aide_id,
            assignment_date=assignment.date,
            start_time=s_t,
            end_time=e_t,
            exclude_assignment_id=assignment.id
        )
        if not validation['valid']:
            return {'error': validation['error'], 'conflicts': [c.to_dict() for c in validation['conflicts']]}, 409

    # Apply updates
    assignment.aide_id = aide_id
    assignment.start_time = s_t
    assignment.end_time = e_t
    assignment.status = status.upper() if isinstance(status, str) else status
    assignment.version += 1

    db.session.add(assignment)
    db.session.commit()
    return assignment.to_dict(), 200


@bp.get('/assignments/unassigned')
def get_unassigned_assignments():
    """Get all unassigned assignments, optionally filtered by date"""
    date_str = request.args.get('date')
    
    query = Assignment.query.filter(Assignment.status == 'UNASSIGNED')
    
    if date_str:
        try:
            filter_date = dt_date.fromisoformat(date_str)
            query = query.filter(Assignment.date == filter_date)
        except Exception:
            return {'error': 'Invalid date format'}, 400
    
    assignments = query.order_by(Assignment.date, Assignment.start_time).all()
    return [a.to_dict() for a in assignments], 200


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

    # Build aides list
    aides = TeacherAide.query.order_by(TeacherAide.id).all()
    aides_json = [a.to_dict() for a in aides]

    # Time slots 08:00..17:00 per 30 min
    time_slots = []
    for h in range(8, 18):
        for m in (0, 30):
            time_slots.append({'time': f"{h:02d}:{m:02d}:00"})

    # Build matrix: aide_id -> {date -> [assignments/conflicts info]}
    matrix = {str(a.id): {} for a in aides}

    # Load assignments for the week
    items = (
        Assignment.query
        .filter(Assignment.date >= days[0], Assignment.date <= days[-1])
        .order_by(Assignment.aide_id, Assignment.date, Assignment.start_time)
        .all()
    )

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
            lst.append(asg.to_dict())

    return {
        'aides': aides_json,
        'time_slots': time_slots,
        'matrix': matrix,
        'conflicts': conflicts
    }, 200
