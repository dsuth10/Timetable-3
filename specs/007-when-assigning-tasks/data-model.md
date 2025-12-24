# Data Model: Set Assignment Details Dialog in Daily View

## Involved Entities

### Assignment (Existing)
Represents a scheduled task.
- **Fields**:
    - `id`: INTEGER (PK)
    - `task_id`: INTEGER (FK)
    - `aide_id`: INTEGER (FK, optional)
    - `date`: DATE (YYYY-MM-DD)
    - `start_time`: TIME (HH:MM:SS)
    - `end_time`: TIME (HH:MM:SS)
    - `status`: STRING (ASSIGNED, etc.)
    - `version`: INTEGER (optimistic locking)

### Task (Existing)
Represents the task template.
- **Fields**:
    - `id`: INTEGER (PK)
    - `title`: STRING
    - `category`: STRING (PLAYGROUND, CLASS_SUPPORT, etc.)
    - `classroom_id`: INTEGER (FK, optional)
    - `recurrence_rule`: STRING (iCal format, optional)
    - `expires_on`: DATE (optional)

### TeacherAide (Existing)
Staff member receiving the assignment.
- **Fields**:
    - `id`: INTEGER (PK)
    - `name`: STRING
    - `colour_hex`: STRING (#RRGGBB)

## Interaction Logic

1.  **Drop Event**: Captures `taskId` from draggable and `aideId`, `startTime` from droppable.
2.  **State Transition**: Moves to `pendingAssignment` state.
3.  **Dialog Input**: User modifies times, aide, or sets recurrence.
4.  **Confirmation**:
    - Calls `POST /assignments` to create the record.
    - If `isRecurring` is true, calls `PUT /tasks/{id}` to update the task template with the recurrence rule.
    - Refresh Daily View data from `GET /daily-view/{date}`.

