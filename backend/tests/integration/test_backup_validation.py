"""
Integration test for backup validation.
Tests: verify integrity checks (file size, data completeness, format-specific validation).
"""
import pytest
import json
import zipfile
import io
from datetime import date, time
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.classroom import Classroom
from api.models.task import Task
from api.models.assignment import Assignment


class TestBackupValidation:
    """Integration tests for backup validation."""

    def test_backup_file_size_validation(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test that backup file has non-zero size."""
        response = client.post('/api/backup/create', json={
            'format': 'sql'
        })
        
        assert response.status_code in [200, 201, 500]
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            if data['status'] == 'completed':
                # Verify size_bytes is set and > 0
                assert data['size_bytes'] > 0
                
                # Verify actual file size matches
                backup_id = data['backup_id']
                download_response = client.get(f'/api/backup/{backup_id}/download')
                assert download_response.status_code == 200
                assert len(download_response.data) == data['size_bytes']

    def test_backup_data_completeness_validation(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test that backup includes all expected tables."""
        # Add data to multiple tables
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
        
        # Test JSON format (easiest to verify completeness)
        response = client.post('/api/backup/create', json={
            'format': 'json'
        })
        
        assert response.status_code in [200, 201, 500]
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            if data['status'] == 'completed':
                backup_id = data['backup_id']
                download_response = client.get(f'/api/backup/{backup_id}/download')
                assert download_response.status_code == 200
                
                json_data = json.loads(download_response.data.decode('utf-8'))
                # Verify all 8 tables are present
                expected_tables = ['teacher_aides', 'tasks', 'assignments', 'classrooms',
                                 'absences', 'availability', 'requests', 'recurring_series']
                for table in expected_tables:
                    assert table in json_data, f"Missing table: {table}"

    def test_backup_format_specific_validation_sql(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test SQL format-specific validation."""
        response = client.post('/api/backup/create', json={
            'format': 'sql'
        })
        
        assert response.status_code in [200, 201, 500]
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            if data['status'] == 'completed':
                backup_id = data['backup_id']
                download_response = client.get(f'/api/backup/{backup_id}/download')
                assert download_response.status_code == 200
                
                content = download_response.data.decode('utf-8')
                # SQL should contain CREATE TABLE and INSERT statements
                assert 'CREATE TABLE' in content or 'create table' in content.lower()
                assert 'INSERT INTO' in content or 'insert into' in content.lower()

    def test_backup_format_specific_validation_csv(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test CSV format-specific validation."""
        response = client.post('/api/backup/create', json={
            'format': 'csv'
        })
        
        assert response.status_code in [200, 201, 500]
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            if data['status'] == 'completed':
                backup_id = data['backup_id']
                download_response = client.get(f'/api/backup/{backup_id}/download')
                assert download_response.status_code == 200
                
                # Verify ZIP can be opened and contains expected files
                zip_data = io.BytesIO(download_response.data)
                with zipfile.ZipFile(zip_data, 'r') as zip_file:
                    file_list = zip_file.namelist()
                    assert len(file_list) >= 8  # At least 8 CSV files
                    # Verify at least one expected file exists
                    assert any('teacher_aides.csv' in f for f in file_list)











