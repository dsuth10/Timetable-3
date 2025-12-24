# Quickstart: Testing Daily View Assignment Dialog

## Manual Verification Steps

### Basic Assignment Flow

1.  **Navigate to Daily View**: Open the browser to `/daily?date=2025-12-08`.
2.  **Open Taskbank**: Ensure the side panel Taskbank is visible.
3.  **Perform Drag-and-Drop**:
    - Select a task template (e.g., "Math Support").
    - Drag it onto a time slot for an active Teacher Aide.
4.  **Verify Dialog**:
    - The "Set Assignment Details" modal (AssignmentDurationModal) MUST appear.
    - It SHOULD be prepopulated with the correct Date (2025-12-08), Start Time (matching the slot), and Aide Name.
    - The initial duration SHOULD match the slot size (e.g., 30 minutes for a 30-minute slot).
5.  **Modify Details**:
    - Change the duration to 60 minutes.
    - Verify the "Make this a recurring task" toggle is present and functional.
    - Try changing the Teacher Aide field.
6.  **Confirm**: Click "Confirm Assignment".
7.  **Final Check**:
    - The assignment MUST appear on the Daily View timeline.
    - The task card SHOULD reflect the new duration and correct time range.
    - Check the console/network tab to ensure `POST /assignments` was successful.

### Absent Aide Validation

1.  **Mark an Aide as Absent**: Using the absence management feature, mark a teacher aide as absent for the current date.
2.  **Attempt Drop on Absent Aide**:
    - Try to drag a task from the Taskbank onto the absent aide's row.
    - The drop MUST be blocked (cursor indicates drop not allowed).
    - No dialog should appear.
    - An error toast MAY appear saying "Cannot assign: [Aide Name] is marked as absent for this date".

### Overlapping Assignments (Vertical Stacking)

1.  **Create First Assignment**:
    - Drag a task to a time slot (e.g., 09:00-09:30) for an aide.
    - Confirm the assignment.
2.  **Create Overlapping Assignment**:
    - Drag another task to an overlapping time slot (e.g., 09:15-09:45) for the same aide.
    - Confirm the assignment.
3.  **Verify Vertical Stacking**:
    - Both assignments MUST be visible in the timeline.
    - They SHOULD be stacked vertically within the same row (not overlapping horizontally).
    - Each assignment card SHOULD show the correct time range and task title.
    - The row height MAY increase to accommodate multiple stacked assignments.

### Taskbank Remains Open

1.  **Drag task from Taskbank**:
    - Note that the Taskbank is open in the right panel.
    - Drag a task to the timeline.
2.  **Verify Taskbank State**:
    - When the "Set Assignment Details" dialog appears, the Taskbank MUST remain visible in the background.
    - The Taskbank should NOT close or be hidden by the modal.

## Automated Test Scenarios

The following automated tests are available in `frontend/tests/integration/DailyViewAssignment.test.tsx`:

### Test Coverage

1. **T003: Dialog Appearance**
   - Verifies that the AssignmentDurationModal appears when dropping a task from the bank onto an aide slot.
   - Checks that Date, Start Time, End Time, and Teacher Aide fields are prepopulated correctly.

2. **T004: Absent Aide Blocking**
   - Verifies that drops onto absent aide rows are blocked.
   - Ensures no dialog appears when attempting to drop on an absent aide.

3. **T012: Recurring Task Toggle**
   - Verifies that the "Make this a recurring task" toggle is present in the dialog.
   - Checks that it is unchecked by default.

4. **T013: Aide and Classroom Changes**
   - Verifies that users can change the assigned Teacher Aide field.
   - Verifies that the Classroom field is present and editable.

### Running Tests

```bash
cd frontend
npm test -- tests/integration/DailyViewAssignment.test.tsx
```

### Expected Results

All tests should pass after the implementation is complete. If any test fails, review the corresponding functional requirement in `spec.md`.

