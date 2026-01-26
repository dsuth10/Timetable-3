# Quickstart: Import System Testing

**Feature**: Robust Export and Import System  
**Date**: 2026-01-24  
**Purpose**: Step-by-step testing scenarios for validating import functionality

## Prerequisites

### Environment Setup

1. **Install Dependencies**:
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Database Setup**:
   ```bash
   # Create fresh database
   cd backend
   flask db upgrade
   ```

3. **Run Application**:
   ```bash
   # Terminal 1: Backend
   cd backend
   python run.py
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

4. **Access Application**:
   - Frontend: http://localhost:3000/timetable/schedule
   - Backend API: http://localhost:5000

---

## Test Data Preparation

### Create Test Backup Files

Before testing import, you need backup files to import. Use one of these methods:

**Option A: Use Existing Backup System**
1. Navigate to Schedule page
2. Click "Management" button (bottom right)
3. Select "Backup" tab
4. Create backups in each format:
   - Select "SQL Dump" → Click "Create Backup" → Download
   - Select "JSON Export" → Click "Create Backup" → Download
   - Select "CSV Collection" → Click "Create Backup" → Download
   - Select "Compressed SQLite" → Click "Create Backup" → Download

**Option B: Use Sample Backup Files**
Sample backups are provided in `specs/013-we-need-to/test-data/` (after implementation):
- `sample_minimal.json` (5 records, minimal test data)
- `sample_comprehensive.json` (650 records, full relationships)
- `sample_invalid_schema.json` (missing required table)
- `sample_invalid_fk.json` (broken foreign keys)

---

## Scenario 1: Fresh Installation Import (Happy Path)

**User Story**: As an administrator, I want to import a complete backup to a fresh installation.

### Setup
1. Stop frontend and backend
2. Delete existing database:
   ```bash
   rm backend/instance/timetable.db
   ```
3. Create fresh database:
   ```bash
   cd backend
   flask db upgrade
   ```
4. Restart frontend and backend

### Test Steps

**Step 1.1: Verify Database is Empty**
```bash
# API Check
curl http://localhost:5000/api/backup/check-database
```

**Expected Response**:
```json
{
  "is_empty": true,
  "tables_checked": ["teacher_aides", "tasks", "assignments", "classrooms", "absences", "availability", "requests", "recurring_series"],
  "non_empty_tables": []
}
```

**Step 1.2: Validate Backup File**
1. Open browser: http://localhost:3000/timetable/schedule
2. Click "Management" → "Backup" tab
3. Look for "Import Backup" section (new UI)
4. Click "Validate File" button
5. Select `sample_comprehensive.json`
6. Wait for validation to complete

**Expected Result**:
- ✅ Green checkmark: "Validation passed"
- ⚠️ Yellow warning (optional): "Schema version mismatch" (if versions differ)
- Summary shows: 650 total records, 8 tables present

**Step 1.3: Import Backup File**
1. After validation, click "Import" button
2. Confirm import in dialog: "Are you sure? This will restore all data."
3. Observe progress bar showing:
   - "Validating backup file..." (0-20%)
   - "Importing table 1 of 8: teacher_aides" (25%)
   - "Importing table 2 of 8: classrooms" (35%)
   - ... continue through all tables
   - "Import completed successfully" (100%)
4. Wait for completion message

**Expected Result**:
- ✅ Success message: "Import completed! Imported 650 records."
- Records summary shows:
  - teacher_aides: 10
  - classrooms: 5
  - tasks: 50
  - recurring_series: 5
  - assignments: 500
  - absences: 20
  - availability: 50
  - requests: 10

**Step 1.4: Verify Imported Data**
1. Navigate to Schedule page
2. Verify teacher aides appear in sidebar (10 aides)
3. Verify tasks appear in unassigned panel
4. Verify assignments appear in timetable grid
5. Click on an assignment → verify task details load correctly
6. Verify classrooms appear in class view

**Expected Result**:
- All data visible and functional
- No "Missing Task" errors
- Relationships intact (assignments → tasks, tasks → classrooms)

### API Testing (Optional)

```bash
# Step 1: Validate backup
curl -X POST http://localhost:5000/api/backup/validate \
  -F "file=@sample_comprehensive.json" \
  -F "format=json"

