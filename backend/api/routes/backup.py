"""
Backup routes: Create, progress, and download database backups
"""
import logging
from flask import Blueprint, request, send_file, jsonify
from api.services.backup_service import BackupService

bp = Blueprint('backup', __name__, url_prefix='/api/backup')

# Lazy initialization - service will be created when needed
_backup_service = None

def get_backup_service():
    """Get backup service instance (lazy initialization)."""
    global _backup_service
    if _backup_service is None:
        _backup_service = BackupService()
    return _backup_service

# Logger for error tracking
logger = logging.getLogger(__name__)


@bp.post('/create')
def create_backup():
    """Create a database backup in the specified format."""
    data = request.get_json(silent=True) or {}
    format_type = data.get('format')
    
    # Validate format
    valid_formats = ['sql', 'json', 'csv', 'sqlite_gz']
    if not format_type:
        return {'error': 'format is required'}, 400
    if format_type not in valid_formats:
        return {
            'error': 'Invalid backup format specified',
            'details': f'Format must be one of: {", ".join(valid_formats)}'
        }, 400
    
    try:
        # Create backup (progress will be stored in module-level dict)
        result = get_backup_service().create_backup(format_type)
        
        if result['status'] == 'failed':
            # Log error for troubleshooting
            logger.error(f"Backup creation failed: {result.get('error')}", extra={
                'backup_id': result['backup_id'],
                'format': format_type,
                'error': result.get('error')
            })
            return result, 500
        
        # Log successful backup creation
        logger.info(f"Backup created successfully", extra={
            'backup_id': result['backup_id'],
            'format': format_type,
            'size_bytes': result['size_bytes']
        })
        
        return result, 200
        
    except Exception as e:
        # Log unexpected errors
        logger.exception(f"Unexpected error during backup creation: {str(e)}", extra={
            'format': format_type,
            'error': str(e)
        })
        return {
            'error': 'Internal server error during backup creation',
            'details': str(e)
        }, 500


@bp.get('/<backup_id>/progress')
def get_backup_progress(backup_id: str):
    """Get progress updates for a backup being created."""
    try:
        progress = get_backup_service().get_progress(backup_id)
        
        if not progress:
            # Check if we have a final response instead
            response = get_backup_service().get_response(backup_id)
            if response:
                # Return progress format with completed status
                return {
                    'backup_id': backup_id,
                    'progress_percent': 100,
                    'status': 'completed'
                }, 200
            return {'error': 'Backup not found'}, 404
        
        # If progress shows completed, try to include response data
        if progress.get('status') == 'completed':
            response = get_backup_service().get_response(backup_id)
            if response:
                # Merge response data into progress for convenience
                progress.update({
                    'filename': response.get('filename'),
                    'size_bytes': response.get('size_bytes'),
                    'download_url': response.get('download_url')
                })
        
        return progress, 200
        
    except Exception as e:
        logger.exception(f"Error getting backup progress: {str(e)}", extra={
            'backup_id': backup_id,
            'error': str(e)
        })
        return {
            'error': 'Internal server error',
            'details': str(e)
        }, 500


@bp.get('/<backup_id>/download')
def download_backup(backup_id: str):
    """Download a completed backup file."""
    try:
        # Get backup progress to check status
        progress = get_backup_service().get_progress(backup_id)
        
        if not progress:
            return {'error': 'Backup not found'}, 404
        
        if progress['status'] != 'completed':
            return {
                'error': 'Backup not ready for download',
                'details': f"Backup status is '{progress['status']}'"
            }, 400
        
        # Get backup filepath
        format_type = progress.get('format') or 'sql'  # Fallback if not in progress
        filepath = get_backup_service().get_backup_filepath(backup_id, format_type)
        
        if not filepath:
            return {'error': 'Backup file not found'}, 404
        
        # Determine filename from progress or generate from filepath
        from pathlib import Path
        path_obj = Path(filepath)
        filename = path_obj.name
        
        # Extract format from filename for proper download name
        # Format: {backup_id}_{format}_{timestamp}.{ext}
        parts = filename.split('_')
        if len(parts) >= 3:
            format_part = parts[1]
            timestamp_part = '_'.join(parts[2:]).rsplit('.', 1)[0]
            ext = path_obj.suffix.lstrip('.')
            download_filename = f'timetable_backup_{format_part}_{timestamp_part}.{ext}'
        else:
            download_filename = filename
        
        # Send file with proper headers
        return send_file(
            filepath,
            mimetype='application/octet-stream',
            as_attachment=True,
            download_name=download_filename
        )
        
    except Exception as e:
        logger.exception(f"Error downloading backup: {str(e)}", extra={
            'backup_id': backup_id,
            'error': str(e)
        })
        return {
            'error': 'Internal server error during download',
            'details': str(e)
        }, 500

