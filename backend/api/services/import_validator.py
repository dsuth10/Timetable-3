import gzip
import json
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

from api.models.validation import REQUIRED_TABLES, ValidationResult, ValidationStage


class ImportValidator:
    """
    Validator for backup files before import.
    Implements a 4-stage validation pipeline.
    """

    # Valid enum values
    TASK_CATEGORIES = ['PLAYGROUND', 'CLASS_SUPPORT', 'GROUP_SUPPORT', 'INDIVIDUAL_SUPPORT']
    ASSIGNMENT_STATUSES = ['UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETE', 'RELIEF_POOL']
    REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

    def validate_format(self, filepath: str, format_type: str) -> ValidationResult:
        """Stage 1: Validate file format, extension, and basic readability."""
        path = Path(filepath)
        errors = []

        # 1. Check existence
        if not path.exists():
            return ValidationResult(stage=ValidationStage.FORMAT, is_valid=False, errors=["File does not exist"])

        # 2. Check size
        if path.stat().st_size == 0:
            return ValidationResult(stage=ValidationStage.FORMAT, is_valid=False, errors=["File is empty"])

        # 3. Check extension
        ext = path.suffix.lower()
        valid_extensions = {
            'sql': ['.sql'],
            'json': ['.json'],
            'csv': ['.zip'],
            'sqlite_gz': ['.gz', '.db.gz']
        }

        if format_type not in valid_extensions:
            return ValidationResult(stage=ValidationStage.FORMAT, is_valid=False, errors=[f"Unknown format type: {format_type}"])

        if ext not in valid_extensions[format_type]:
            errors.append(f"Invalid extension for {format_type}: {ext}. Expected {valid_extensions[format_type]}")

        # 4. Check magic bytes / readability
        try:
            if format_type == 'sql':
                with open(path, encoding='utf-8') as f:
                    # Read first few lines to check for SQL comments or commands
                    head = [f.readline() for _ in range(5)]
                    content = "".join(head).lower()
                    if not any(x in content for x in ['create table', 'insert into', '--', 'begin transaction']):
                        errors.append("File does not appear to be a valid SQL dump")

            elif format_type == 'json':
                with open(path, encoding='utf-8') as f:
                    try:
                        # Try to parse just the beginning to see if it's a JSON object
                        json.load(f)
                    except json.JSONDecodeError as e:
                        errors.append(f"Invalid JSON format: {str(e)}")

            elif format_type == 'csv':
                if not zipfile.is_zipfile(path):
                    errors.append("File is not a valid ZIP archive")

            elif format_type == 'sqlite_gz':
                try:
                    with gzip.open(path, 'rb') as f:
                        f.read(10) # Just try reading a bit
                except Exception as e:
                    errors.append(f"Invalid GZIP format: {str(e)}")

        except Exception as e:
            errors.append(f"Error reading file: {str(e)}")

        return ValidationResult(
            stage=ValidationStage.FORMAT,
            is_valid=len(errors) == 0,
            errors=errors
        )

    def validate_schema(self, data: dict[str, Any]) -> ValidationResult:
        """Stage 2: Validate all required tables and columns are present."""
        errors = []
        warnings = []

        # 1. Check required tables
        for table in REQUIRED_TABLES:
            if table not in data:
                errors.append(f"Missing required table: {table}")
            elif not isinstance(data[table], list):
                errors.append(f"Table {table} must be a list of records")

        # 2. Check schema version
        metadata = data.get('metadata', {})
        backup_version = metadata.get('schema_version')

        # In a real app, we'd get this from the database or a config
        # For now, we'll use a placeholder or check if it exists
        if not backup_version:
            warnings.append("No schema version found in backup metadata")
        else:
            # Placeholder for version check logic
            current_version = "123" # This should ideally be dynamic
            if backup_version != current_version:
                warnings.append(f"Schema version mismatch: backup is {backup_version}, app is {current_version}")

        return ValidationResult(
            stage=ValidationStage.SCHEMA,
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    def validate_data_types(self, data: dict[str, Any]) -> ValidationResult:
        """Stage 3: Validate data types, enums, and required fields."""
        errors = []

        for table_name in REQUIRED_TABLES:
            if table_name not in data:
                continue

            records = data[table_name]
            for i, record in enumerate(records):
                # 1. Validate Category (Tasks)
                if table_name == 'tasks':
                    category = record.get('category')
                    if category and category not in self.TASK_CATEGORIES:
                        errors.append(f"tasks[{i}]: Invalid category '{category}'")

                # 2. Validate Status (Assignments)
                if table_name == 'assignments':
                    status = record.get('status')
                    if status and status not in self.ASSIGNMENT_STATUSES:
                        errors.append(f"assignments[{i}]: Invalid status '{status}'")

                # 3. Validate Date formats
                for date_field in ['date', 'start_date', 'end_date']:
                    if date_field in record and record[date_field]:
                        try:
                            # Allow both string and date objects
                            if isinstance(record[date_field], str):
                                datetime.strptime(record[date_field], '%Y-%m-%d')
                        except ValueError:
                            errors.append(f"{table_name}[{i}]: Invalid date format for {date_field}: {record[date_field]}")

                # 4. Validate Time formats
                for time_field in ['start_time', 'end_time']:
                    if time_field in record and record[time_field]:
                        try:
                            # Allow both string and time objects
                            if isinstance(record[time_field], str):
                                # Check for various time formats (HH:MM:SS, HH:MM)
                                time_str = record[time_field]
                                if len(time_str) == 5: # HH:MM
                                    datetime.strptime(time_str, '%H:%M')
                                else:
                                    datetime.strptime(time_str, '%H:%M:%S')
                        except ValueError:
                            errors.append(f"{table_name}[{i}]: Invalid time format for {time_field}: {record[time_field]}")

        return ValidationResult(
            stage=ValidationStage.DATA_TYPES,
            is_valid=len(errors) == 0,
            errors=errors
        )

    def validate_relationships(self, data: dict[str, Any]) -> ValidationResult:
        """Stage 4: Validate referential integrity (foreign keys)."""
        errors = []

        # 1. Build ID sets for parent tables
        id_sets = {}
        for table_name in REQUIRED_TABLES:
            if table_name in data:
                id_sets[table_name] = {record.get('id') for record in data[table_name] if record.get('id') is not None}
            else:
                id_sets[table_name] = set()

        # 2. Define relationships to check: (child_table, fk_field, parent_table)
        relationships = [
            ('tasks', 'classroom_id', 'classrooms'),
            ('assignments', 'task_id', 'tasks'),
            ('assignments', 'aide_id', 'teacher_aides'),
            ('assignments', 'original_aide_id', 'teacher_aides'),
            ('assignments', 'recurring_series_id', 'recurring_series'),
            ('absences', 'aide_id', 'teacher_aides'),
            ('availability', 'aide_id', 'teacher_aides'),
            ('requests', 'classroom_id', 'classrooms'),
            ('recurring_series', 'aide_id', 'teacher_aides'),
            ('recurring_series', 'task_id', 'tasks'),
        ]

        # 3. Validate each relationship
        for child_table, fk_field, parent_table in relationships:
            if child_table not in data:
                continue

            for i, record in enumerate(data[child_table]):
                fk_value = record.get(fk_field)
                if fk_value is not None:
                    # Handle both int and string IDs (CSV might have strings)
                    try:
                        fk_id = int(fk_value)
                    except (ValueError, TypeError):
                        errors.append(f"{child_table}[{i}]: Invalid ID for {fk_field}: {fk_value}")
                        continue

                    if fk_id not in id_sets.get(parent_table, set()):
                        errors.append(f"{child_table}[{i}]: {fk_field} {fk_id} references non-existent {parent_table}")

        return ValidationResult(
            stage=ValidationStage.RELATIONSHIPS,
            is_valid=len(errors) == 0,
            errors=errors
        )

    def validate_all(self, filepath: str, format_type: str) -> tuple[bool, list[ValidationResult]]:
        """Run all validation stages in sequence."""
        # This will be implemented in later tasks
        return True, []
