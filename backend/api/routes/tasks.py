"""
Tasks routes: list/get and create recurring tasks
"""
from flask import Blueprint, request
from datetime import datetime, date as dt_date, time as dt_time, timedelta
from api.models import db
from api.models.task import Task, TASK_CATEGORIES
from api.models.assignment import Assignment
from api.models.recurring_series import RecurringSeries
from api.models.teacher_aide import TeacherAide
from api.models.classroom import Classroom
from api.services.recurrence_service import RecurrenceService
from api.services.collision_service import CollisionService

bp = Blueprint('tasks', __name__, url_prefix='/api')


@bp.get('/tasks')
def list_tasks():
    category = request.args.get('category')
    classroom_id = request.args.get('classroom_id')
    q = Task.query
    if category:
        category = category.strip().upper()
        q = q.filter(Task.category == category)
    if classroom_id:
        try:
            q = q.filter(Task.classroom_id == int(classroom_id))
        except ValueError:
            return {'error': 'Invalid classroom_id'}, 400
            
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
    # Default to CLASS_SUPPORT for quick-create flow (when classroom_id is provided)
    category = (data.get('category') or ('CLASS_SUPPORT' if data.get('classroom_id') else 'General')).strip()
    start_time = data.get('start_time', '09:00')  # Default placeholder
    end_time = data.get('end_time', '10:00')      # Default placeholder
    classroom_id = data.get('classroom_id')
    # Support both 'notes' (legacy) and 'description' (new contract) for compatibility
    notes = data.get('notes') or data.get('description')

    # Basic validation
    if not title:
        return {'error': 'title is required'}, 400
    # if not category:
    #     return {'error': 'category is required'}, 400

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


@bp.post('/quick-create-task')
def quick_create_task():
    """
    Create a task template and an assignment in a single atomic operation.
    Used by the quick-click feature to create tasks directly from the timetable.
    """
    data = request.get_json(silent=True) or {}
    
    # Extract and validate required fields
    title = (data.get('title') or '').strip()
    category = (data.get('category') or '').strip().upper()
    date_str = data.get('date')
    start_time_str = data.get('start_time')
    duration_minutes = data.get('duration_minutes')
    aide_id = data.get('aide_id')
    
    # Extract optional fields
    classroom_id = data.get('classroom_id')
    notes = data.get('notes')
    
    # Validate required fields
    if not title:
        return {'error': 'Bad request', 'message': 'Missing required fields: title'}, 400
    
    if not category:
        return {'error': 'Bad request', 'message': 'Missing required fields: category'}, 400
    
    if category not in TASK_CATEGORIES:
        return {'error': 'Bad request', 'message': f'Invalid category. Must be one of: {", ".join(TASK_CATEGORIES)}'}, 400
    
    if not date_str:
        return {'error': 'Bad request', 'message': 'Missing required fields: date'}, 400
    
    if not start_time_str:
        return {'error': 'Bad request', 'message': 'Missing required fields: start_time'}, 400
    
    if duration_minutes is None:
        return {'error': 'Bad request', 'message': 'Missing required fields: duration_minutes'}, 400
    
    if aide_id is None:
        return {'error': 'Bad request', 'message': 'Missing required fields: aide_id'}, 400
    
    # Validate duration
    try:
        duration_minutes = int(duration_minutes)
        if duration_minutes < 5 or duration_minutes > 60 or duration_minutes % 5 != 0:
            return {'error': 'Bad request', 'message': 'duration_minutes must be between 5 and 60 and a multiple of 5'}, 400
    except (ValueError, TypeError):
        return {'error': 'Bad request', 'message': 'duration_minutes must be an integer'}, 400
    
    # Parse and validate date
    try:
        assign_date = dt_date.fromisoformat(date_str)
    except (ValueError, TypeError):
        return {'error': 'Bad request', 'message': 'Invalid date format. Expected YYYY-MM-DD'}, 400
    
    # Parse and validate start_time (must be in 5-minute increments)
    try:
        time_parts = start_time_str.split(':')
        if len(time_parts) < 2:
            return {'error': 'Bad request', 'message': 'Invalid time format. Expected HH:MM or HH:MM:SS'}, 400
        
        s_h = int(time_parts[0])
        s_m = int(time_parts[1])
        
        if s_h < 0 or s_h > 23 or s_m < 0 or s_m > 59:
            return {'error': 'Bad request', 'message': 'Invalid time values'}, 400
        
        if s_m % 5 != 0:
            return {'error': 'Bad request', 'message': 'start_time must be in 5-minute increments'}, 400
        
        start_time = dt_time(s_h, s_m)
    except (ValueError, TypeError, IndexError):
        return {'error': 'Bad request', 'message': 'Invalid time format. Expected HH:MM or HH:MM:SS'}, 400
    
    # Calculate end_time from start_time + duration_minutes
    start_datetime = datetime.combine(assign_date, start_time)
    end_datetime = start_datetime + timedelta(minutes=duration_minutes)
    end_time = end_datetime.time()
    
    # Validate end_time is in 5-minute increments
    if end_time.minute % 5 != 0:
        return {'error': 'Bad request', 'message': 'Calculated end_time must be in 5-minute increments'}, 400
    
    # Validate foreign keys
    aide = db.session.get(TeacherAide, aide_id)
    if not aide:
        return {'error': 'Not found', 'message': f'Aide with id {aide_id} does not exist'}, 404
    
    if classroom_id is not None:
        classroom = db.session.get(Classroom, classroom_id)
        if not classroom:
            return {'error': 'Not found', 'message': f'Classroom with id {classroom_id} does not exist'}, 404
    
    # Check collision detection before creating anything
    validation = CollisionService.validate_assignment(
        aide_id=aide_id,
        assignment_date=assign_date,
        start_time=start_time,
        end_time=end_time
    )
    
    if not validation['valid']:
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
            'error': 'Conflict',
            'message': validation['error'] or 'Assignment conflicts with existing assignment',
            'conflicts': formatted_conflicts
        }, 409
    
    # Create task and assignment in a single transaction
    try:
        # Create task with placeholder times (09:00-10:00)
        task = Task(
            title=title,
            category=category,
            start_time=dt_time(9, 0),  # Placeholder
            end_time=dt_time(10, 0),  # Placeholder
            classroom_id=classroom_id,
            notes=notes,
            status='UNASSIGNED'
        )
        db.session.add(task)
        db.session.flush()  # Get task ID before creating assignment
        
        # Create assignment with actual times
        assignment = Assignment(
            task_id=task.id,
            aide_id=aide_id,
            date=assign_date,
            start_time=start_time,
            end_time=end_time,
            status='ASSIGNED',
            version=1,
            original_aide_id=None,
            recurring_series_id=None
        )
        db.session.add(assignment)
        db.session.flush()  # Get assignment ID
        
        # Commit transaction
        db.session.commit()
        
        # Return both task and assignment
        return {
            'task': task.to_dict(),
            'assignment': assignment.to_dict()
        }, 201
        
    except ValueError as e:
        db.session.rollback()
        return {'error': 'Bad request', 'message': str(e)}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': 'Internal server error', 'message': f'Database transaction failed: {str(e)}'}, 500


