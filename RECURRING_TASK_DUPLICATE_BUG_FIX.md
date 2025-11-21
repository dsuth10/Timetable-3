# Recurring Task Duplicate Bug Fix

## Problem

When a user:
1. Dragged a task from the Task Bank to the calendar (creating an assignment)
2. Double-clicked to edit the assignment
3. Enabled "Make this a recurring task"
4. Saved the changes

The system was creating a duplicate assignment on the same day as the original, resulting in two blocks on the first day while subsequent recurring instances appeared correctly as single blocks.

## Root Cause

When converting a one-off assignment to recurring, the backend's `RecurrenceService.generate_assignments_for_task()` was generating assignments starting from "today" without checking if an assignment already existed for that date. This meant:

1. **Existing assignment**: Created when user dragged task to calendar
2. **New recurring instance**: Generated for the same date when task was converted to recurring

## Solution

Added an `exclude_date` parameter throughout the system to prevent generating a duplicate assignment for the date that already has one.

### Changes Made

#### 1. Frontend: TaskEditModal.tsx
```typescript
// Include the existing assignment's date to exclude it from generation
if (assignment?.date) {
  payload.existing_assignment_date = assignment.date;
}
```

Now sends the current assignment's date to the backend.

#### 2. Backend: routes/tasks.py
```python
existing_assignment_date = data.get('existing_assignment_date')

# Parse existing assignment date if provided
exclude_date = None
if existing_assignment_date:
    try:
        exclude_date = dt_date.fromisoformat(existing_assignment_date)
    except Exception:
        pass

# Generate recurring assignments
assignments_data = RecurrenceService.generate_assignments_for_task(
    task_id=task.id,
    rrule_string=task.recurrence_rule,
    task_start_time=task.start_time,
    task_end_time=task.end_time,
    expires_on=task.expires_on,
    aide_id=aide_id,
    exclude_date=exclude_date  # NEW: Exclude the existing assignment's date
)
```

#### 3. Backend: services/recurrence_service.py
```python
def generate_assignments_for_task(
    task_id: int,
    rrule_string: str,
    task_start_time: dt_time,
    task_end_time: dt_time,
    expires_on: date,
    horizon_weeks: int = DEFAULT_HORIZON_WEEKS,
    aide_id: Optional[int] = None,
    exclude_date: Optional[date] = None  # NEW parameter
) -> List[dict]:
    # ... generate occurrences ...
    
    # Filter out the excluded date if provided
    if exclude_date:
        occurrences = [occ for occ in occurrences if occ['date'] != exclude_date]
    
    # ... convert to assignments ...
```

#### 4. Type Definitions Updated
- `frontend/src/store/stores/tasks.ts`
- `frontend/src/services/tasksApi.ts`

Both updated to include `existing_assignment_date?: string` in the payload type.

## Testing

After this fix:
1. Drag a task to the calendar → Creates one assignment ✅
2. Double-click to edit → Opens edit dialog ✅
3. Enable recurring → Check the checkbox ✅
4. Configure days and weeks → Set parameters ✅
5. Save → Generates recurring instances WITHOUT duplicating the first day ✅

## Benefits

- **No duplicates**: The existing assignment remains as-is
- **Clean recurring pattern**: All subsequent instances are generated correctly
- **Backward compatible**: The `exclude_date` parameter is optional, so existing code paths still work
- **Future-proof**: Can be extended to exclude multiple dates if needed

## Files Modified

1. `frontend/src/components/TaskModals/TaskEditModal.tsx`
2. `frontend/src/store/stores/tasks.ts`
3. `frontend/src/services/tasksApi.ts`
4. `backend/api/routes/tasks.py`
5. `backend/api/services/recurrence_service.py`

