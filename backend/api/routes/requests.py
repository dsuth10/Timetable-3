"""
Requests routes: CRUD and status updates
"""
from flask import Blueprint, request
from datetime import date as dt_date, time as dt_time
from api.models import db
from api.models.request import Request, REQUEST_STATUSES
from api.models.classroom import Classroom

bp = Blueprint('requests', __name__, url_prefix='/api/requests')


@bp.get('')
def list_requests():
    status = request.args.get('status')
    q = Request.query
    if status:
        q = q.filter(Request.status == status.upper())
    items = q.order_by(Request.created_at.desc()).all()
    return [r.to_dict(include_classroom=True) for r in items], 200


@bp.post('')
def create_request():
    data = request.get_json(silent=True) or {}

    teacher = (data.get('requesting_teacher') or '').strip()
    title = (data.get('task_title') or '').strip()
    category = (data.get('task_category') or '').strip().upper()
    preferred_date = data.get('preferred_date')
    preferred_time = data.get('preferred_time')
    classroom_id = data.get('classroom_id')
    notes = data.get('notes')

    if not teacher:
        return {'error': 'requesting_teacher is required'}, 400
    if not title:
        return {'error': 'task_title is required'}, 400
    if not category:
        return {'error': 'task_category is required'}, 400
    if not preferred_date or not preferred_time:
        return {'error': 'preferred_date and preferred_time are required'}, 400

    try:
        d = dt_date.fromisoformat(preferred_date)
        h, m = [int(x) for x in preferred_time.split(':')[:2]]
        t = dt_time(h, m)
    except Exception:
        return {'error': 'Invalid date/time format'}, 400

    try:
        r = Request(
            requesting_teacher=teacher,
            task_title=title,
            task_category=category,
            preferred_date=d,
            preferred_time=t,
            classroom_id=classroom_id,
            notes=notes,
            status='PENDING'
        )
        db.session.add(r)
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400

    return r.to_dict(include_classroom=True), 201


@bp.get('/<int:request_id>')
def get_request(request_id: int):
    r = db.session.get(Request, request_id)
    if not r:
        return {'error': 'Request not found'}, 404
    return r.to_dict(include_classroom=True), 200


@bp.put('/<int:request_id>')
def update_request(request_id: int):
    r = db.session.get(Request, request_id)
    if not r:
        return {'error': 'Request not found'}, 404

    data = request.get_json(silent=True) or {}

    if 'requesting_teacher' in data and data['requesting_teacher'] is not None:
        r.requesting_teacher = data['requesting_teacher']
    if 'task_title' in data and data['task_title'] is not None:
        r.task_title = data['task_title']
    if 'task_category' in data and data['task_category'] is not None:
        r.task_category = (data['task_category'] or '').upper()
    if 'preferred_date' in data and data['preferred_date'] is not None:
        try:
            r.preferred_date = dt_date.fromisoformat(data['preferred_date'])
        except Exception:
            return {'error': 'Invalid preferred_date'}, 400
    if 'preferred_time' in data and data['preferred_time'] is not None:
        try:
            h, m = [int(x) for x in data['preferred_time'].split(':')[:2]]
            r.preferred_time = dt_time(h, m)
        except Exception:
            return {'error': 'Invalid preferred_time'}, 400
    if 'classroom_id' in data:
        r.classroom_id = data['classroom_id']
    if 'notes' in data:
        r.notes = data['notes']
    if 'status' in data and data['status'] is not None:
        status = data['status'].upper()
        if status not in REQUEST_STATUSES:
            return {'error': f"Status must be one of {REQUEST_STATUSES}"}, 400
        r.status = status

    try:
        db.session.add(r)
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400

    return r.to_dict(include_classroom=True), 200


@bp.delete('/<int:request_id>')
def delete_request(request_id: int):
    r = db.session.get(Request, request_id)
    if not r:
        return {'error': 'Request not found'}, 404
    db.session.delete(r)
    db.session.commit()
    return '', 204


