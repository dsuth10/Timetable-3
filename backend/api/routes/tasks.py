"""
Tasks routes: list/get and create recurring tasks
"""
from flask import Blueprint, request
from datetime import datetime, date as dt_date, time as dt_time
from api.models import db
from api.models.task import Task
from api.models.assignment import Assignment
from api.services.recurrence_service import RecurrenceService

bp = Blueprint('tasks', __name__, url_prefix='/api')


@bp.get('/tasks')
def list_tasks():
    category = request.args.get('category')
    q = Task.query
    if category:
        q = q.filter(Task.category == category)
    tasks = q.order_by(Task.id).all()
    return [t.to_dict() for t in tasks], 200


@bp.get('/tasks/<int:task_id>')
def get_task(task_id: int):
    task = db.session.get(Task, task_id)
    if not task:
        return {'error': 'Task not found'}, 404
    return task.to_dict(), 200


@bp.post('/tasks')
def create_task():
    """Create a one-off (non-recurring) task"""
    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    category = (data.get('category') or '').strip()
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    classroom_id = data.get('classroom_id')
    notes = data.get('notes')

    # Basic validation
    if not title:
        return {'error': 'title is required'}, 400
    if not category:
        return {'error': 'category is required'}, 400
    if not start_time or not end_time:
        return {'error': 'start_time and end_time are required'}, 400

    try:
        s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
        e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
        s_t = dt_time(s_h, s_m)
        e_t = dt_time(e_h, e_m)
    except Exception:
        return {'error': 'Invalid time format'}, 400

    # Create task
    try:
        task = Task(
            title=title,
            category=category,
            start_time=s_t,
            end_time=e_t,
            recurrence_rule=None,  # One-off task
            expires_on=None,
            classroom_id=classroom_id,
            notes=notes
        )
        db.session.add(task)
        db.session.commit()
        return task.to_dict(), 201
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400


@bp.post('/recurring-tasks')
def create_recurring_task():
    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    category = (data.get('category') or '').strip()
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    recurrence_rule = data.get('recurrence_rule')
    expires_on = data.get('expires_on')
    classroom_id = data.get('classroom_id')
    notes = data.get('notes')

    # Basic validation
    if not title:
        return {'error': 'title is required'}, 400
    if not category:
        return {'error': 'category is required'}, 400
    if not start_time or not end_time:
        return {'error': 'start_time and end_time are required'}, 400
    if not recurrence_rule:
        return {'error': 'recurrence_rule is required for recurring tasks'}, 400
    if not expires_on:
        return {'error': 'expires_on is required for recurring tasks'}, 400

    try:
        s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
        e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
        s_t = dt_time(s_h, s_m)
        e_t = dt_time(e_h, e_m)
        exp_d = dt_date.fromisoformat(expires_on)
    except Exception as e:
        return {'error': 'Invalid time/date format'}, 400

    # Create task
    try:
        task = Task(
            title=title,
            category=category,
            start_time=s_t,
            end_time=e_t,
            recurrence_rule=recurrence_rule,
            expires_on=exp_d,
            classroom_id=classroom_id,
            notes=notes
        )
        db.session.add(task)
        db.session.flush()  # get task.id
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400

    # Generate unassigned assignments within horizon
    assignments_data = RecurrenceService.generate_assignments_for_task(
        task_id=task.id,
        rrule_string=recurrence_rule,
        task_start_time=s_t,
        task_end_time=e_t,
        expires_on=exp_d
    )

    for a in assignments_data:
        db.session.add(
            Assignment(
                task_id=a['task_id'],
                aide_id=a['aide_id'],
                date=a['date'],
                start_time=a['start_time'],
                end_time=a['end_time'],
                status=a['status'],
                version=a['version']
            )
        )

    db.session.commit()
    return task.to_dict(), 201


@bp.get('/tasks/<int:task_id>/assignments')
def list_task_assignments(task_id: int):
    task = db.session.get(Task, task_id)
    if not task:
        return {'error': 'Task not found'}, 404

    items = (
        Assignment.query
        .filter(Assignment.task_id == task_id)
        .order_by(Assignment.date, Assignment.start_time)
        .all()
    )
    return [a.to_dict() for a in items], 200
