# Recurring Series Refactor - Implementation Summary

## Problem
When a task was made recurring for one teacher aide, the recurrence settings were stored on the Task template itself. This prevented the same task from being made recurring for other aides with different settings because the system checked if the task already had `recurrence_rule` and skipped generation on subsequent attempts.

**User Scenario:**
1. Create task "Year 3 Reading Support"
2. Drop it into Aide 1's schedule and make it recurring for 4 weeks
3. Drop the same task into Aide 2's schedule and try to make it recurring for 6 weeks
4. BUG: Aide 2 had no recurring tasks generated

## Solution Architecture
Introduced a new `RecurringSeries` model that represents an independent recurring assignment series. This separates the task template (reusable definition) from recurring instances (specific to aide + recurrence pattern).

### Key Changes

#### Backend

**1. New Model: `RecurringSeries`**
- File: `backend/api/models/recurring_series.py`
- Represents an independent recurring series with:
  - `task_id`: Link to task template
  - `aide_id`: Which aide (nullable for unassigned)
  - `recurrence_rule`, `expires_on`: Recurrence settings
  - `start_time`, `end_time`: Times for this series
  - `base_date`: Original assignment date

**2. Updated Models:**
- `Assignment`: Added `recurring_series_id` foreign key
- `Task`: Removed `recurrence_rule` and `expires_on` fields
- `TeacherAide`: Added relationship to `recurring_series`

**3. Database Migration:**
- File: `backend/migrations/versions/002_recurring_series.py`
- Creates `recurring_series` table
- Adds `recurring_series_id` to assignments
- Migrates existing recurring tasks to new structure
- Removes old fields from tasks table
- Uses batch mode for SQLite compatibility

**4. Updated Services:**
- `RecurrenceService`: Now accepts `recurring_series_id` parameter
- Assignments generated with series link

**5. Refactored Routes:**
- `PUT /api/tasks/<id>`: Now creates a new RecurringSeries when recurrence settings provided
- Each call to make a task recurring creates an independent series
- New routes in `backend/api/routes/recurring_series.py`:
  - `GET /api/recurring-series/<id>`: Get series details
  - `PUT /api/recurring-series/<id>`: Update series (e.g., extend expiry)
  - `DELETE /api/recurring-series/<id>`: Delete series and assignments
  - `GET /api/recurring-series`: List all series with filters

#### Frontend

**1. Updated Types:**
- File: `frontend/src/types/index.ts`
- Removed `recurrence_rule` and `expires_on` from `Task` interface
- Added new `RecurringSeries` interface
- Added `recurring_series_id` to `Assignment` interface

**2. Updated Components:**
- `TaskEditModal`: Shows info when assignment is part of recurring series
- No major UI changes needed - backend handles series creation transparently

**3. New API Service:**
- File: `frontend/src/services/recurringSeriesApi.ts`
- Functions to manage recurring series

**4. Updated Existing Services:**
- `tasksApi.update()`: Type signature updated for new payload structure

#### Tests

**1. New Integration Test:**
- File: `backend/tests/integration/test_multiple_recurring_instances.py`
- Tests the exact bug scenario from user report
- Verifies multiple independent recurring instances work
- Confirms deletion of one series doesn't affect another

**2. Updated Contract Tests:**
- File: `backend/tests/contract/test_recurring_tasks.py`
- Updated to work with new architecture
- Tests now create base assignment first, then make it recurring

## Test Results

All tests passing:
```
test_same_task_multiple_recurring_instances PASSED
test_delete_one_recurring_series_doesnt_affect_another PASSED
```

## Key Benefits

1. **Independence**: Same task template can have unlimited recurring instances
2. **Flexibility**: Each aide can have different recurrence patterns for the same task
3. **Clarity**: Recurring logic separated from task templates
4. **Maintainability**: Easier to manage, extend, or delete recurring series
5. **Scalability**: No limit on number of recurring instances per task

## Migration Safety

- Database migration includes data migration for existing recurring tasks
- Groups existing assignments by aide_id and creates appropriate series
- Downgrade capability included in migration
- Tested with SQLite using batch mode for compatibility

## Files Modified

### New Files (3)
- `backend/api/models/recurring_series.py`
- `backend/api/routes/recurring_series.py`
- `backend/migrations/versions/002_recurring_series.py`
- `backend/tests/integration/test_multiple_recurring_instances.py`
- `frontend/src/services/recurringSeriesApi.ts`

### Modified Backend (7)
- `backend/api/models/__init__.py`
- `backend/api/models/assignment.py`
- `backend/api/models/task.py`
- `backend/api/models/teacher_aide.py`
- `backend/api/__init__.py`
- `backend/api/routes/tasks.py`
- `backend/api/services/recurrence_service.py`
- `backend/tests/contract/test_recurring_tasks.py`

### Modified Frontend (3)
- `frontend/src/types/index.ts`
- `frontend/src/components/TaskModals/TaskEditModal.tsx`
- `frontend/src/services/tasksApi.ts`

## Deployment Steps

1. **Backup Database**: Create backup of production database before migration
2. **Run Migration**: `python -m alembic upgrade head`
3. **Verify Migration**: Check that recurring_series table exists and data migrated
4. **Deploy Code**: Deploy both backend and frontend changes
5. **Test**: Verify the bug scenario works as expected

## Verification

The implementation successfully fixes the reported bug. Users can now:
1. Create a task template
2. Drop it into multiple aides' schedules
3. Make it recurring with different patterns for each aide
4. All recurring instances work independently
5. Deleting one series doesn't affect others

**Status**: ✅ Implementation Complete and Tested