# Expected: {"is_valid": true, ...}

# Step 2: Import backup
curl -X POST http://localhost:5000/api/backup/import \
  -F "file=@sample_comprehensive.json" \
  -F "format=json"

# Expected: {"import_id": "uuid", "status": "validating", ...}

# Step 3: Poll progress
IMPORT_ID="<uuid from step 2>"
curl http://localhost:5000/api/backup/import/$IMPORT_ID/progress

# Expected: {"status": "importing", "progress_percent": 50, ...}
# Repeat until status = "completed"
```

---

## Scenario 2: Prevent Import to Non-Empty Database

**User Story**: As an administrator, I should be blocked from accidentally overwriting existing data.

### Setup
- Use database from Scenario 1 (has data)
- Do NOT delete or reset database

### Test Steps

**Step 2.1: Check Database Status**
```bash
curl http://localhost:5000/api/backup/check-database
```

**Expected Response**:
```json
{
  "is_empty": false,
  "tables_checked": [...],
  "non_empty_tables": [
    {"table_name": "teacher_aides", "record_count": 10},
    {"table_name": "tasks", "record_count": 50}
  ]
}
```

**Step 2.2: Attempt Import**
1. Open Management → Backup tab
2. Click "Import" button
3. Select any backup file

**Expected Result**:
- ❌ Error message displayed immediately:
  > "Import not allowed: Database contains existing data"
  >
  > "Found data in: teacher_aides (10 records), tasks (50 records), ..."
- Import button disabled or hidden
- Clear instructions: "Import is only allowed on fresh installations with no existing data"

### API Testing (Optional)

```bash
curl -X POST http://localhost:5000/api/backup/import \
  -F "file=@sample_comprehensive.json" \
  -F "format=json"
```

**Expected Response**: HTTP 400
```json
{
  "error": "Import not allowed: database contains existing data",
  "details": "Found data in: teacher_aides (10 records), tasks (50 records)",
  "code": "E003"
}
```

---

## Scenario 3: File Size Validation

**User Story**: As a system, I should reject files over 100MB and warn for files over 50MB.

### Setup
- Fresh database (see Scenario 1 setup)

### Test Steps

**Step 3.1: Test 50MB+ Warning**
1. Create a ~60MB backup file (or use `sample_large_60mb.json`)
2. Open Management → Backup tab → Import section
3. Select the 60MB file

**Expected Result**:
- ⚠️ Warning dialog appears:
  > "Large file detected (60MB). Import may take several minutes. Continue?"
- User can click "Continue" or "Cancel"
- If "Continue" → import proceeds normally
- If "Cancel" → import cancelled, file cleared

**Step 3.2: Test 100MB+ Rejection**
1. Create a ~120MB backup file (or use `sample_oversized_120mb.json`)
2. Select the file in import UI

**Expected Result**:
- ❌ Error message displayed immediately:
  > "File exceeds 100MB limit. Please use a smaller backup file."
- File is rejected before upload
- Import does not proceed

### API Testing (Optional)

```bash
# 60MB file (warning)
curl -X POST http://localhost:5000/api/backup/import \
  -F "file=@sample_large_60mb.json" \
  -F "format=json"

# Expected: Warning in response, but import proceeds

# 120MB file (rejection)
curl -X POST http://localhost:5000/api/backup/import \
  -F "file=@sample_oversized_120mb.json" \
  -F "format=json"

