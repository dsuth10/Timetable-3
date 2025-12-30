# Research: Delete Recurring Assignment Instances for Specific Aide

## Decision 1: Delete Operation Strategy

### Decision
Implement a new backend endpoint `DELETE /api/assignments/{id}/recurring-series-for-aide` that:
1. Accepts the assignment ID as the starting point
2. Fetches all assignments in the same `recurring_series_id` where `aide_id` OR `original_aide_id` matches
3. Filters to only include assignments on or after the selected assignment's date
4. Excludes assignments whose `start_time` or `date` have been modified from the series' original pattern
5. Deletes the filtered assignments in a single transaction

### Rationale
- **Backend logic**: The delete logic involves complex filtering (series membership, aide ownership, date comparison, modification detection) that is best handled by the backend.
- **Atomic operation**: A single endpoint ensures all deletions happen atomically with proper transaction rollback on failure.
- **Optimistic locking**: The endpoint should accept `version` for concurrency safety.

### Alternatives Considered
1. **Frontend orchestration**: Have the frontend call multiple `DELETE /api/assignments/{id}` requests. Rejected because it lacks atomicity and is slower.
2. **Bulk delete endpoint with IDs**: Frontend calculates which IDs to delete and sends them. Rejected because modification detection requires database comparison.

---

## Decision 2: Modification Detection

### Decision
An assignment is considered "modified" if its `start_time` or `date` differs from the expected pattern in the `recurring_series` table. Specifically:
- Compare `assignment.start_time` to `recurring_series.start_time`
- Compare `assignment.date` day-of-week to the BYDAY pattern in `recurrence_rule`

### Rationale
- The `recurring_series` table stores the original `start_time` and `end_time` used when generating assignments.
- If a user manually changes an assignment's time, it indicates intentional customization that should be preserved.
- Date modification is detected by checking if the assignment's weekday matches the recurrence pattern.

### Implementation
```python
def is_assignment_modified(assignment, series):
    """Check if assignment was manually modified from series pattern."""
    # Time modification
    if assignment.start_time != series.start_time or assignment.end_time != series.end_time:
        return True
    
    # Date modification - check weekday matches pattern
    # Parse BYDAY from recurrence_rule and compare
    return False
```

---

## Decision 3: Relief Pool Assignment Handling

### Decision
Include assignments currently in the Relief Pool (`status = 'RELIEF_POOL'`, `aide_id = NULL`) in the bulk deletion if:
- They have the same `recurring_series_id`
- Their `original_aide_id` matches the targeted aide
- They meet the "not modified" and "on or after selected date" criteria

### Rationale
- Per user clarification: Assignments moved to Relief Pool due to absence were originally part of the aide's schedule and should be cleaned up.
- The `original_aide_id` field preserves the aide association even after reassignment to the pool.

---

## Decision 4: UI Option Visibility

### Decision
The new "Remove this and future recurring instances for this aide" option in `TaskDeleteDialog`:
- **Visible** only when `assignment.recurring_series_id` is not null
- **Disabled** when not visible
- Shows a confirmation count of assignments to be deleted

### Rationale
- Non-recurring assignments don't have a series to delete.
- Showing the count helps users understand the impact before confirming.

### Implementation
- Add a fourth radio option in `TaskDeleteDialog.tsx` between "instance" and "reset"
- Conditionally render based on `assignment?.recurring_series_id`
- Call a new API endpoint to get the count before deletion
- Call the delete endpoint on confirmation

---

## Decision 5: API Response

### Decision
The delete endpoint should return:
```json
{
  "deleted_count": 4,
  "deleted_ids": [101, 102, 103, 104],
  "skipped_count": 1,
  "skipped_reason": "1 modified assignment(s) preserved"
}
```

### Rationale
- Provides clear feedback on what was actually deleted vs. skipped.
- The frontend can display this in a success toast.
- Helps users understand if any assignments were preserved due to modifications.

---

## Decision 6: Endpoint Preview Mode

### Decision
Add a `preview=true` query parameter to the endpoint that returns the count and list of assignments that would be deleted without actually deleting them.

### Rationale
- Allows the frontend to show "This will delete X assignments" before the user confirms.
- Reduces risk of accidental deletion by showing impact upfront.
- Same logic path ensures accuracy between preview and actual deletion.

---

## Technology Notes

### Backend (Python/Flask)
- Add new route in `backend/api/routes/assignments.py` or create dedicated `recurring_series.py` route file
- Service layer function in a new or existing service (e.g., `assignment_service.py`)
- Use SQLAlchemy query filters with joined `recurring_series` table

### Frontend (React/TypeScript)
- Modify `TaskDeleteDialog.tsx` to add fourth option
- Add new API function in `assignmentsApi.ts` for the new endpoint
- Handle preview/count display in the dialog

### Testing
- Unit tests for modification detection logic
- Contract tests for the new endpoint
- Integration tests for the full delete flow
- Edge cases: empty series, all modified, Relief Pool mixed

