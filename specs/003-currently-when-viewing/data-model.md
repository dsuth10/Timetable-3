# Data Model: Interactive Task Selection

## Entities

### Task
*Existing entity, usage clarified.*
- **id**: integer (PK)
- **title**: string (required)
- **description**: text (optional)
- **classroom_id**: integer (FK -> Classroom.id) - *Critical for filtering*
- **created_at**: datetime
- **status**: string (enum: 'pending', 'completed', etc.) - *Optional for filtering*

### Assignment
*Existing entity, representing the link.*
- **id**: integer (PK)
- **aide_id**: integer (FK -> TeacherAide.id)
- **task_id**: integer (FK -> Task.id)
- **date**: date
- **time_slot_id**: integer (FK -> TimeSlot.id) OR **start_time**/**end_time** (depending on existing schema)

### Classroom
*Existing entity, context provider.*
- **id**: integer (PK)
- **name**: string

## Relationships
- **Classroom** has many **Tasks** (1:N)
- **Task** has many **Assignments** (1:N)
- **TeacherAide** has many **Assignments** (1:N)

## Validation Rules
1. **Task Creation**: `title` must not be empty.
2. **Assignment**: `aide_id` and `task_id` must be valid and exist.
3. **Context**: When creating a task via this flow, `classroom_id` is strictly required and must match the column where the drop occurred.

## State Transitions
- **Draft Assignment**: Created in frontend memory when drop occurs.
- **Pending Selection**: Modal open, waiting for user input.
- **Committed Assignment**: Validated and persisted to DB.

