"""
Relief Pool Routes
API endpoints for managing Relief Pool tasks.
"""
from flask import Blueprint, request
from api.services.relief_pool_service import ReliefPoolService
from datetime import date as dt_date

bp = Blueprint('relief_pool', __name__, url_prefix='/api')


@bp.get('/relief-pool')
def get_relief_pool():
    """
    GET /api/relief-pool
    
    Retrieve all Relief Pool tasks, optionally filtered by date.
    
    Query Parameters:
        date: (optional) ISO date string to filter by
        include_expired: (optional) boolean to include expired tasks
    
    Returns:
        JSON with tasks, by_date grouping, and total_count
    """
    filter_date = None
    date_str = request.args.get('date')
    if date_str:
        try:
            filter_date = dt_date.fromisoformat(date_str)
        except ValueError:
            return {'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'}, 400
    
    include_expired = request.args.get('include_expired', 'false').lower() == 'true'
    
    try:
        result = ReliefPoolService.get_all(
            filter_date=filter_date,
            include_expired=include_expired
        )
        return result, 200
    except Exception as e:
        return {'error': str(e)}, 500


@bp.get('/relief-pool/count')
def get_relief_pool_count():
    """
    GET /api/relief-pool/count
    
    Get count of pending Relief Pool tasks (for badge display).
    
    Returns:
        JSON with count and by_date breakdown
    """
    try:
        result = ReliefPoolService.get_count()
        return result, 200
    except Exception as e:
        return {'error': str(e)}, 500


@bp.post('/relief-pool/<int:assignment_id>/reassign')
def reassign_relief_pool_task(assignment_id: int):
    """
    POST /api/relief-pool/{id}/reassign
    
    Reassign a Relief Pool task to a new aide.
    
    Request Body:
        aide_id: (required) ID of the aide to assign
        start_time: (optional) New start time (HH:MM:SS)
        end_time: (optional) New end time (HH:MM:SS)
        version: (required) Current version for optimistic locking
    
    Returns:
        Updated assignment data on success
        
    Errors:
        400: Missing required fields or invalid aide
        403: Date restriction violated (not used - date is implicit)
        404: Assignment not found or not in Relief Pool
        409: Time conflict or version mismatch
    """
    data = request.get_json(silent=True) or {}
    
    aide_id = data.get('aide_id')
    if not aide_id:
        return {'error': 'aide_id is required'}, 400
    
    version = data.get('version')
    if version is None:
        return {'error': 'version is required'}, 400
    
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    
    try:
        result = ReliefPoolService.reassign(
            assignment_id=assignment_id,
            aide_id=aide_id,
            version=version,
            start_time=start_time,
            end_time=end_time
        )
        return result, 200
    except ValueError as e:
        error_msg = str(e)
        if 'not found' in error_msg.lower():
            return {'error': error_msg}, 404
        if 'version mismatch' in error_msg.lower():
            return {
                'error': 'Assignment was modified by another user',
                'current_version': None,  # Would need to fetch current
                'your_version': version
            }, 409
        return {'error': error_msg}, 400
    except RuntimeError as e:
        # Time conflict
        return {
            'error': 'Time slot conflict with existing assignment',
            'conflict': str(e)
        }, 409
    except Exception as e:
        return {'error': str(e)}, 500


@bp.post('/relief-pool/<int:assignment_id>/dismiss')
def dismiss_relief_pool_task(assignment_id: int):
    """
    POST /api/relief-pool/{id}/dismiss
    
    Dismiss a Relief Pool task (mark as not needing coverage).
    
    Request Body:
        reason: (optional) Reason for dismissal
        version: (required) Current version for optimistic locking
    
    Returns:
        Confirmation message on success
        
    Errors:
        400: Missing version
        404: Assignment not found or not in Relief Pool
        409: Version mismatch
    """
    data = request.get_json(silent=True) or {}
    
    version = data.get('version')
    if version is None:
        return {'error': 'version is required'}, 400
    
    reason = data.get('reason')
    
    try:
        result = ReliefPoolService.dismiss(
            assignment_id=assignment_id,
            version=version,
            reason=reason
        )
        return result, 200
    except ValueError as e:
        error_msg = str(e)
        if 'not found' in error_msg.lower() or 'not in relief pool' in error_msg.lower():
            return {'error': error_msg}, 404
        if 'version mismatch' in error_msg.lower():
            return {
                'error': 'Assignment was modified by another user',
                'current_version': None,
                'your_version': version
            }, 409
        return {'error': error_msg}, 400
    except Exception as e:
        return {'error': str(e)}, 500





























