# Research: Import System Architecture

**Feature**: Robust Export and Import System  
**Date**: 2026-01-24  
**Status**: Complete

## Overview

This document captures research findings and technical decisions for implementing the import functionality in the Timetable application's backup system.

## Technical Decisions

### 1. Transaction Management for Atomic Rollback

**Decision**: Use SQLAlchemy's session-based transactions with explicit savepoints

**Rationale**:
- SQLite supports nested transactions via SAVEPOINT
- SQLAlchemy provides clean abstraction: `session.begin_nested()`
- Automatic rollback on exception within context manager
- Maintains ACID properties throughout multi-table import

**Implementation Pattern**:
```python
from sqlalchemy.orm import Session

def import_backup(session: Session, backup_data: dict):
    try:
        with session.begin_nested():  # Creates SAVEPOINT
            # Import all tables
            import_teacher_aides(session, backup_data['teacher_aides'])
            import_tasks(session, backup_data['tasks'])
            # ... remaining tables
            session.commit()  # Commits nested transaction
    except Exception as e:
        session.rollback()  # Rolls back to SAVEPOINT
        raise ImportError(f"Import failed: {e}")
```

**Alternatives Considered**:
- Manual transaction management: Rejected due to complexity and error-proneness
- File-based backup/restore: Rejected because it requires shutting down the application

**References**:
- SQLAlchemy Transactions: https://docs.sqlalchemy.org/en/20/orm/session_transaction.html
- SQLite SAVEPOINT: https://www.sqlite.org/lang_savepoint.html

---

### 2. File Upload Strategy

**Decision**: Single-request upload with server-side validation and chunked reading

**Rationale**:
- Flask's `request.files` handles multipart uploads efficiently
- 100MB limit is manageable in memory for validation
- Chunked reading for large files prevents memory issues
- Progress tracking via in-memory store (existing pattern)

**Implementation Pattern**:
```python
from werkzeug.utils import secure_filename
import tempfile

@bp.post('/import')
def import_backup():
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400
    
    file = request.files['file']
    
    # Validate file size
    file.seek(0, 2)  # Seek to end
    size_bytes = file.tell()
    file.seek(0)  # Reset to start
    
    if size_bytes > 100 * 1024 * 1024:  # 100MB
        return {'error': 'File exceeds 100MB limit'}, 400
    
    # Save to temp file for processing
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        file.save(tmp.name)
        result = import_service.import_from_file(tmp.name)
    
    return result, 200
```

**Alternatives Considered**:
- Chunked upload (multipart): Rejected as unnecessary for 100MB limit
- Direct stream processing: Rejected due to validation requirements (need to inspect entire file first)

**References**:
- Flask File Uploads: https://flask.palletsprojects.com/en/3.0.x/patterns/fileuploads/
- Werkzeug FileStorage: https://werkzeug.palletsprojects.com/en/3.0.x/datastructures/#werkzeug.datastructures.FileStorage

---

### 3. Multi-Stage Validation Pipeline

**Decision**: Four-stage validation before any database modification

**Rationale**:
- Early detection prevents wasted processing
- Each stage has specific failure modes
- Clear error messages for each validation type
- Validation order optimizes for fast failure

**Validation Stages**:

**Stage 1: File Format Validation**
- Check file extension and magic bytes
- Validate file is not corrupted (can be opened)
- Detect actual format (SQL/JSON/CSV/SQLite)
- **Fast failure**: Happens before file parsing

**Stage 2: Schema Validation**
- Check all required tables present
- Validate column names match expected schema
- Detect schema version from metadata
- **Catches**: Missing tables, renamed columns, version mismatches

**Stage 3: Data Type Validation**
- Validate data types for each field
- Check required fields are not null
- Validate enum values (e.g., task categories)
- Validate date/time formats
- **Catches**: Type errors, invalid enums, malformed dates

**Stage 4: Referential Integrity Validation**
- Build ID maps for all foreign keys
- Validate all references exist in backup
- Check for circular references
- Validate unique constraints
- **Catches**: Broken relationships, duplicate keys

**Implementation Pattern**:
```python
class ImportValidator:
    def validate_backup(self, filepath: str, format_type: str):
        # Stage 1: Format
        self._validate_format(filepath, format_type)
        
        # Stage 2: Schema
        backup_data = self._load_backup(filepath, format_type)
        self._validate_schema(backup_data)
        
        # Stage 3: Data Types
        self._validate_data_types(backup_data)
        
        # Stage 4: Referential Integrity
        self._validate_relationships(backup_data)
        
        return backup_data  # Ready for import
```

**Alternatives Considered**:
- Single-pass validation: Rejected due to lack of clear error messages
- Database constraint validation only: Rejected because rollback is expensive

---

### 4. Format-Specific Import Strategies

**Decision**: Separate import method for each format with common validation

