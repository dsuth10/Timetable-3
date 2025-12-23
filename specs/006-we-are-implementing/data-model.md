# Data Model: Daily Display Timetable

This feature leverages existing core entities while introducing a "Daily View" perspective. No new database tables are required, but specific field usages and virtual groupings are defined.

## Entities

### TeacherAide (Existing)
Represents the vertical axis of the daily timetable.
- `id`: Primary key.
- `name`: Displayed in the sticky left column.
- `colour_hex`: Used for the row header or accent.

### Task (Existing)
Represents the "Task Bank" templates.
- `id`: Primary key.
- `title`: Displayed in the task bank card.
- `category`: Used for grouping/collapsing in the panel (FR-003).
- `start_time`, `end_time`: Placeholder values.

### Assignment (Existing)
Represents the items in the timeline grid and the "Relief Pool".
- `id`: Primary key.
- `task_id`: Link to the template.
- `aide_id`: If NULL and status is 'RELIEF_POOL', it appears in the Relief Pool panel. If NOT NULL, it appears in the aide's timeline row.
- `date`: The date being viewed.
- `start_time`, `end_time`: Actual scheduled times (30m increments).
- `status`: 'RELIEF_POOL', 'ASSIGNED', 'UNASSIGNED', etc.

### Absence (Existing)
Used to determine if an aide row should be "reddened out".
- `aide_id`: Link to the aide.
- `date`: The date being viewed.

## State Transitions (Virtual)

| Action | Current State | New State | Side Effects |
|--------|---------------|-----------|--------------|
| Drop from Bank | N/A (Template) | Assignment Created | `aide_id` set to target row, `date` set to current, `status`='ASSIGNED'. |
| Drop from Relief | `status`='RELIEF_POOL' | `status`='ASSIGNED' | `aide_id` set to target row, `original_aide_id` preserved. |
| Overlap Drop | N/A | Multiple Assignments | UI calculates split-view for concurrent assignments. |

## Validation Rules
- **Assignment Duration**: Drops from Task Bank default to slot duration (FR-005).
- **Time Increments**: Assignments MUST align with school-defined slots (usually 30m, first is 20m).
- **Date Consistency**: All operations on the Daily Display are pinned to the active `date` context.

