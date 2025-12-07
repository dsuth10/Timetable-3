# API Contract: Quick-Create Task

## Endpoint

`POST /api/quick-create-task`

Creates a task template and an assignment in a single atomic operation.

## Request

### Headers
```
Content-Type: application/json
```

### Body Schema
```json
{
  "title": "string (required, 1-200 characters)",
  "category": "string (required, one of: PLAYGROUND, CLASS_SUPPORT, GROUP_SUPPORT, INDIVIDUAL_SUPPORT)",
  "date": "string (required, ISO date format: YYYY-MM-DD)",
  "start_time": "string (required, time format: HH:MM or HH:MM:SS, must be in 5-minute increments)",
  "duration_minutes": "integer (required, 5-60, must be multiple of 5)",
  "aide_id": "integer (required, must exist in teacher_aides table)",
  "classroom_id": "integer (optional, must exist in classrooms table if provided)",
  "notes": "string (optional, no length limit)"
}
```

### Example Request
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

## Response

### Success Response: 201 Created

**Body Schema**:
```json
{
  "task": {
    "id": "integer",
    "title": "string",
    "category": "string",
    "start_time": "string (HH:MM:SS format, always 09:00:00)",
    "end_time": "string (HH:MM:SS format, always 10:00:00)",
    "classroom_id": "integer | null",
    "notes": "string | null",
    "status": "string (always 'UNASSIGNED')",
    "created_at": "string (ISO datetime)",
    "updated_at": "string (ISO datetime)"
  },
  "assignment": {
    "id": "integer",
    "task_id": "integer",
    "aide_id": "integer",
    "date": "string (YYYY-MM-DD)",
    "start_time": "string (HH:MM:SS format)",
    "end_time": "string (HH:MM:SS format)",
    "status": "string (always 'ASSIGNED')",
    "version": "integer (always 1)",
    "original_aide_id": "integer | null (always null for quick-create)",
    "recurring_series_id": "integer | null (always null for quick-create)",
    "created_at": "string (ISO datetime)",
    "updated_at": "string (ISO datetime)"
  }
}
```

**Example Response**:
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
    "status": "UNASSIGNED",
    "created_at": "2025-01-27T10:15:30Z",
    "updated_at": "2025-01-27T10:15:30Z"
  },
  "assignment": {
    "id": 123,
    "task_id": 42,
    "aide_id": 1,
    "date": "2025-01-27",
    "start_time": "10:00:00",
    "end_time": "10:30:00",
    "status": "ASSIGNED",
    "version": 1,
    "original_aide_id": null,
    "recurring_series_id": null,
    "created_at": "2025-01-27T10:15:30Z",
    "updated_at": "2025-01-27T10:15:30Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "Bad request",
  "message": "Missing required fields: title, category"
}
```

**Common validation errors**:
- Missing required fields
- Invalid category (not one of the 4 valid values)
- Invalid time format
- Invalid duration (not multiple of 5, out of range)
- Invalid date format

#### 409 Conflict - Collision Detected
```json
{
  "error": "Conflict",
  "message": "Assignment conflicts with existing assignment",
  "conflicts": [
    {
      "existing_assignment_id": 45,
      "task_id": 12,
      "date": "2025-01-27",
      "start_time": "10:00",
      "end_time": "10:30",
      "status": "ASSIGNED"
    }
  ]
}
```

**Conflict details**:
- `conflicts`: Array of existing assignments that overlap with requested time
- Overlap definition: `(start_time < existing.end_time AND end_time > existing.start_time)`
- Only checks assignments with status IN ('ASSIGNED', 'IN_PROGRESS')

#### 404 Not Found - Invalid Foreign Key
```json
{
  "error": "Not found",
  "message": "Aide with id 999 does not exist"
}
```

**Common not found errors**:
- Invalid `aide_id` (does not exist in teacher_aides table)
- Invalid `classroom_id` (does not exist in classrooms table, if provided)

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database transaction failed"
}
```

**Note**: On any error, the entire transaction is rolled back. No partial data is created.

## Validation Rules

### Required Fields
- `title`: Non-empty string, 1-200 characters after trim
- `category`: Must be one of: `PLAYGROUND`, `CLASS_SUPPORT`, `GROUP_SUPPORT`, `INDIVIDUAL_SUPPORT`
- `date`: Valid ISO date format (YYYY-MM-DD)
- `start_time`: Valid time format (HH:MM or HH:MM:SS), must be in 5-minute increments
- `duration_minutes`: Integer, 5-60, must be multiple of 5
- `aide_id`: Integer, must exist in teacher_aides table

### Optional Fields
- `classroom_id`: Integer, must exist in classrooms table if provided
- `notes`: String, no length limit

### Time Validation
- `start_time`: Must be in 5-minute increments (e.g., 10:00, 10:05, 10:10, 10:15, etc.)
- `duration_minutes`: Must be multiple of 5 (5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60)
- `end_time`: Calculated as `start_time + duration_minutes`, must also be in 5-minute increments

### Collision Detection
Before creating assignment, check for overlapping assignments:
- Same `aide_id`
- Same `date`
- Overlapping time range: `(start_time < existing.end_time AND end_time > existing.start_time)`
- Only check assignments with status IN ('ASSIGNED', 'IN_PROGRESS')

## Transaction Behavior

### Atomicity
- Both task and assignment are created in a single database transaction
- If any step fails, the entire transaction is rolled back
- No orphaned tasks or assignments are created

### Idempotency
- Endpoint is not idempotent (multiple calls create multiple tasks/assignments)
- Frontend should prevent duplicate submissions (disable button during request)

## Implementation Notes

### Backend Processing Steps
1. Validate request body (required fields, formats, ranges)
2. Validate foreign keys (aide_id, classroom_id if provided)
3. Validate time format and increments
4. Calculate `end_time = start_time + duration_minutes`
5. Check collision detection (query existing assignments)
6. If collision detected, return 409 and abort
7. Begin database transaction
8. Create Task with placeholder times (09:00-10:00)
9. Create Assignment with actual times
10. Commit transaction
11. Return 201 with both task and assignment data

### Error Handling
- All validation errors return 400 with descriptive message
- Collision errors return 409 with conflict details
- Foreign key errors return 404
- Database errors return 500 and rollback transaction
- Network errors are handled by frontend (retry logic)

## Related Endpoints

- `POST /api/tasks` - Create task template only (traditional flow)
- `POST /api/assignments` - Create assignment only (requires existing task)
- `GET /api/tasks` - List all tasks (includes quick-created tasks)
- `GET /api/assignments` - List assignments (includes quick-created assignments)
