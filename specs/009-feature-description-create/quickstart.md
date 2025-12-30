
# Quickstart: Snap-to-Gap Features

This guide provides steps to verify the Snap-to-Gap drag-and-drop feature.

## Prerequisites
- Backend running at `http://localhost:5000`
- Frontend running at `http://localhost:3000`
- At least one Teacher Aide with some assignments and "Unavailable" periods.

## Manual Test Scenarios

### 1. Snap to Gap between Unavailable and Task
1. Open the Daily Display view.
2. Locate an aide (e.g., Bart Simpson) who is "Unavailable" until 09:40 and has a task starting at 10:00.
3. Drag a task from the TaskBank into the gap (09:40 - 10:00).
4. **Observe**: The gap should be highlighted in the aide's assigned color when hovering.
5. **Drop**: The task edit dialog should open automatically with:
   - Start Time: 09:40
   - End Time: 10:00
6. **Confirm**: Save the task and verify it fills the gap perfectly.

### 2. Snap to Gap between two Tasks
1. Locate an aide who has Task A ending at 11:30 and Task B starting at 12:00.
2. Drag a task from the TaskBank into the space between Task A and Task B.
3. **Observe**: The 30-minute gap highlights.
4. **Drop**: The dialog should show 11:30 - 12:00.

### 3. Minimum Duration Enforcement (Negative Test)
1. Find a gap that is only 5 minutes wide (e.g., between a task ending at 09:05 and another starting at 09:10).
2. Attempt to drag a task into this gap.
3. **Observe**: No highlight should appear, OR if dropped, an error message "All tasks need to be at least 10 minutes wide" should be displayed.

### 4. Grid Line Boundary Constraint
1. Find a gap that spans across 10:10 (e.g., 10:00 to 10:20).
2. Drag a task into the gap.
3. **Observe**: The task should only snap to one segment (either 10:00-10:10 or 10:10-10:20) depending on the cursor position. It MUST NOT cross the 10:10 line by default.

## Automated Tests
- Run `pytest backend/tests/unit/test_gap_logic.py` (once implemented)
- Run `npm run test frontend/src/utils/gapUtils.test.ts` (once implemented)

