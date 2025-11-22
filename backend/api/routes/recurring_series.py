"""
RecurringSeries routes: get, update, delete recurring series
"""
from flask import Blueprint, request
from datetime import date as dt_date, datetime, time as dt_time

from api.models import db
from api.models.recurring_series import RecurringSeries
from api.models.assignment import Assignment

bp = Blueprint('recurring_series', __name__, url_prefix='/api')


@bp.get('/recurring-series/<int:series_id>')
def get_recurring_series(series_id: int):
    """Get a recurring series by ID"""
    series = db.session.get(RecurringSeries, series_id)
    if not series:
        return {'error': 'Recurring series not found'}, 404
    return series.to_dict(include_relationships=True), 200


@bp.put('/recurring-series/<int:series_id>')
def update_recurring_series(series_id: int):
    """Update a recurring series (e.g., extend expiry date)"""
    series = db.session.get(RecurringSeries, series_id)
    if not series:
        return {'error': 'Recurring series not found'}, 404
    
    data = request.get_json(silent=True) or {}
    
    # Extract updatable fields
    expires_on = data.get('expires_on')
    recurrence_rule = data.get('recurrence_rule')
    
    try:
        # Update expires_on if provided
        if expires_on:
            new_expires_on = dt_date.fromisoformat(expires_on)
            old_expires_on = series.expires_on
            series.expires_on = new_expires_on
            
            # If extending the expiry date, generate new assignments
            if new_expires_on > old_expires_on:
                from api.services.recurrence_service import RecurrenceService
                
                # Find the latest assignment date for this series
                latest_assignment = (
                    Assignment.query
                    .filter(Assignment.recurring_series_id == series_id)
                    .order_by(Assignment.date.desc())
                    .first()
                )
                
                if latest_assignment:
                    # Generate additional assignments
                    new_assignments = RecurrenceService.extend_horizon_for_task(
                        task_id=series.task_id,
                        rrule_string=series.recurrence_rule,
                        task_start_time=series.start_time,
                        task_end_time=series.end_time,
                        expires_on=new_expires_on,
                        current_latest_date=latest_assignment.date,
                        aide_id=series.aide_id,
                        recurring_series_id=series.id
                    )
                    
                    # Create new assignments
                    for a in new_assignments:
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
        
        # Update recurrence_rule if provided
        if recurrence_rule:
            series.recurrence_rule = recurrence_rule
        
        db.session.commit()
        return series.to_dict(include_relationships=True), 200
    
    except ValueError as e:
        db.session.rollback()
        return {'error': str(e)}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to update recurring series: {str(e)}'}, 500


@bp.delete('/recurring-series/<int:series_id>')
def delete_recurring_series(series_id: int):
    """Delete a recurring series and all future assignments"""
    series = db.session.get(RecurringSeries, series_id)
    if not series:
        return {'error': 'Recurring series not found'}, 404
    
    # Option to delete only future assignments or all assignments
    delete_all = request.args.get('delete_all', 'false').lower() == 'true'
    
    try:
        if delete_all:
            # Delete all assignments for this series
            Assignment.query.filter(Assignment.recurring_series_id == series_id).delete()
        else:
            # Delete only future assignments (date >= today)
            today = dt_date.today()
            Assignment.query.filter(
                Assignment.recurring_series_id == series_id,
                Assignment.date >= today
            ).delete()
        
        # Delete the series itself
        db.session.delete(series)
        db.session.commit()
        
        return {'message': 'Recurring series deleted successfully'}, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to delete recurring series: {str(e)}'}, 500


@bp.get('/recurring-series')
def list_recurring_series():
    """List all recurring series, optionally filtered by task_id or aide_id"""
    task_id = request.args.get('task_id', type=int)
    aide_id = request.args.get('aide_id', type=int)
    
    query = RecurringSeries.query
    
    if task_id:
        query = query.filter(RecurringSeries.task_id == task_id)
    
    if aide_id:
        query = query.filter(RecurringSeries.aide_id == aide_id)
    
    series_list = query.order_by(RecurringSeries.expires_on.desc()).all()
    
    return [s.to_dict(include_relationships=True) for s in series_list], 200

