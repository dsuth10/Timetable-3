
# Data Model: Snap-to-Gap

This feature does not require any database schema changes. It primarily uses a new frontend-only `Gap` structure to manage the snapping logic.

## Frontend Entities

### Gap
Represents an available segment of time in an aide's schedule.

| Field | Type | Description |
|-------|------|-------------|
| start_time | string | HH:MM format |
| end_time | string | HH:MM format |
| duration | number | Duration in minutes |
| aide_id | number | Aide this gap belongs to |
| date | string | ISO date string |

## Validation Rules
- `duration >= 10`: Minimum snapping duration.
- `duration <= 30`: Maximum snapping duration (per grid line constraint).
- Gaps cannot cross `SCHEDULE_SEGMENTS` boundaries (grid lines).
- Gaps must not overlap with any existing `Assignment` or `Absence`.

