# Data Model: Quick-Click Task Creation

## Overview
This feature uses existing Task and Assignment entities. No new database tables or model changes are required. This document describes the data flow and validation rules specific to quick-click creation.

## Entities Used

### Task (Existing)
**Table**: `tasks`

The task created via quick-click is identical to tasks created through the traditional Task Creation Modal:

| Field | Type | Constraints | Quick-Click Behavior |
|-------|------|-------------|---------------------|
| `id` | INTEGER | PRIMARY KEY | Auto-generated |
| `title` | VARCHAR(200) | NOT NULL | Required from user input |
| `category` | VARCHAR(20) | NOT NULL, one of: PLAYGROUND, CLASS_SUPPORT, GROUP_SUPPORT, INDIVIDUAL_SUPPORT | Required from user input |
| `start_time` | TIME | NOT NULL | Always set to placeholder `09:00:00` |
| `end_time` | TIME | NOT NULL | Always set to placeholder `10:00:00` |
| `classroom_id` | INTEGER | FK → classrooms.id, nullable | Optional, from user selection (default: NULL) |
| `notes` | TEXT | nullable | Optional, from user input |
| `status` | VARCHAR(20) | NOT NULL, default 'UNASSIGNED' | Set to 'UNASSIGNED' (task template) |
| `created_at` | TIMESTAMP | NOT NULL | Auto-generated |
| `updated_at` | TIMESTAMP | NOT NULL | Auto-generated |

**Key Points**:
- Task times are placeholders (09:00-10:00) and do not lock any schedule
- Task is reusable across multiple assignments
- Task lives in Task Bank with no time constraints

### Assignment (Existing)
**Table**: `assignments`

The assignment created via quick-click links the task to a specific date, time, and aide:

| Field | Type | Constraints | Quick-Click Behavior |
|-------|------|-------------|---------------------|
| `id` | INTEGER | PRIMARY KEY | Auto-generated |
| `task_id` | INTEGER | FK → tasks.id, NOT NULL | Set to newly created task ID |
| `aide_id` | INTEGER | FK → teacher_aides.id, nullable | Set to currently-viewed aide ID (from context) |
| `date` | DATE | NOT NULL | Set to clicked slot's date |
| `start_time` | TIME | NOT NULL | Set to clicked slot's start time (locked) |
| `end_time` | TIME | NOT NULL | Calculated from start_time + selected duration |
| `status` | VARCHAR(20) | NOT NULL | Set to 'ASSIGNED' (since aide_id is provided) |
| `version` | INTEGER | NOT NULL, default 1 | Set to 1 (optimistic locking) |
| `original_aide_id` | INTEGER | FK → teacher_aides.id, nullable | NULL (not applicable for quick-create) |
| `recurring_series_id` | INTEGER | FK → recurring_series.id, nullable | NULL (not applicable for quick-create) |
| `created_at` | TIMESTAMP | NOT NULL | Auto-generated |
| `updated_at` | TIMESTAMP | NOT NULL | Auto-generated |

**Key Points**:
- Assignment times are in 5-minute increments (validated by Assignment model)
- Assignment duration = end_time - start_time (from user-selected duration)
- Assignment is immediately assigned to the aide (status = 'ASSIGNED')

## Data Flow

### Quick-Click Creation Flow

1. **User Action**: Click "+" button in time slot
   - Context captured: `date`, `start_time`, `aide_id`, `slot_duration`

2. **Modal Input**: User provides
   - `title` (required)
   - `category` (required, one of 4 valid categories)
   - `duration` (required, 5-minute increments, default based on slot)
   - `classroom_id` (optional, from dropdown)
   - `notes` (optional)

3. **API Request**: `POST /api/quick-create-task`
   ```json
   {
     "title": "One-on-one reading with Emma",
     "category": "INDIVIDUAL_SUPPORT",
     "date": "2025-01-27",
     "start_time": "10:00:00",
     "duration_minutes": 30,
     "aide_id": 1,
     "classroom_id": 3,
     "notes": "Focus on blending and digraphs"
   }
   ```

4. **Backend Processing** (atomic transaction):
   a. Validate input (title, category, time format, duration)
   b. Check collision detection (same aide, date, overlapping times)
   c. Create Task with placeholder times (09:00-10:00)
   d. Calculate assignment end_time = start_time + duration
   e. Create Assignment with actual times
   f. Commit transaction (both succeed or both fail)

