"""
Backup Service
Handles database backup generation in multiple formats: SQL, JSON, CSV, and compressed SQLite.
"""
from __future__ import annotations

import os
import sqlite3
import json
import csv
import zipfile
import gzip
import uuid
import time
from datetime import datetime
from typing import Dict, Any, Optional, Generator, Tuple, Callable
from pathlib import Path

from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.availability import Availability
from api.models.classroom import Classroom
from api.models.task import Task
from api.models.assignment import Assignment
from api.models.absence import Absence
from api.models.request import Request
from api.models.recurring_series import RecurringSeries


# All tables that must be included in backup
REQUIRED_TABLES = [
    'teacher_aides',
    'tasks',
    'assignments',
    'classrooms',
    'absences',
    'availability',
    'requests',
    'recurring_series'
]

# Module-level storage for backup progress and responses (in-memory)
_backup_progress: Dict[str, Dict[str, Any]] = {}
_backup_responses: Dict[str, Dict[str, Any]] = {}


class BackupService:
    """
    Service for creating database backups in multiple formats.
    """

    def __init__(self):
        """Initialize backup service with backup directory."""
        # Get instance directory (where database is stored)
        instance_path = Path(__file__).parent.parent.parent / 'instance'
        self.backup_dir = instance_path / 'backups'
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.instance_path = instance_path
        self._db_path = None
    
    def _get_db_path(self):
        """Get database path (lazy initialization to avoid app context issues)."""
        if self._db_path is None:
            # Get database path from Flask app context
            db_uri = db.engine.url
            if db_uri.drivername == 'sqlite':
                self._db_path = db_uri.database or (self.instance_path / 'timetable.db')
            else:
                raise ValueError("Backup service only supports SQLite databases")
        return self._db_path
    
    def _update_progress(self, backup_id: str, progress_data: Dict[str, Any]):
        """Update progress for a backup (stores in module-level dict)."""
        _backup_progress[backup_id] = progress_data
    
    def _store_response(self, backup_id: str, response_data: Dict[str, Any]):
        """Store final backup response."""
        _backup_responses[backup_id] = response_data
    
    def get_progress(self, backup_id: str) -> Optional[Dict[str, Any]]:
        """Get current progress for a backup."""
        return _backup_progress.get(backup_id)
    
    def get_response(self, backup_id: str) -> Optional[Dict[str, Any]]:
        """Get final backup response."""
        return _backup_responses.get(backup_id)

    def generate_sql_backup(self, backup_id: str) -> Tuple[str, int]:
        """
        Generate SQL dump backup.
        
        Args:
            backup_id: Unique identifier for this backup
            
        Returns:
            Tuple of (filepath, size_bytes)
        """
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f'{backup_id}_sql_{timestamp}.sql'
        filepath = self.backup_dir / filename
        
        # Connect to SQLite database and dump
        conn = sqlite3.connect(str(self._get_db_path()))
        with open(filepath, 'w', encoding='utf-8') as f:
            for line in conn.iterdump():
                f.write(f'{line}\n')
        conn.close()
        
        size_bytes = filepath.stat().st_size
        return str(filepath), size_bytes

    def generate_json_backup(self, backup_id: str, progress_callback: Optional[Callable] = None) -> Tuple[str, int]:
        """
        Generate JSON export backup.
        
        Args:
            backup_id: Unique identifier for this backup
            progress_callback: Optional callback for progress updates
            
        Returns:
            Tuple of (filepath, size_bytes)
        """
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f'{backup_id}_json_{timestamp}.json'
        filepath = self.backup_dir / filename
        
        # Query all tables and serialize to JSON
        backup_data = {}
        total_tables = len(REQUIRED_TABLES)
        
        # Teacher Aides
        progress_update = {
            'backup_id': backup_id,
            'progress_percent': int((1 / total_tables) * 80),
            'status': 'creating',
            'current_step': 'Processing table 1 of 8: teacher_aides'
        }
        self._update_progress(backup_id, progress_update)
        if progress_callback:
            progress_callback(progress_update)
        backup_data['teacher_aides'] = [
            aide.to_dict(include_relationships=False) 
            for aide in TeacherAide.query.all()
        ]
        
        # Tasks
        progress_update = {
            'backup_id': backup_id,
            'progress_percent': int((2 / total_tables) * 80),
            'status': 'creating',
            'current_step': 'Processing table 2 of 8: tasks'
        }
        self._update_progress(backup_id, progress_update)
        if progress_callback:
            progress_callback(progress_update)
        backup_data['tasks'] = [
            task.to_dict(include_relationships=False) 
            for task in Task.query.all()
        ]
        
        # Assignments
        progress_update = {
            'backup_id': backup_id,
            'progress_percent': int((3 / total_tables) * 80),
            'status': 'creating',
            'current_step': 'Processing table 3 of 8: assignments'
        }
        self._update_progress(backup_id, progress_update)
        if progress_callback:
            progress_callback(progress_update)
        backup_data['assignments'] = [
            assignment.to_dict(include_relationships=False) 
            for assignment in Assignment.query.all()
        ]
        
        # Classrooms
        progress_update = {
            'backup_id': backup_id,
            'progress_percent': int((4 / total_tables) * 80),
            'status': 'creating',
            'current_step': 'Processing table 4 of 8: classrooms'
        }
        self._update_progress(backup_id, progress_update)
        if progress_callback:
            progress_callback(progress_update)
        backup_data['classrooms'] = [
            classroom.to_dict(include_relationships=False) 
            for classroom in Classroom.query.all()
        ]
        
        # Absences
        progress_update = {
            'backup_id': backup_id,
            'progress_percent': int((5 / total_tables) * 80),
            'status': 'creating',
            'current_step': 'Processing table 5 of 8: absences'
        }
        self._update_progress(backup_id, progress_update)
        if progress_callback:
            progress_callback(progress_update)
        backup_data['absences'] = [
            absence.to_dict(include_relationships=False) 
            for absence in Absence.query.all()
        ]
        
        # Availability
        progress_update = {
            'backup_id': backup_id,
            'progress_percent': int((6 / total_tables) * 80),
            'status': 'creating',
            'current_step': 'Processing table 6 of 8: availability'
        }
        self._update_progress(backup_id, progress_update)
        if progress_callback:
            progress_callback(progress_update)
        backup_data['availability'] = [
            avail.to_dict(include_relationships=False) 
            for avail in Availability.query.all()
        ]
        
        # Requests
        progress_update = {
            'backup_id': backup_id,
            'progress_percent': int((7 / total_tables) * 80),
            'status': 'creating',
            'current_step': 'Processing table 7 of 8: requests'
        }
        self._update_progress(backup_id, progress_update)
        if progress_callback:
            progress_callback(progress_update)
        backup_data['requests'] = [
            request.to_dict(include_relationships=False) 
            for request in Request.query.all()
        ]
        
        # Recurring Series
        progress_update = {
            'backup_id': backup_id,
            'progress_percent': int((8 / total_tables) * 80),
            'status': 'creating',
            'current_step': 'Processing table 8 of 8: recurring_series'
        }
        self._update_progress(backup_id, progress_update)
        if progress_callback:
            progress_callback(progress_update)
        backup_data['recurring_series'] = [
            series.to_dict(include_relationships=False) 
            for series in RecurringSeries.query.all()
        ]
        
        # Write JSON file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, default=str)
        
        size_bytes = filepath.stat().st_size
        return str(filepath), size_bytes

    def generate_csv_backup(self, backup_id: str) -> Tuple[str, int]:
        """
        Generate CSV collection backup (ZIP archive with one CSV per table).
        
        Args:
            backup_id: Unique identifier for this backup
            
        Returns:
            Tuple of (filepath, size_bytes)
        """
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f'{backup_id}_csv_{timestamp}.zip'
        filepath = self.backup_dir / filename
        
        # Create ZIP archive
        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Export each table to CSV
            self._export_table_to_csv(zip_file, TeacherAide, 'teacher_aides.csv')
            self._export_table_to_csv(zip_file, Task, 'tasks.csv')
            self._export_table_to_csv(zip_file, Assignment, 'assignments.csv')
            self._export_table_to_csv(zip_file, Classroom, 'classrooms.csv')
            self._export_table_to_csv(zip_file, Absence, 'absences.csv')
            self._export_table_to_csv(zip_file, Availability, 'availability.csv')
            self._export_table_to_csv(zip_file, Request, 'requests.csv')
            self._export_table_to_csv(zip_file, RecurringSeries, 'recurring_series.csv')
        
        size_bytes = filepath.stat().st_size
        return str(filepath), size_bytes

    def _export_table_to_csv(self, zip_file: zipfile.ZipFile, model_class, csv_filename: str):
        """Helper to export a model table to CSV and add to ZIP."""
        import io
        
        # Query all records
        records = model_class.query.all()
        
        if not records:
            # Create empty CSV with headers
            csv_data = io.StringIO()
            writer = csv.writer(csv_data)
            # Get column names from first record's to_dict
            if hasattr(model_class, 'to_dict'):
                sample = model_class()
                # Use model's __table__ to get columns
                columns = [col.name for col in model_class.__table__.columns]
                writer.writerow(columns)
            zip_file.writestr(csv_filename, csv_data.getvalue())
            return
        
        # Get column names from first record
        first_record = records[0]
        if hasattr(first_record, 'to_dict'):
            # Call to_dict() without parameters - models handle defaults differently
            # Task uses include_assignments=False, Request uses include_classroom=False,
            # others use include_relationships=False or no params
            sample_dict = first_record.to_dict()
            columns = list(sample_dict.keys())
        else:
            # Fallback to table columns
            columns = [col.name for col in model_class.__table__.columns]
        
        # Write CSV
        csv_data = io.StringIO()
        writer = csv.DictWriter(csv_data, fieldnames=columns)
        writer.writeheader()
        
        for record in records:
            if hasattr(record, 'to_dict'):
                # Call to_dict() without parameters - models handle defaults differently
                row = record.to_dict()
                # Convert values to strings for CSV
                row = {k: str(v) if v is not None else '' for k, v in row.items()}
                writer.writerow(row)
        
        zip_file.writestr(csv_filename, csv_data.getvalue())

    def generate_sqlite_gz_backup(self, backup_id: str) -> Tuple[str, int]:
        """
        Generate compressed SQLite backup.
        
        Args:
            backup_id: Unique identifier for this backup
            
        Returns:
            Tuple of (filepath, size_bytes)
        """
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f'{backup_id}_sqlite_{timestamp}.db.gz'
        filepath = self.backup_dir / filename
        
        # Copy database file and compress
        with open(self._get_db_path(), 'rb') as db_file:
            with gzip.open(filepath, 'wb') as gz_file:
                gz_file.writelines(db_file)
        
        size_bytes = filepath.stat().st_size
        return str(filepath), size_bytes

    def validate_backup(self, filepath: str, format_type: str) -> Tuple[bool, Optional[str]]:
        """
        Validate backup file integrity.
        
        Args:
            filepath: Path to backup file
            format_type: Backup format ('sql', 'json', 'csv', 'sqlite_gz')
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        path = Path(filepath)
        
        # File size check
        if not path.exists():
            return False, "Backup file does not exist"
        
        if path.stat().st_size == 0:
            return False, "Backup file is empty"
        
        # Format-specific validation
        if format_type == 'sql':
            return self._validate_sql_backup(path)
        elif format_type == 'json':
            return self._validate_json_backup(path)
        elif format_type == 'csv':
            return self._validate_csv_backup(path)
        elif format_type == 'sqlite_gz':
            return self._validate_sqlite_gz_backup(path)
        else:
            return False, f"Unknown format type: {format_type}"

    def _validate_sql_backup(self, filepath: Path) -> Tuple[bool, Optional[str]]:
        """Validate SQL backup file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                # Check for CREATE TABLE statements
                if 'CREATE TABLE' not in content and 'create table' not in content.lower():
                    return False, "SQL backup missing CREATE TABLE statements"
                # Check for INSERT statements
                if 'INSERT INTO' not in content and 'insert into' not in content.lower():
                    return False, "SQL backup missing INSERT statements"
                # Check for all required tables
                content_lower = content.lower()
                for table in REQUIRED_TABLES:
                    if table not in content_lower:
                        return False, f"SQL backup missing table: {table}"
            return True, None
        except Exception as e:
            return False, f"Error validating SQL backup: {str(e)}"

    def _validate_json_backup(self, filepath: Path) -> Tuple[bool, Optional[str]]:
        """Validate JSON backup file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if not isinstance(data, dict):
                    return False, "JSON backup is not a dictionary"
                # Check for all required tables
                for table in REQUIRED_TABLES:
                    if table not in data:
                        return False, f"JSON backup missing table: {table}"
                    if not isinstance(data[table], list):
                        return False, f"JSON backup table {table} is not a list"
            return True, None
        except json.JSONDecodeError as e:
            return False, f"Invalid JSON format: {str(e)}"
        except Exception as e:
            return False, f"Error validating JSON backup: {str(e)}"

    def _validate_csv_backup(self, filepath: Path) -> Tuple[bool, Optional[str]]:
        """Validate CSV backup (ZIP) file."""
        try:
            with zipfile.ZipFile(filepath, 'r') as zip_file:
                file_list = zip_file.namelist()
                # Check for all required CSV files
                for table in REQUIRED_TABLES:
                    expected_file = f'{table}.csv'
                    if expected_file not in file_list:
                        return False, f"CSV backup missing file: {expected_file}"
            return True, None
        except zipfile.BadZipFile:
            return False, "CSV backup is not a valid ZIP file"
        except Exception as e:
            return False, f"Error validating CSV backup: {str(e)}"

    def _validate_sqlite_gz_backup(self, filepath: Path) -> Tuple[bool, Optional[str]]:
        """Validate compressed SQLite backup file."""
        try:
            # Decompress and try to open as SQLite
            with gzip.open(filepath, 'rb') as gz_file:
                db_data = gz_file.read()
                # Try to open as SQLite database in memory
                conn = sqlite3.connect(':memory:')
                try:
                    conn.executescript(db_data.decode('utf-8', errors='ignore'))
                    # Check for required tables
                    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    tables = [row[0] for row in cursor.fetchall()]
                    for table in REQUIRED_TABLES:
                        if table not in tables:
                            return False, f"SQLite backup missing table: {table}"
                finally:
                    conn.close()
            return True, None
        except gzip.BadGzipFile:
            return False, "Backup is not a valid gzip file"
        except Exception as e:
            return False, f"Error validating SQLite backup: {str(e)}"

    def create_backup(
        self, 
        format_type: str,
        progress_callback: Optional[Callable] = None,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Create a backup in the specified format.
        
        Args:
            format_type: Backup format ('sql', 'json', 'csv', 'sqlite_gz')
            progress_callback: Optional callback function for progress updates
            
        Returns:
            Dictionary with backup information
        """
        backup_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        
        # Retry logic for database locks
        last_error = None
        for attempt in range(max_retries):
            try:
                # Update progress: creating
                progress_update = {
                    'backup_id': backup_id,
                    'progress_percent': 0,
                    'status': 'creating',
                    'current_step': 'Initializing backup...' + (f' (attempt {attempt + 1}/{max_retries})' if attempt > 0 else '')
                }
                self._update_progress(backup_id, progress_update)
                if progress_callback:
                    progress_callback(progress_update)
                
                # Generate backup based on format
                if format_type == 'sql':
                    filepath, size_bytes = self.generate_sql_backup(backup_id)
                elif format_type == 'json':
                    filepath, size_bytes = self.generate_json_backup(backup_id, progress_callback)
                elif format_type == 'csv':
                    filepath, size_bytes = self.generate_csv_backup(backup_id)
                elif format_type == 'sqlite_gz':
                    filepath, size_bytes = self.generate_sqlite_gz_backup(backup_id)
                else:
                    raise ValueError(f"Invalid backup format: {format_type}")
                
                # If we get here, backup generation succeeded
                break
                
            except sqlite3.OperationalError as e:
                # Database lock error - retry with exponential backoff
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    progress_update = {
                        'backup_id': backup_id,
                        'progress_percent': 0,
                        'status': 'creating',
                        'current_step': f'Database busy, retrying in {wait_time} seconds...'
                    }
                    self._update_progress(backup_id, progress_update)
                    if progress_callback:
                        progress_callback(progress_update)
                    time.sleep(wait_time)
                    continue
                else:
                    # Max retries reached
                    return {
                        'backup_id': backup_id,
                        'format': format_type,
                        'filename': '',
                        'size_bytes': 0,
                        'created_at': datetime.utcnow().isoformat() + 'Z',
                        'status': 'failed',
                        'error': 'Database busy - try again in a moment'
                    }
            except Exception as e:
                # Other errors - don't retry
                last_error = e
                break
        
        # Handle errors
        if last_error:
            error_msg = str(last_error)
            # Categorize error for user-friendly messages
            if 'locked' in error_msg.lower() or 'busy' in error_msg.lower():
                user_error = 'Database busy - try again in a moment'
            elif 'permission' in error_msg.lower():
                user_error = 'Permission denied - check file system permissions'
            elif 'disk' in error_msg.lower() or 'space' in error_msg.lower():
                user_error = 'Insufficient disk space'
            else:
                user_error = f'Backup creation failed: {error_msg}'
            
            return {
                'backup_id': backup_id,
                'format': format_type,
                'filename': '',
                'size_bytes': 0,
                'created_at': datetime.utcnow().isoformat() + 'Z',
                'status': 'failed',
                'error': user_error
            }
        
        # If we get here, backup generation succeeded - now validate
        try:
            # Update progress: validating
            progress_update = {
                'backup_id': backup_id,
                'progress_percent': 80,
                'status': 'validating',
                'current_step': 'Validating backup integrity...'
            }
            self._update_progress(backup_id, progress_update)
            if progress_callback:
                progress_callback(progress_update)
            
            # Validate backup
            is_valid, error_msg = self.validate_backup(filepath, format_type)
            
            if not is_valid:
                # Clean up invalid backup file
                try:
                    os.remove(filepath)
                except:
                    pass
                return {
                    'backup_id': backup_id,
                    'format': format_type,
                    'filename': '',
                    'size_bytes': 0,
                    'created_at': datetime.utcnow().isoformat() + 'Z',
                    'status': 'failed',
                    'error': error_msg or 'Backup validation failed'
                }
            
            # Generate filename for download
            filename = f'timetable_backup_{format_type}_{timestamp}.{self._get_extension(format_type)}'
            
            # Update progress: completed
            progress_update = {
                'backup_id': backup_id,
                'progress_percent': 100,
                'status': 'completed',
                'current_step': 'Backup completed successfully'
            }
            self._update_progress(backup_id, progress_update)
            if progress_callback:
                progress_callback(progress_update)
            
            response = {
                'backup_id': backup_id,
                'format': format_type,
                'filename': filename,
                'size_bytes': size_bytes,
                'created_at': datetime.utcnow().isoformat() + 'Z',
                'status': 'completed',
                'download_url': f'/api/backup/{backup_id}/download'
            }
            # Store response for retrieval
            self._store_response(backup_id, response)
            return response
            
        except Exception as e:
            return {
                'backup_id': backup_id,
                'format': format_type,
                'filename': '',
                'size_bytes': 0,
                'created_at': datetime.utcnow().isoformat() + 'Z',
                'status': 'failed',
                'error': str(e)
            }

    def _get_extension(self, format_type: str) -> str:
        """Get file extension for backup format."""
        extensions = {
            'sql': 'sql',
            'json': 'json',
            'csv': 'zip',
            'sqlite_gz': 'db.gz'
        }
        return extensions.get(format_type, 'bin')

    def get_backup_filepath(self, backup_id: str, format_type: str) -> Optional[str]:
        """
        Get filepath for a backup by ID and format.
        
        Args:
            backup_id: Backup identifier
            format_type: Backup format
            
        Returns:
            Filepath if found, None otherwise
        """
        # Search for backup file matching ID and format
        pattern = f'{backup_id}_{format_type}_*.{self._get_extension(format_type)}'
        for filepath in self.backup_dir.glob(pattern):
            return str(filepath)
        return None