# Expected: HTTP 400, {"error": "File exceeds 100MB limit", ...}
```

---

## Scenario 4: Invalid Backup File Validation

**User Story**: As a user, I should get clear error messages when importing invalid backup files.

### Setup
- Fresh database (see Scenario 1 setup)

### Test Cases

**Test 4.1: Missing Required Table**
1. Select `sample_invalid_schema.json` (missing "classrooms" table)
2. Click "Import"

**Expected Result**:
- ❌ Validation fails with error:
  > "Validation failed: Missing required table: classrooms"
- Detailed error shows which table is missing
- Import does not proceed

**Test 4.2: Foreign Key Violations**
1. Select `sample_invalid_fk.json` (assignments reference non-existent tasks)
2. Click "Import"

**Expected Result**:
- ❌ Validation fails with error:
  > "Validation failed: Foreign key violations detected"
  >
  > "assignments.task_id=42 references non-existent task"
- Lists all broken foreign key references
- Import does not proceed

**Test 4.3: Invalid Data Types**
1. Select `sample_invalid_types.json` (string in integer field)
2. Click "Import"

**Expected Result**:
- ❌ Validation fails with error:
  > "Validation failed: Invalid data type in tasks.classroom_id"
  >
  > "Expected integer, got string: 'abc'"
- Shows which field has the type error
- Import does not proceed

**Test 4.4: Corrupted File**
1. Select `sample_corrupted.json` (truncated JSON)
2. Click "Import"

**Expected Result**:
- ❌ Validation fails with error:
  > "Validation failed: File is corrupted or incomplete"
  >
  > "JSON parse error: Unexpected end of file"
- Import does not proceed

### API Testing (Optional)

```bash
# Each test
curl -X POST http://localhost:5000/api/backup/validate \
  -F "file=@sample_invalid_*.json" \
  -F "format=json"

# Expected: {"is_valid": false, "errors": [...], ...}
```

---

## Scenario 5: Import Failure and Rollback

**User Story**: As a system, if import fails partway through, I must roll back all changes.

### Setup
- Fresh database
- Use `sample_fails_midway.json` (designed to fail during assignments import)

### Test Steps

**Step 5.1: Prepare Test**
1. Note initial database state (empty)
2. Count records in each table (all should be 0)

**Step 5.2: Trigger Failure**
1. Import `sample_fails_midway.json`
2. Observe progress:
   - teacher_aides: ✅ Imported (10 records)
   - classrooms: ✅ Imported (5 records)
   - tasks: ✅ Imported (50 records)
   - recurring_series: ✅ Imported (5 records)
   - assignments: ❌ Failed (foreign key violation)

**Step 5.3: Verify Rollback**
1. Check error message:
   > "Import failed: Foreign key constraint violation in assignments"
   >
   > "All changes have been rolled back. Database is unchanged."
2. Verify database is empty again:
   ```bash
   curl http://localhost:5000/api/backup/check-database
   ```

**Expected Result**:
- All tables still have 0 records
- No partial data remains
- Database is in exact same state as before import attempt
- No orphaned records
- Foreign key constraints still valid

### API Testing

```bash
# Import failing backup
curl -X POST http://localhost:5000/api/backup/import \
  -F "file=@sample_fails_midway.json" \
  -F "format=json"

# Poll progress until failure
IMPORT_ID="<uuid>"
curl http://localhost:5000/api/backup/import/$IMPORT_ID/progress

# Expected final response:
# {
#   "status": "failed",
#   "error": "Foreign key constraint violation",
#   "rollback_status": "completed",
#   ...
# }

# Verify database empty
curl http://localhost:5000/api/backup/check-database

