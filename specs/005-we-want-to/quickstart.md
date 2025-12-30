# Quickstart: Database Backup Feature

## Overview
This quickstart validates the complete backup flow from user perspective, ensuring all functional requirements are met.

## Prerequisites
- Application running (backend on port 5000, frontend on port 3000)
- Database populated with sample data (at least one record in each table)
- Browser with developer tools open (to monitor network requests)

## Test Scenario: Complete Backup Flow

### Step 1: Navigate to Backup Tab
1. Open the application in browser
2. Navigate to Schedule page
3. Click the bottom drawer toggle button (arrow up icon at bottom center)
4. **Verify**: Bottom drawer opens showing tabs: "Aides", "Tasks", "Classes", "Backup"
5. Click on "Backup" tab
6. **Verify**: Backup interface displays with:
   - Format selection dropdown/radio buttons showing: SQL, JSON, CSV, SQLite (compressed)
   - "Create Backup" button
   - No backup file listed initially

### Step 2: Select Format and Create Backup
1. Select "SQL" format from format selector
2. Click "Create Backup" button
3. **Verify**: 
   - Button shows loading state (disabled, spinner)
   - Status message appears: "Creating backup..."
   - Progress indicator appears (if database is large enough)
   - Progress updates show percentage (0%, 25%, 50%, etc.)
   - Current step updates: "Processing table 1 of 8", "Processing table 2 of 8", etc.

### Step 3: Monitor Backup Progress
1. **Verify**: Progress indicator updates in real-time
2. **Verify**: Status transitions: "Creating backup..." → "Validating backup..." → "Backup complete"
3. **Verify**: Progress reaches 100%
4. **Verify**: Success message appears: "Backup created successfully"

### Step 4: Download Backup File
1. **Verify**: Download button/link appears with filename: `timetable_backup_sql_2025-12-16_14-30-45.sql` (timestamp varies)
2. Click download button/link
3. **Verify**: Browser downloads file with correct name
4. **Verify**: File is non-empty (check file size > 0)
5. **Verify**: File contains SQL statements (open and verify CREATE TABLE and INSERT statements)

### Step 5: Test Other Formats
1. Select "JSON" format
2. Click "Create Backup"
3. **Verify**: Backup created successfully
4. **Verify**: Download filename: `timetable_backup_json_2025-12-16_14-30-45.json`
5. **Verify**: Downloaded file is valid JSON (can be parsed)
6. **Verify**: JSON contains all 8 tables as keys

Repeat for CSV and SQLite (compressed) formats.

### Step 6: Verify Data Completeness
1. Open SQL backup file
2. **Verify**: Contains CREATE TABLE statements for all 8 tables:
   - teacher_aides
   - tasks
   - assignments
   - classrooms
   - absences
   - availability
   - requests
   - recurring_series
3. **Verify**: Contains INSERT statements with data from all tables
4. **Verify**: Row counts match database (if possible to verify)

### Step 7: Test Error Handling - Database Lock
1. Open database file in another tool (e.g., DB Browser for SQLite) with write lock
2. Attempt to create backup
3. **Verify**: Error message appears: "Database busy - try again in a moment"
4. **Verify**: Error details logged (check backend logs)
5. **Verify**: Retry button appears
6. Close database lock
7. Click retry
8. **Verify**: Backup succeeds on retry

### Step 8: Test Error Handling - Network Interruption
1. Start backup creation
2. Disconnect network (or stop backend server) mid-process
3. **Verify**: Error message appears: "Network interruption - please try again"
4. **Verify**: Retry button appears
5. Reconnect network (or restart backend)
6. Click retry
7. **Verify**: Backup succeeds on retry

### Step 9: Test Large Database Progress
1. (If database is large enough) Create backup
2. **Verify**: Progress indicator shows percentage updates
3. **Verify**: Current step updates show which table is being processed
4. **Verify**: Progress updates occur every 1-2 seconds (not too frequent, not too slow)

### Step 10: Test Validation Failure
1. (Simulate validation failure - may require backend modification for testing)
2. **Verify**: Error message appears explaining validation failure
3. **Verify**: Error details logged
4. **Verify**: Retry button appears

## Acceptance Criteria Validation

✅ **FR-001**: Backup tab visible in bottom management drawer  
✅ **FR-002**: Complete backup of all database data created  
✅ **FR-003**: All four formats supported (SQL, JSON, CSV, SQLite compressed)  
✅ **FR-004**: One-click backup initiation (select format, click button)  
✅ **FR-005**: Backup validated before download, filename includes timestamp and format  
✅ **FR-006**: Status messages displayed, progress indicator shown for large databases  
✅ **FR-007**: Errors handled gracefully with specific messages, logging, and retry option  
✅ **FR-008**: All 8 tables included in backup  
✅ **FR-009**: Format selection available before backup creation  
✅ **FR-010**: Visual feedback provided (loading indicators, success/error states)

## Edge Cases Validated

✅ Large database shows progress indicator  
✅ Database lock handled with retry  
✅ Browser download blocking handled with error message  
✅ Network interruption handled with retry  
✅ Validation failure handled with error message and retry

## Notes
- All tests should pass without manual intervention beyond initial setup
- File downloads should work in all major browsers (Chrome, Firefox, Safari, Edge)
- Progress updates should be smooth and not cause UI lag
- Error messages should be user-friendly and actionable

