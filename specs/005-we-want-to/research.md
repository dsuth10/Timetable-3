# Research: Database Backup System

## Research Questions

### 1. SQLite Backup Methods

**Question**: How to generate different backup formats from SQLite database?

**Decision**: Use multiple approaches for different formats:
- **SQL Dump**: Use `sqlite3` command-line tool or Python's `sqlite3` module with `.dump()` method
- **JSON Export**: Query all tables, serialize to JSON using Python's `json` module
- **CSV Collection**: Export each table to CSV using Python's `csv` module, package in ZIP
- **Compressed SQLite**: Copy database file and compress using `gzip` module

**Rationale**: 
- SQLite provides built-in `.dump()` for SQL format
- JSON/CSV exports provide data portability without SQL knowledge
- Compressed SQLite preserves exact database state with minimal processing
- All methods work offline and use standard Python libraries

**Alternatives Considered**:
- Third-party libraries (e.g., `sqlalchemy-utils`) - rejected to minimize dependencies
- Database replication - rejected as overkill for backup use case
- Cloud backup integration - rejected per local-first architecture

### 2. Progress Tracking for Long-Running Operations

**Question**: How to provide progress updates during backup creation?

**Decision**: Use Flask's streaming response with Server-Sent Events (SSE) or chunked transfer encoding for real-time progress updates.

**Rationale**:
- SSE allows server to push progress updates to client
- Chunked transfer encoding works with standard HTTP
- Progress can be calculated based on tables processed (e.g., "Processing table 3 of 8")
- Frontend can update progress bar incrementally

**Alternatives Considered**:
- Polling endpoint - rejected due to overhead and latency
- WebSocket - rejected as overkill for one-way progress updates
- Background job queue (Celery) - rejected as adds complexity and external dependency

**Implementation Approach**:
- Backend: Generator function yields progress updates during backup
- Frontend: EventSource or fetch with streaming to receive updates
- Progress calculation: (tables_processed / total_tables) * 100

### 3. File Download Patterns in Flask

**Question**: How to serve backup files for download with proper headers?

**Decision**: Use Flask's `send_file()` with appropriate headers:
- `Content-Type`: application/octet-stream or format-specific MIME type
- `Content-Disposition`: attachment with filename
- `Content-Length`: File size for progress tracking

**Rationale**:
- `send_file()` handles file streaming efficiently
- Proper headers ensure browser downloads file instead of displaying
- Filename in Content-Disposition header sets download filename
- Works with all backup formats

**Alternatives Considered**:
- Base64 encoding in JSON response - rejected due to size overhead
- Direct file system access from frontend - rejected (security, CORS)
- Pre-signed URLs - rejected (not applicable for local-first)

**Implementation Approach**:
- Store backup files temporarily in `backend/instance/backups/` directory
- Generate unique backup ID for each backup request
- Return backup ID immediately, then allow download via GET endpoint
- Clean up old backup files periodically (optional, future enhancement)

### 4. Integrity Validation Approaches

**Question**: How to validate backup integrity before making available for download?

**Decision**: Perform multiple validation checks:
- **File size check**: Ensure backup file is non-zero and reasonable size
- **Data completeness**: Verify all tables are present in backup
- **Format-specific validation**: 
  - SQL: Check for CREATE TABLE and INSERT statements
  - JSON: Parse JSON and verify all table keys exist
  - CSV: Verify all expected CSV files exist in ZIP
  - Compressed SQLite: Verify file can be opened and contains expected tables

**Rationale**:
- File size check catches empty or truncated files
- Data completeness ensures all tables backed up
- Format-specific validation catches corruption early
- Validation happens server-side before download link provided

**Alternatives Considered**:
- Checksum/hash verification - considered but deferred (can add later)
- Full restore test - rejected as too time-consuming for user experience
- Client-side validation only - rejected as insufficient (file may be corrupted before download)

**Implementation Approach**:
- Validate immediately after backup creation completes
- Return validation errors as part of backup creation response
- Only provide download link if validation passes
- Log validation failures for troubleshooting

### 5. Error Handling and Retry Logic

**Question**: How to handle database locks and other errors during backup?

**Decision**: Implement retry logic with exponential backoff for database locks, immediate failure for other errors.

**Rationale**:
- Database locks are transient (usually from active queries)
- Exponential backoff prevents overwhelming locked database
- Other errors (permissions, disk space) should fail immediately
- User can retry after acknowledging error

**Alternatives Considered**:
- Automatic retry for all errors - rejected (some errors require user action)
- No retry logic - rejected (database locks are common and transient)
- Queue-based retry - rejected (adds complexity, not needed for single-user system)

**Implementation Approach**:
- Catch `sqlite3.OperationalError` for database locks
- Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- Return specific error messages based on error type
- Log all errors with context for troubleshooting

### 6. Temporary File Management

**Question**: Where to store backup files temporarily before download?

**Decision**: Store in `backend/instance/backups/` directory with timestamped subdirectories or unique filenames.

**Rationale**:
- `instance/` directory already exists and is gitignored
- Separate `backups/` subdirectory keeps backups organised
- Timestamped filenames prevent collisions
- Can implement cleanup policy later (e.g., delete backups older than 7 days)

**Alternatives Considered**:
- In-memory storage - rejected (too large for big databases)
- User's download directory - rejected (security, cross-platform issues)
- Database blob storage - rejected (unnecessary complexity)

**Implementation Approach**:
- Create `backend/instance/backups/` directory if it doesn't exist
- Use format: `{backup_id}_{format}_{timestamp}.{ext}`
- Store backup metadata (format, size, created_at) in memory or simple JSON file
- Implement cleanup job (optional, future enhancement)

## Technology Decisions

### Python Libraries
- **sqlite3**: Built-in, for SQL dump generation
- **json**: Built-in, for JSON export
- **csv**: Built-in, for CSV export
- **zipfile**: Built-in, for CSV collection packaging
- **gzip**: Built-in, for SQLite compression
- **tempfile**: Built-in, for temporary file handling (if needed)

### Flask Patterns
- **Blueprint**: Create `backup` blueprint following existing route patterns
- **Streaming Response**: Use generator functions for progress updates
- **send_file()**: For file download with proper headers
- **Error Handling**: Standard Flask error responses (400, 500, etc.)

### Frontend Patterns
- **Material-UI**: Use existing MUI components (Button, Select, LinearProgress, Alert)
- **Axios**: Use existing axios service for API calls
- **EventSource/Streaming**: For progress updates (or polling fallback)
- **File Download**: Use browser's download via blob URL or direct link

## Open Questions Resolved

✅ All backup formats can be generated using standard Python libraries  
✅ Progress tracking feasible via streaming responses  
✅ File download works with Flask's send_file()  
✅ Integrity validation can be performed server-side  
✅ Error handling patterns established  
✅ Temporary file storage location determined

## References

- SQLite Backup: https://docs.python.org/3/library/sqlite3.html#sqlite3.Connection.backup
- Flask File Downloads: https://flask.palletsprojects.com/en/2.3.x/api/#flask.send_file
- Flask Streaming: https://flask.palletsprojects.com/en/2.3.x/patterns/streaming/
- Material-UI Progress: https://mui.com/material-ui/react-progress/