# Expected: {"is_empty": true, ...}
```

---

## Scenario 6: Schema Version Mismatch Warning

**User Story**: As a user, I should be warned about version mismatches but allowed to proceed.

### Setup
- Fresh database with schema version v1.2.5
- Backup file from v1.2.3 (`sample_old_version.json`)

### Test Steps

**Step 6.1: Validate Backup**
1. Select `sample_old_version.json`
2. Click "Validate"

**Expected Result**:
- ⚠️ Warning displayed:
  > "Schema version mismatch detected"
  >
  > "Backup version: v1.2.3"
  > "Current version: v1.2.5"
  >
  > "Proceeding may cause compatibility issues. Do you want to continue?"
- Two buttons: "Continue" and "Cancel"

**Step 6.2: Proceed with Import**
1. Click "Continue"
2. Import proceeds normally
3. Data is imported successfully

**Expected Result**:
- Import completes successfully
- Warning persists in import summary
- Data is functional despite version difference

**Step 6.3: Cancel Import**
1. Repeat validation
2. Click "Cancel" when warning appears

**Expected Result**:
- Import is cancelled
- No data imported
- User returned to import screen

---

## Scenario 7: All Four Import Formats

**User Story**: As a user, I should be able to import backups in all four supported formats.

### Setup
- Four backup files in different formats (all with same data):
  - `sample.sql`
  - `sample.json`
  - `sample.zip` (CSV collection)
  - `sample.db.gz` (compressed SQLite)

### Test Steps

For each format, repeat these steps:

**Step 7.1: Reset Database**
```bash
rm backend/instance/timetable.db
cd backend && flask db upgrade
```

**Step 7.2: Import Format**
1. Select appropriate backup file
2. Verify format is auto-detected correctly
3. Click "Import"
4. Wait for completion

**Step 7.3: Verify Data**
1. Check all 650 records imported correctly
2. Verify relationships intact
3. Verify data matches other format imports

**Expected Results**:

| Format | Import Time (650 records) | Status |
|--------|---------------------------|--------|
| SQL | 5-10 seconds | ✅ Success |
| JSON | 10-20 seconds | ✅ Success |
| CSV (ZIP) | 15-30 seconds | ✅ Success |
| SQLite (GZ) | 5-10 seconds | ✅ Success |

All formats produce identical data after import.

---

## Scenario 8: Cancel Import in Progress

**User Story**: As a user, I should be able to cancel a long-running import.

### Setup
- Fresh database
- Large backup file (~80MB, takes 2+ minutes to import)

### Test Steps

**Step 8.1: Start Import**
1. Select large backup file
2. Click "Import"
3. Import begins

**Step 8.2: Cancel During Validation**
1. While status shows "Validating..." (0-20%)
2. Click "Cancel Import" button

**Expected Result**:
- Import cancelled immediately
- Status changes to "Cancelled"
- No data imported
- Database remains empty

**Step 8.3: Cancel During Import**
1. Start import again
2. Wait for status "Importing table 3 of 8..."
3. Click "Cancel Import" button

**Expected Result**:
- Cancel request acknowledged
- Current table import completes
- Rollback triggered
- All imported data removed
- Database returns to empty state
- Status changes to "Cancelled"

### API Testing

```bash
# Start import
curl -X POST http://localhost:5000/api/backup/import \
  -F "file=@sample_large.json" \
  -F "format=json"

# Get import_id from response
IMPORT_ID="<uuid>"

# Cancel import
curl -X POST http://localhost:5000/api/backup/import/$IMPORT_ID/cancel

