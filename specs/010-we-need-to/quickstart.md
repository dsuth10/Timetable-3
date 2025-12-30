# Quickstart: Delete Recurring Assignment Instances for Specific Aide

This guide provides steps to verify the selective recurring assignment deletion feature.

## Prerequisites
- Backend running at `http://localhost:5000`
- Frontend running at `http://localhost:3000`
- At least one task with a recurring series assigned to an aide

## Test Data Setup

1. Create a task "Reading Support" in the Task Bank
2. Assign it to "Aide Smith" as a recurring task for 4 weeks (every Monday)
3. Optionally: Also assign the same task to "Aide Jones" for 4 weeks (every Monday)

## Manual Test Scenarios

### 1. Basic Deletion Flow

1. Navigate to the Daily Display or Schedule view
2. Double-click on one of Aide Smith's recurring assignments (e.g., Week 2)
3. Click the "Delete" button to open the delete dialog
4. **Verify**: A fourth option appears: "Remove this and future recurring instances for this aide"
5. Select the new option
6. **Verify**: The dialog shows how many assignments will be deleted (should be 3 for Week 2-4)
7. Click "Delete"
8. **Verify**: Only Aide Smith's Week 2, 3, 4 assignments are deleted
9. **Verify**: Week 1 (past) is preserved
10. **Verify**: Aide Jones's 4 assignments remain untouched

### 2. Option Hidden for Non-Recurring

1. Create a one-time (non-recurring) assignment
2. Double-click to edit it
3. Click "Delete"
4. **Verify**: Only 3 options appear (no "Remove recurring instances" option)

### 3. Modified Assignment Preserved

1. Set up a 4-week recurring assignment for Aide Smith
2. Manually edit Week 3's time (e.g., change from 9:00 to 10:00)
3. Delete Week 2 with "Remove this and future recurring instances"
4. **Verify**: Week 2 and Week 4 are deleted
5. **Verify**: Week 3 is preserved (it was modified)
6. **Verify**: Success message shows "1 modified assignment preserved"

### 4. Relief Pool Assignments Included

1. Set up a 4-week recurring assignment for Aide Smith
2. Mark Aide Smith as absent for Week 3 (moves assignment to Relief Pool)
3. Delete Week 2 with "Remove this and future recurring instances"
4. **Verify**: Week 2, Week 3 (Relief Pool), and Week 4 are all deleted
5. **Verify**: The Relief Pool no longer shows the Week 3 task

### 5. Past Assignments Preserved

1. Set up a 4-week recurring assignment starting last week
2. Delete Week 2 (current or future) with the new option
3. **Verify**: Week 1 (past) is preserved
4. **Verify**: Week 2, 3, 4 are deleted

## API Verification

### Preview Count
```bash
curl -X DELETE "http://localhost:5000/api/assignments/123/recurring-series-for-aide?preview=true" \
  -H "Content-Type: application/json" \
  -d '{"version": 1}'
```

Expected response:
```json
{
  "preview": true,
  "would_delete_count": 3,
  "would_delete_ids": [123, 124, 125],
  "would_skip_count": 0,
  "would_skip_reason": null
}
```

### Execute Deletion
```bash
curl -X DELETE "http://localhost:5000/api/assignments/123/recurring-series-for-aide" \
  -H "Content-Type: application/json" \
  -d '{"version": 1}'
```

Expected response:
```json
{
  "deleted_count": 3,
  "deleted_ids": [123, 124, 125],
  "skipped_count": 0,
  "skipped_reason": null,
  "message": "Removed 3 recurring instance(s) for this aide"
}
```

## Automated Tests

- Run `pytest backend/tests/unit/test_assignment_series_delete.py` (once implemented)
- Run `pytest backend/tests/contract/test_delete_recurring_series_for_aide.py` (once implemented)
- Run `npm run test frontend/tests/components/TaskDeleteDialog.test.tsx` (once implemented)

## Expected UI Behavior

### Delete Dialog with 4 Options

When deleting a recurring assignment, the dialog should show:

```
Choose how you want to delete this task:

○ Delete only this instance
  Remove the assignment for Mon, Jan 6, 2025 only. The task template will remain.

● Remove this and future recurring instances for this aide
  Delete this and 3 more recurring assignments for Aide Smith. 
  Modified assignments will be preserved. Past assignments will not be affected.

○ Reset task (keep template, remove all assignments)
  Remove all assignments and reset the task back to the task bank.

○ Permanently delete task
  Permanently remove this task and all its assignments.
```

### Success Toast

After deletion:
- "Removed 4 recurring instance(s) for this aide"
- If any skipped: "Removed 3 recurring instance(s) for this aide (1 modified preserved)"

