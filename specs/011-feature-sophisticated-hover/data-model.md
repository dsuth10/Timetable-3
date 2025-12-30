# Data Model: Sophisticated Hover Tooltip

## Virtual Entity: TooltipData
This entity represents the aggregated data returned by the backend for the tooltip. It does not map directly to a single database table.

| Field | Type | Description |
| :--- | :--- | :--- |
| `task_title` | String | Title of the task from the `Task` model. |
| `category` | String | Task category (e.g., CLASS_SUPPORT). |
| `classroom` | Object | Classroom details: `{ name, room_number, teacher }`. |
| `start_time` | String | Scheduled start time (HH:MM). |
| `end_time` | String | Scheduled end time (HH:MM). |
| `assigned_aides` | Array<String> | Names of all aides assigned to this task at this time. |
| `recurrence` | Object | `{ is_recurring: boolean, dates: string[], has_more: boolean }`. |
| `notes` | String | Task or assignment-specific notes. |

## Relationships
- **Assignment (1) -> Task (1)**: To fetch title, category, and notes.
- **Task (1) -> Classroom (1)**: To fetch classroom details.
- **Assignment (1) -> RecurringSeries (0..1)**: To fetch upcoming dates.
- **Assignment (1) -> Assignment (N)**: To find other aides assigned to the same task at the same time.

## Validation Rules
- **Time Format**: Must return HH:MM for readability in tooltip.
- **Recurrence Limit**: Maximum of 10 dates in the `dates` array.
- **Empty States**:
  - `notes`: If empty, return "No notes provided".
  - `assigned_aides`: If empty, return `["None"]`.
  - `recurrence`: If not recurring, `is_recurring` is `false` and `dates` is empty.

