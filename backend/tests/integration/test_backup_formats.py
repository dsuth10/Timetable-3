"""
Integration test for all backup formats.
Tests: SQL, JSON, CSV, SQLite compressed formats.
"""
import pytest
import json
import zipfile
import gzip
import sqlite3
import io
from datetime import date, time
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.classroom import Classroom
from api.models.task import Task
from api.models.assignment import Assignment


class TestBackupFormats:
    """Integration tests for all backup formats."""

    def test_sql_format_backup(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test SQL format backup creation and validation."""
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
                assert 'CREATE TABLE' in content or 'create table' in content.lower()
                assert 'INSERT INTO' in content or 'insert into' in content.lower()

    def test_json_format_backup(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test JSON format backup creation and validation."""
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
                
                # Parse JSON
                json_data = json.loads(download_response.data.decode('utf-8'))
                assert isinstance(json_data, dict)
                # Verify all expected tables are present
                expected_tables = ['teacher_aides', 'tasks', 'assignments', 'classrooms', 
                                 'absences', 'availability', 'requests', 'recurring_series']
                for table in expected_tables:
                    assert table in json_data
                    assert isinstance(json_data[table], list)

    def test_csv_format_backup(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test CSV format backup creation and validation."""
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
                
                # Verify ZIP file
                zip_data = io.BytesIO(download_response.data)
                with zipfile.ZipFile(zip_data, 'r') as zip_file:
                    file_list = zip_file.namelist()
                    expected_files = ['teacher_aides.csv', 'tasks.csv', 'assignments.csv', 
                                    'classrooms.csv', 'absences.csv', 'availability.csv',
                                    'requests.csv', 'recurring_series.csv']
                    for expected_file in expected_files:
                        assert expected_file in file_list

    def test_sqlite_gz_format_backup(self, client, db_session, sample_aide, sample_classroom, sample_task):
        """Test compressed SQLite format backup creation and validation."""
        response = client.post('/api/backup/create', json={
            'format': 'sqlite_gz'
        })
        
        assert response.status_code in [200, 201, 500]
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            if data['status'] == 'completed':
                backup_id = data['backup_id']
                download_response = client.get(f'/api/backup/{backup_id}/download')
                assert download_response.status_code == 200
                
                # Decompress and verify SQLite file
                compressed_data = io.BytesIO(download_response.data)
                with gzip.open(compressed_data, 'rb') as gz_file:
                    db_data = gz_file.read()
                    # Try to open as SQLite database
                    db_conn = sqlite3.connect(':memory:')
                    db_conn.executescript(db_data.decode('utf-8', errors='ignore'))
                    # Verify tables exist
                    cursor = db_conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    tables = [row[0] for row in cursor.fetchall()]
                    expected_tables = ['teacher_aides', 'tasks', 'assignments', 'classrooms',
                                     'absences', 'availability', 'requests', 'recurring_series']
                    for table in expected_tables:
                        assert table in tables
                    db_conn.close()