5. **API Response**: `201 Created`
   ```json
   {
     "task": {
       "id": 42,
       "title": "One-on-one reading with Emma",
       "category": "INDIVIDUAL_SUPPORT",
       "start_time": "09:00:00",
       "end_time": "10:00:00",
       "classroom_id": 3,
       "notes": "Focus on blending and digraphs",
       "status": "UNASSIGNED"
     },
     "assignment": {
       "id": 123,
       "task_id": 42,
       "aide_id": 1,
       "date": "2025-01-27",
       "start_time": "10:00:00",
       "end_time": "10:30:00",
       "status": "ASSIGNED",
       "version": 1
     }
   }
   ```

6. **Frontend Update**:
   - Add task to Task Bank store
   - Add assignment to assignments store
   - Update TimetableGrid display
   - Close modal

## Validation Rules

### Task Validation
- `title`: Required, 1-200 characters, non-empty after trim
- `category`: Required, must be one of: PLAYGROUND, CLASS_SUPPORT, GROUP_SUPPORT, INDIVIDUAL_SUPPORT
- `start_time` / `end_time`: Always set to 09:00:00 / 10:00:00 (placeholders)
- `classroom_id`: Optional, must exist in classrooms table if provided
- `notes`: Optional, no length limit

### Assignment Validation
- `task_id`: Required, must exist (created in same transaction)
- `aide_id`: Required, must exist in teacher_aides table
- `date`: Required, valid date format (YYYY-MM-DD)
- `start_time`: Required, must be in 5-minute increments (validated by Assignment model)
- `end_time`: Required, must be in 5-minute increments, must be after start_time
- `duration` (derived): end_time - start_time, must match user-selected duration
- **Collision Detection**: Must not overlap with existing assignment for same aide, same date

### Time Validation Details
- **Task times**: Always 09:00:00 to 10:00:00 (placeholders, not validated for increments)
- **Assignment times**: Must be in 5-minute increments (e.g., 10:00, 10:05, 10:10, 10:15, etc.)
- **Duration calculation**: `end_time = start_time + duration_minutes`
  - Example: start_time = 10:00, duration = 30 → end_time = 10:30
  - Example: start_time = 09:15, duration = 15 → end_time = 09:30

## Constraints and Relationships

### Foreign Key Constraints
- `task.classroom_id` → `classrooms.id` (ON DELETE SET NULL)
- `assignment.task_id` → `tasks.id` (ON DELETE CASCADE)
- `assignment.aide_id` → `teacher_aides.id` (ON DELETE SET NULL)

### Business Rules
1. **Atomic Creation**: Task and assignment must be created in single transaction
   - If task creation succeeds but assignment fails → rollback entire transaction
   - If collision detected → rollback entire transaction
   - No orphaned tasks allowed

2. **Collision Prevention**: Assignment cannot overlap with existing assignment
   - Same `aide_id`
   - Same `date`
   - Overlapping time range: `(start_time < existing.end_time AND end_time > existing.start_time)`
   - Only checks assignments with status IN ('ASSIGNED', 'IN_PROGRESS')

3. **Duration Constraints**:
   - Minimum: 5 minutes
   - Maximum: 60 minutes (or longer if slot allows)
   - Must be in 5-minute increments
   - Cannot extend beyond slot boundaries (enforced by UI, not backend)

## State Transitions

### Task State
- Created with status: `UNASSIGNED` (task template in Task Bank)
- Status changes when assignments are created/deleted (handled by existing logic)

### Assignment State
- Created with status: `ASSIGNED` (since aide_id is provided)
- Can transition to: `IN_PROGRESS`, `COMPLETE` (via existing edit flows)
- Can be moved to `RELIEF_POOL` if aide becomes absent (existing absence logic)

## Indexes Used
- `idx_assignments_aide_date_time`: For collision detection queries
- `idx_tasks_category`: For Task Bank filtering
- No new indexes required

## Data Integrity

### Transaction Guarantees
- **Atomicity**: Both task and assignment created or neither created
- **Consistency**: All foreign keys valid, all constraints satisfied
- **Isolation**: Concurrent quick-clicks handled by database isolation
- **Durability**: Committed data persisted to SQLite

### Error Scenarios
1. **Validation Failure**: Return 400 with error message, no database changes
2. **Collision Detected**: Return 409 with conflict details, no database changes
3. **Database Error**: Rollback transaction, return 500, no partial data
4. **Network Error**: Frontend handles retry, backend idempotent (can retry safely)

## Migration Requirements
**None** - Feature uses existing tables and columns. No schema changes required.
