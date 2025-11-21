# Recurring Task System Redesign - Implementation Summary

## Overview
This redesign allows users to create recurring tasks by first creating and placing a one-off task on the calendar, then converting it to recurring by editing the assignment instance.

## User Workflow

1. **Create a Task**: User creates a regular task (appears in Task Bank)
2. **Drag to Calendar**: User drags the task to a specific aide's calendar slot
3. **Convert to Recurring**: User double-clicks the assignment to open Edit dialog
4. **Enable Recurrence**: User checks "Make this a recurring task" checkbox
5. **Configure Recurrence**: 
   - Select weekdays the task should occur on
   - Specify number of weeks (1-52)
6. **Save**: All recurring instances are automatically created for the same aide

## Technical Changes

### Frontend Changes

#### 1. `TaskEditModal.tsx`
- **Added recurring task toggle**: Checkbox to enable/disable recurring mode
- **Replaced "Expiry Date" with "Number of Weeks"**: More intuitive for users
- **Auto-calculate expiry date**: Based on assignment date + number of weeks
- **Pass aide_id**: When converting to recurring, includes the current assignment's aide_id in the API call

Key logic:
```typescript
// Calculate expiry date based on number of weeks from assignment date
if (assignment?.date) {
  const startDate = new Date(assignment.date);
  startDate.setDate(startDate.getDate() + (numWeeks * 7));
  payload.expires_on = startDate.toISOString().split('T')[0];
}

// Include aide_id if this assignment is currently assigned to an aide
if (assignment?.aide_id) {
  payload.aide_id = assignment.aide_id;
}
```

#### 2. `tasks.ts` (Store)
- Updated type signature to accept `aide_id` parameter in `updateTask`

#### 3. `tasksApi.ts`
- Updated `update` method signature to accept `aide_id` parameter

### Backend Changes

#### 1. `recurrence_service.py`
- **Updated `generate_assignments_for_task`**: Added optional `aide_id` parameter
- **Updated `extend_horizon_for_task`**: Added optional `aide_id` parameter
- **Status logic**: If `aide_id` is provided, sets status to 'ASSIGNED', otherwise 'UNASSIGNED'

Key changes:
```python
def generate_assignments_for_task(
    task_id: int,
    rrule_string: str,
    task_start_time: dt_time,
    task_end_time: dt_time,
    expires_on: date,
    horizon_weeks: int = DEFAULT_HORIZON_WEEKS,
    aide_id: Optional[int] = None  # NEW
) -> List[dict]:
    # ...
    assignments = [
        {
            'task_id': task_id,
            'aide_id': aide_id,  # Use provided aide_id
            'date': occ['date'],
            'start_time': occ['start_time'],
            'end_time': occ['end_time'],
            'status': 'ASSIGNED' if aide_id is not None else 'UNASSIGNED',
            'version': 1
        }
        for occ in occurrences
    ]
```

#### 2. `routes/tasks.py`
- **Updated `update_task` endpoint**: 
  - Accept `aide_id` from request payload
  - Detect when task is being converted to recurring
  - Generate recurring assignments with the provided `aide_id`

Key logic:
```python
# Track if we're converting to recurring
was_recurring = task.recurrence_rule is not None
is_now_recurring = recurrence_rule is not None

# If task is being converted to recurring
if is_now_recurring and not was_recurring:
    # Generate recurring assignments
    assignments_data = RecurrenceService.generate_assignments_for_task(
        task_id=task.id,
        rrule_string=task.recurrence_rule,
        task_start_time=task.start_time,
        task_end_time=task.end_time,
        expires_on=task.expires_on,
        aide_id=aide_id  # Pass the aide_id
    )
```

## Benefits

1. **Intuitive UX**: Users work with visible assignments, not abstract templates
2. **Automatic Assignment**: Recurring instances are pre-assigned to the same aide
3. **Flexible**: Users can still create unassigned recurring tasks (by editing before dragging)
4. **Simple Input**: "Number of weeks" is more intuitive than selecting an end date
5. **Single Workflow**: One consistent way to create both one-off and recurring tasks

## Backwards Compatibility

- Existing recurring tasks continue to work
- The old "Expiry Date" is calculated automatically from "Number of Weeks"
- Existing API contracts are preserved (aide_id is optional)

## Testing Recommendations

1. Create a task and drag it to an aide's calendar
2. Double-click the assignment to edit
3. Check "Make this a recurring task"
4. Select weekdays (e.g., Mon, Wed, Fri)
5. Set number of weeks to 4
6. Save and verify:
   - 4 weeks of assignments appear
   - All assignments are assigned to the same aide
   - All assignments have correct days of the week

