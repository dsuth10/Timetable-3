import pytest
import os
import tempfile
import json
from api.services.backup_service import BackupService
from api.models.teacher_aide import TeacherAide
from api.models.classroom import Classroom

def test_import_rollback_on_error(client, db_session):
    """Test that failed import rolls back all changes."""
    service = BackupService()
    
    # 1. Ensure DB is empty
    assert TeacherAide.query.count() == 0
    
    # 2. Create a backup file that will fail during import
    # teacher_aides will succeed, but classrooms will fail because of duplicate name or something
    data = {
        'teacher_aides': [{'id': 1, 'name': 'Aide 1', 'colour_hex': '#FF0000'}],
        'classrooms': [
            {'id': 1, 'name': 'Room 1'},
            {'id': 2, 'name': 'Room 1'} # Duplicate name should fail if unique constraint exists
        ],
        'tasks': [],
        'assignments': [],
        'absences': [],
        'availability': [],
        'requests': [],
        'recurring_series': []
    }
    
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False, mode='w') as tmp:
        json.dump(data, tmp)
        tmp_path = tmp.name
    
    try:
        # 3. Attempt import
        result = service.import_backup(tmp_path, 'json')
        
        # 4. Verify failure
        assert result['status'] == 'failed'
        assert "Import failed" in result['error']
        
        # 5. Verify database is STILL EMPTY (rollback worked)
        assert TeacherAide.query.count() == 0
        assert Classroom.query.count() == 0
        
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
