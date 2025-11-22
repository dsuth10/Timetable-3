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
        category = category.strip().upper()
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
    """Create a task template (no assignment until dragged to calendar)"""
    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    category = (data.get('category') or '').strip()
    start_time = data.get('start_time', '09:00')  # Default placeholder
    end_time = data.get('end_time', '10:00')      # Default placeholder
    classroom_id = data.get('classroom_id')
    notes = data.get('notes')

    # Basic validation
    if not title:
        return {'error': 'title is required'}, 400
    if not category:
        return {'error': 'category is required'}, 400

    try:
        s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
        e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
        s_t = dt_time(s_h, s_m)
        e_t = dt_time(e_h, e_m)
    except Exception:
        return {'error': 'Invalid time format'}, 400

    # Create task template (no assignment - stays in Task Bank)
    try:
        task = Task(
            title=title,
            category=category,
            start_time=s_t,
            end_time=e_t,
            recurrence_rule=None,
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


# Old /recurring-tasks endpoint removed - recurring tasks are now created
# by editing an assigned task and enabling recurrence in the Edit Task dialog


@bp.put('/tasks/<int:task_id>')
def update_task(task_id: int):
    """Update an existing task (template only for recurring tasks)"""
    task = db.session.get(Task, task_id)
    if not task:
        return {'error': 'Task not found'}, 404

    data = request.get_json(silent=True) or {}
    
    # Extract and validate fields
    title = data.get('title')
    category = data.get('category')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    classroom_id = data.get('classroom_id')
    notes = data.get('notes')
    recurrence_rule = data.get('recurrence_rule')
    expires_on = data.get('expires_on')
    aide_id = data.get('aide_id')  # Optional aide to assign recurring tasks to
    existing_assignment_date = data.get('existing_assignment_date')  # Date to exclude from generation
    
    # Track if we're converting to recurring
    was_recurring = task.recurrence_rule is not None
    is_now_recurring = recurrence_rule is not None
    
    # Update fields if provided
    try:
        if title is not None:
            task.title = title.strip()
        
        if category is not None:
            task.category = category.strip()
        
        if start_time is not None:
            s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
            task.start_time = dt_time(s_h, s_m)
        
        if end_time is not None:
            e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
            task.end_time = dt_time(e_h, e_m)
        
        if 'classroom_id' in data:
            task.classroom_id = classroom_id
        
        if 'notes' in data:
            task.notes = notes
        
        if 'recurrence_rule' in data:
            task.recurrence_rule = recurrence_rule
        
        if 'expires_on' in data:
            if expires_on:
                task.expires_on = dt_date.fromisoformat(expires_on)
            else:
                task.expires_on = None
        
        db.session.flush()  # Flush to get updated task data
        
        # If task is being converted to recurring (or recurrence settings changed)
        if is_now_recurring and not was_recurring:
            # Parse existing assignment date if provided
            exclude_date = None
            if existing_assignment_date:
                try:
                    exclude_date = dt_date.fromisoformat(existing_assignment_date)
                except Exception:
                    pass
            
            # Generate recurring assignments
            assignments_data = RecurrenceService.generate_assignments_for_task(
                task_id=task.id,
                rrule_string=task.recurrence_rule,
                task_start_time=task.start_time,
                task_end_time=task.end_time,
                expires_on=task.expires_on,
                aide_id=aide_id,  # Pass the aide_id if provided
                exclude_date=exclude_date  # Exclude the existing assignment's date
            )
            
            # Create all the assignments
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
        return task.to_dict(), 200
    
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': 'Invalid data format'}, 400


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


@bp.delete('/tasks/<int:task_id>')
def delete_task(task_id: int):
    """Delete a task and all its assignments"""
    task = db.session.get(Task, task_id)
    if not task:
        return {'error': 'Task not found'}, 404
    
    try:
        # Check if this is a reset operation (keep task, delete assignments)
        reset = request.args.get('reset', '').lower() == 'true'
        
        if reset:
            # Delete all assignments
            Assignment.query.filter(Assignment.task_id == task_id).delete()
            
            # Reset task recurrence settings
            task.recurrence_rule = None
            task.expires_on = None
            
            db.session.commit()
            return {'message': 'Task reset successfully'}, 200
        
        # Delete the task itself - SQLAlchemy cascade will handle assignments
        db.session.delete(task)
        db.session.commit()
        
        return {'message': 'Task deleted successfully'}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to delete task: {str(e)}'}, 500