**SQL Format**:
- Use `sqlite3.executescript()` to replay SQL statements
- Requires empty database (DROP TABLE if exists in SQL dump)
- Fastest import method (native SQLite)

**JSON Format**:
- Parse JSON to Python dicts
- Use SQLAlchemy bulk operations (`session.bulk_insert_mappings`)
- Preserves ID values from backup
- Best for cross-database compatibility

**CSV Format**:
- Unzip to temp directory
- Parse each CSV file to dicts
- Map CSV rows to SQLAlchemy models
- Handle NULL values (empty strings → None)

**SQLite Compressed Format**:
- Decompress .db.gz to temp file
- Validate database schema
- Copy data table-by-table using SQL INSERT SELECT
- Most reliable for exact SQLite copy

**Implementation Pattern**:
```python
class ImportService:
    def import_sql(self, filepath: str):
        conn = sqlite3.connect(self.db_path)
        with open(filepath, 'r') as f:
            sql_script = f.read()
        conn.executescript(sql_script)
        conn.close()
    
    def import_json(self, filepath: str, session: Session):
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Import in dependency order
        session.bulk_insert_mappings(TeacherAide, data['teacher_aides'])
        session.bulk_insert_mappings(Task, data['tasks'])
        # ... remaining tables
        session.commit()
```

**Alternatives Considered**:
- Single unified import method: Rejected due to format-specific optimizations
- Always convert to JSON first: Rejected as unnecessary conversion overhead

---

### 5. Progress Tracking System

**Decision**: Reuse existing in-memory progress dictionary with import-specific states

**Rationale**:
- Consistent with existing export progress tracking
- No database overhead during import
- Real-time updates via polling endpoint
- Automatic cleanup after completion

**Progress States**:
- `validating`: Checking file format and schema
- `importing`: Restoring data to database
- `verifying`: Post-import validation checks
- `completed`: Import successful
- `failed`: Import failed (includes rollback)

**Implementation Pattern**:
```python
# Reuse existing pattern from backup_service.py
_import_progress: Dict[str, Dict[str, Any]] = {}

def import_backup(self, filepath: str, format_type: str):
    import_id = str(uuid.uuid4())
    
    # Stage 1: Validation
    self._update_progress(import_id, {
        'status': 'validating',
        'progress_percent': 0,
        'current_step': 'Validating backup file...'
    })
    
    # Stage 2: Import
    self._update_progress(import_id, {
        'status': 'importing',
        'progress_percent': 40,
        'current_step': 'Importing table 1 of 8: teacher_aides'
    })
    
    # ... continue with remaining tables
```

**Alternatives Considered**:
- WebSocket for real-time updates: Rejected to maintain local-first architecture
- Database-backed progress: Rejected due to performance overhead during import

---

### 6. Database Emptiness Check

**Decision**: Query row count for all 8 required tables before import

**Rationale**:
- Fast operation (COUNT queries are optimized)
- Prevents accidental data loss
- Clear error message if data exists
- Consistent with fresh-installation requirement

**Implementation Pattern**:
```python
def check_database_empty(self, session: Session) -> tuple[bool, List[str]]:
    """Check if all tables are empty. Returns (is_empty, non_empty_tables)."""
    non_empty = []
    
    for table_name in REQUIRED_TABLES:
        model_class = self._get_model_class(table_name)
        count = session.query(model_class).count()
        if count > 0:
            non_empty.append(f"{table_name} ({count} records)")
    
    return (len(non_empty) == 0, non_empty)
```

**Alternatives Considered**:
- Check only critical tables: Rejected to ensure truly fresh installation
- Allow overwrite with confirmation: Rejected per specification (FR-015)

---

### 7. Schema Version Detection

**Decision**: Store schema version in Alembic version table, check during validation

**Rationale**:
- Alembic already tracks schema version
- Can detect version mismatch before import
- Warning allows user to proceed or cancel
- Version stored in backup metadata

**Implementation Pattern**:
```python
def get_schema_version(self, session: Session) -> str:
    """Get current schema version from Alembic."""
    result = session.execute(
        text("SELECT version_num FROM alembic_version")
    ).first()
    return result[0] if result else "unknown"

def validate_schema_version(self, backup_version: str, current_version: str):
    """Check version compatibility and return warning if mismatch."""
    if backup_version != current_version:
        return {
            'warning': 'Schema version mismatch',
            'backup_version': backup_version,
            'current_version': current_version,
            'recommendation': 'Proceeding may cause compatibility issues'
        }
    return None
```

**Alternatives Considered**:
- Block import on version mismatch: Rejected to allow flexibility
- No version checking: Rejected due to potential data corruption risk

---

## Testing Strategy

### Unit Tests (pytest)

**Validation Tests**:
- Test each validation stage independently
- Test validation failures with specific error messages
- Test edge cases (empty files, corrupted files, malformed data)

