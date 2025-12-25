# Data Model: Task Card Enhancements

**Feature**: `008-each-task-card`

This feature utilizes existing entities and relationships. No schema changes are required.

## Involved Entities

### Task
- `id`: Primary Key
- `title`: String
- `category`: Enum (PLAYGROUND, CLASS_SUPPORT, GROUP_SUPPORT, INDIVIDUAL_SUPPORT)
- `classroom_id`: Foreign Key to Classroom (Optional)
- `notes`: Text

### Assignment
- `id`: Primary Key
- `task_id`: Foreign Key to Task
- `aide_id`: Foreign Key to TeacherAide (Optional)
- `date`: Date
- `start_time`: Time (Assignment specific)
- `end_time`: Time (Assignment specific)
- `status`: Enum (UNASSIGNED, ASSIGNED, IN_PROGRESS, COMPLETE, RELIEF_POOL)

### TeacherAide
- `id`: Primary Key
- `name`: String
- `colour_hex`: String

### Classroom
- `id`: Primary Key
- `name`: String

## Relationships
- **Task 1:N Assignment**: A task template can have many scheduled assignments.
- **TeacherAide 1:N Assignment**: An aide can be assigned to many tasks over time.
- **Classroom 1:N Task**: A classroom can be the location for many different tasks.
- **Assignment M:N TeacherAide** (via multiple assignments for the same task/time): While typically 1:1, the UI must handle cases where multiple aides are assigned to the same task (which technically creates multiple assignments for the same task_id).

## Validation Rules
- No new database-level validation needed.
- Frontend MUST handle `null` classroom_id by showing generic icon.
- Frontend MUST handle `null` aide_id by showing "Unassigned" or empty name list.