# Expected: {"status": "cancelled", "rollback_status": "completed"}
```

---

## Scenario 9: Progress Tracking and Refresh

**User Story**: As a user, I should see real-time progress updates during import.

### Setup
- Fresh database
- Medium-sized backup (10MB, ~5000 records)

### Test Steps

**Step 9.1: Monitor Progress**
1. Start import
2. Observe progress bar and status messages update:
   - "Validating backup file..." → 0%
   - "Validating schema (Stage 2/4)" → 10%
   - "Validating relationships (Stage 4/4)" → 20%
   - "Importing table 1 of 8: teacher_aides" → 25%
   - "Importing table 2 of 8: classrooms" → 35%
   - ... continues incrementally
   - "Import completed successfully" → 100%

**Expected Result**:
- Progress bar animates smoothly
- Status text updates every 1-2 seconds
- Percentage increases monotonically (never decreases)
- Current step clearly indicates what's happening

**Step 9.2: Refresh During Import**
1. Start import
2. Wait until 50% progress
3. Refresh browser page (F5)
4. Navigate back to Management → Backup → Import

**Expected Result**:
- Import continues in background
- Progress is preserved and displayed correctly
- Can still view current status
- Can still cancel import

---

## Scenario 10: Import Completion and Data Refresh

**User Story**: As a user, after successful import, all application views should show the imported data immediately.

### Setup
- Fresh database
- `sample_comprehensive.json` backup

### Test Steps

**Step 10.1: Import Data**
1. Complete full import of backup file
2. Wait for "Import completed successfully" message

**Step 10.2: Verify Auto-Refresh**
1. Without manually refreshing, check:
   - Schedule page: Aides appear in sidebar
   - Schedule page: Assignments appear in grid
   - Tasks page: Task bank shows all tasks
   - Classrooms page: Classrooms list populated
2. Open Management → Teacher Aides: All aides listed
3. Open Management → Absences: Absences visible

**Expected Result**:
- All views automatically refresh and display imported data
- No manual page refresh required
- Data appears within 1-2 seconds of import completion

**Step 10.3: Verify Data Integrity**
1. Click on an assignment in schedule → opens task details
2. Task details show correct classroom, times, category
3. Edit an assignment → changes save successfully
4. Create new assignment → no errors

**Expected Result**:
- All functionality works with imported data
- No "Missing Task" errors
- No foreign key violations
- Application behaves as if data was created normally

---

## Performance Benchmarks

Expected import times for different data sizes:

| Records | File Size | Validation | Import | Total |
|---------|-----------|------------|--------|-------|
| 650 (comprehensive) | ~5MB | 2-5s | 10-15s | 15-20s |
| 5,000 (single school, 1 year) | ~10MB | 5-10s | 20-40s | 30-50s |
| 20,000 (multi-year data) | ~40MB | 15-30s | 60-120s | 90-150s |
| 50,000 (max realistic) | ~100MB | 30-60s | 120-240s | 180-300s |

If import times significantly exceed these benchmarks, investigate:
- Database connection issues
- Disk I/O bottlenecks
- Memory constraints
- CPU utilization

---

## Troubleshooting

### Import Fails with "Database Locked"

**Symptom**: Import fails with error "Database is locked"

**Cause**: Another process has the database file open

**Solution**:
1. Stop all Flask processes
2. Close any SQLite database viewers
3. Delete any `.db-journal` files
4. Restart Flask
5. Retry import

### Import Stalls at High Percentage

**Symptom**: Import reaches 90%+ but never completes

**Cause**: Large table import or indexing overhead

**Solution**:
- Wait up to 5 minutes (timeout limit)
- Check backend logs for errors
- If timeout, cancel and retry with smaller backup

### Validation Passes But Import Fails

**Symptom**: Validation reports no errors, but import fails with constraint violation

**Cause**: Race condition or database trigger interference

**Solution**:
1. Check for custom database triggers
2. Verify Alembic migrations are up to date
3. Try importing with SQL format instead (bypasses ORM)

### Frontend Shows Import Complete But No Data

**Symptom**: Import status shows "completed" but application is empty

**Cause**: Frontend state not refreshed

**Solution**:
1. Manually refresh browser (F5)
2. Check backend logs to verify import actually succeeded
3. Verify API endpoint `/api/backup/check-database` shows data

---

## Success Criteria

All scenarios must pass with:
- ✅ No database corruption
- ✅ All foreign key relationships intact
- ✅ No orphaned records
- ✅ Rollback works correctly on failure
- ✅ Clear error messages for all failure cases
- ✅ Progress tracking works accurately
- ✅ All four formats import successfully
- ✅ Performance within expected benchmarks

---

**Status**: Quickstart ready for implementation testing
