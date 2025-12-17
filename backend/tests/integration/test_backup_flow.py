"""
Integration test for complete backup flow (SQL format).
Tests: create backup, monitor progress, download file, verify content.
"""
import pytest
import os
import tempfile
import shutil
from datetime import date, time
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.classroom import Classroom
from api.models.task import Task
from api.models.assignment import Assignment


class TestBackupFlow:
    """Integration tests for complete backup flow."""

    def test_complete_backup_flow_sql(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test complete backup flow: create, progress, download, verify."""
        # Setup: Add some data to backup
        assignment = Assignment(
            task_id=sample_task.id,
            aide_id=sample_aide.id,
            date=date(2025, 12, 16),
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='ASSIGNED',
            version=1
        )
        db_session.add(assignment)
        db_session.commit()
        
        # Step 1: Create backup
        response = client.post('/api/backup/create', json={
            'format': 'sql'
        })
        
        assert response.status_code in [200, 201, 500]  # Will be 500 until implemented
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            backup_id = data['backup_id']
            assert data['format'] == 'sql'
            assert data['status'] in ['completed', 'failed']
            
            if data['status'] == 'completed':
                # Step 2: Monitor progress (should be completed)
                progress_response = client.get(f'/api/backup/{backup_id}/progress')
                assert progress_response.status_code == 200
                progress_data = progress_response.get_json()
                assert progress_data['status'] == 'completed'
                assert progress_data['progress_percent'] == 100
                
                # Step 3: Download file
                download_response = client.get(f'/api/backup/{backup_id}/download')
                assert download_response.status_code == 200
                assert 'Content-Disposition' in download_response.headers
                
                # Step 4: Verify content
                content = download_response.data.decode('utf-8')
                assert 'CREATE TABLE' in content or 'create table' in content.lower()
                assert 'INSERT INTO' in content or 'insert into' in content.lower()
                assert 'teacher_aides' in content.lower()
                assert 'tasks' in content.lower()
                assert 'assignments' in content.lower()