@bp.put('/tasks/<int:task_id>')
def update_task(task_id: int):
    """Update an existing task template and optionally create a recurring series"""
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
    
    # Validate recurrence parameters
    if recurrence_rule is not None and expires_on is None:
        return {'error': 'expires_on is required when recurrence_rule is provided'}, 400
    
    # Check if recurrence is being requested
    is_creating_recurring = recurrence_rule is not None and expires_on is not None
    
    # Update task template fields if provided
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
        
        db.session.flush()  # Flush to get updated task data
        
        # If recurrence is being requested, create a new recurring series
        if is_creating_recurring:
            # Parse existing assignment date (base date for the series)
            base_date = dt_date.today()
            if existing_assignment_date:
                try:
                    base_date = dt_date.fromisoformat(existing_assignment_date)
                except Exception:
                    pass
            
            # Parse expires_on date
            expires_on_date = dt_date.fromisoformat(expires_on)
            
            # Parse times for the series
            series_start_time = task.start_time
            series_end_time = task.end_time
            if start_time:
                s_h, s_m = [int(x) for x in start_time.split(':')[:2]]
                series_start_time = dt_time(s_h, s_m)
            if end_time:
                e_h, e_m = [int(x) for x in end_time.split(':')[:2]]
                series_end_time = dt_time(e_h, e_m)
            
            # Create the recurring series
            recurring_series = RecurringSeries(
                task_id=task.id,
                aide_id=aide_id,
                recurrence_rule=recurrence_rule,
                expires_on=expires_on_date,
                start_time=series_start_time,
                end_time=series_end_time,
                base_date=base_date
            )
            db.session.add(recurring_series)
            db.session.flush()  # Get the series ID
            
            # Generate recurring assignments linked to this series
            assignments_data = RecurrenceService.generate_assignments_for_task(
                task_id=task.id,
                rrule_string=recurrence_rule,
                task_start_time=series_start_time,
                task_end_time=series_end_time,
                expires_on=expires_on_date,
                aide_id=aide_id,
                exclude_date=base_date,  # Exclude the base date (existing assignment)
                recurring_series_id=recurring_series.id  # Link to the series
            )
            
            # Create all the assignments
            for a in assignments_data:
                db.session.add(
                    Assignment(
                        task_id=a['task_id'],
                        aide_id=a['aide_id'],
                        recurring_series_id=a['recurring_series_id'],
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
        return {'error': f'Invalid data format: {str(e)}'}, 400


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