**Import Tests**:
- Test each format import with sample data
- Test import with relationships (foreign keys)
- Test rollback on failure (mid-import errors)

**Progress Tracking Tests**:
- Test progress updates at each stage
- Test progress retrieval via API
- Test cleanup after completion

### Integration Tests

**End-to-End Import Tests**:
- Export data → Import to fresh DB → Verify data integrity
- Test all 4 formats with real backup files
- Test large datasets (50MB+)
- Test import failure scenarios

**Database State Tests**:
- Verify rollback leaves database unchanged
- Verify successful import preserves all relationships
- Verify foreign key constraints remain enforced

### Frontend Tests (Vitest + RTL)

**Component Tests**:
- File upload interface
- Progress indicator updates
- Error message display
- Success confirmation

**Service Tests**:
- API call mocking
- Progress polling logic
- File size validation

---

## Dependencies

### Backend
- No new dependencies required
- Uses existing: Flask, SQLAlchemy, sqlite3, json, csv, zipfile, gzip

### Frontend
- No new dependencies required
- Uses existing: Material-UI, Axios, Zustand

---

## Performance Considerations

### Import Speed Estimates

**SQL Format**: ~5-10 seconds for 10k records (native SQLite execution)
**JSON Format**: ~10-20 seconds for 10k records (bulk insert via SQLAlchemy)
**CSV Format**: ~15-30 seconds for 10k records (parse + insert)
**SQLite Format**: ~5-10 seconds (compressed copy + decompress)

### Memory Usage

**Validation**: ~2x file size in memory (file + parsed structure)
**Import**: Streaming where possible, ~100MB peak for largest file
**Progress Tracking**: ~1KB per import job in memory

### Optimization Strategies

1. **Bulk Operations**: Use `bulk_insert_mappings` instead of individual inserts
2. **Disable Triggers**: Temporarily disable absence triggers during import
3. **Index Creation**: Create indexes after import rather than during
4. **Batch Commits**: Commit in table-sized batches rather than per-row

---

## Security Considerations

### File Upload Security

- Validate file extensions (whitelist: .sql, .json, .zip, .gz)
- Use `secure_filename()` to prevent path traversal
- Store uploads in temporary directory with restricted permissions
- Delete temporary files after import completion

### SQL Injection Prevention

- Use parameterized queries for all database operations
- Never execute user-supplied SQL directly
- Validate SQL dump format before execution

### Resource Limits

- 100MB file size limit prevents DoS
- Timeout for import operations (5 minutes max)
- Rate limiting on import endpoint (1 per 10 seconds)

---

## Error Handling

### Error Categories

**User Errors** (400 status):
- Invalid file format
- File too large
- Database not empty
- Missing required tables

**Validation Errors** (400 status):
- Schema mismatch
- Data type errors
- Foreign key violations
- Duplicate keys

**System Errors** (500 status):
- Database connection failure
- Disk space insufficient
- File system errors
- Unexpected exceptions

### Error Response Format

```json
{
  "error": "Import validation failed",
  "details": "Missing required table: teacher_aides",
  "import_id": "uuid",
  "status": "failed",
  "stage": "validation",
  "suggestions": [
    "Ensure backup file is complete",
    "Verify backup was created with this application"
  ]
}
```

---

## Rollback Strategy

### Automatic Rollback Triggers

1. Validation failure in any stage
2. Database constraint violation
3. Foreign key reference error
4. Disk space exhaustion
5. Unexpected exception during import

### Rollback Verification

After rollback, verify:
- All tables have same row counts as before import
- No orphaned records exist
- Foreign key constraints remain valid
- Database file size unchanged

### Manual Recovery

If automatic rollback fails:
1. Stop application
2. Restore from last known good backup
3. Restart application
4. Verify database integrity

---

## Future Enhancements

### Post-MVP Considerations

**Incremental Import**:
- Import only new/changed records
- Merge with existing data
- Conflict resolution strategies

**Backup Encryption**:
- Encrypt backup files with password
- Decrypt during import with key

**Cloud Backup Integration**:
- Optional cloud storage for backups
- Direct import from cloud URLs
- Maintains local-first principle (cloud is optional)

**Import Preview**:
- Show summary of what will be imported
- Preview data before committing
- Dry-run mode

---

## References

- Flask File Uploads: https://flask.palletsprojects.com/en/3.0.x/patterns/fileuploads/
- SQLAlchemy Bulk Operations: https://docs.sqlalchemy.org/en/20/orm/queryguide/dml.html#orm-queryguide-bulk-insert
- SQLite Transactions: https://www.sqlite.org/lang_transaction.html
- Python tempfile module: https://docs.python.org/3/library/tempfile.html

---

**Status**: Research complete, ready for Phase 1 design
