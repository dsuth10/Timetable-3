# Quickstart: Sophisticated Hover Tooltip

## Overview
This feature adds a detailed hover tooltip to assignments in the timetable.

## Verification Steps

### 1. Manual Testing
1.  Open the Timetable.
2.  Hover your mouse over any **assigned task** (colored card).
3.  Wait for **1 second**.
4.  **Verify**: A tooltip appears showing:
    -   Task Title and Category.
    -   Classroom, Room Number, and Teacher.
    -   Start and End times.
    -   List of all assigned teacher aides (or "None").
    -   Up to 10 future recurrence dates if it's a recurring task (with "..." if more exist).
    -   Task notes (or "No notes provided").
5.  Move your mouse away.
6.  **Verify**: The tooltip disappears immediately.
7.  (Mobile) Perform a **long-press** for 1 second on a task.
8.  **Verify**: The tooltip appears.

### 2. Automated Tests
Run the following commands to verify the implementation:

#### Backend
```bash
pytest backend/tests/contract/test_tooltip_get.py
pytest backend/tests/unit/test_assignment_service.py # (or where tooltip logic is added)
```

#### Frontend
```bash
npm test frontend/src/components/TimetableGrid/TaskTooltip.test.tsx
```

## Troubleshooting
- **Tooltip doesn't appear**: Ensure the hover duration is at least 1 second. Check browser console for fetch errors.
- **Missing data**: Verify the task has a classroom and notes associated in the database.
- **Recurrence missing**: Ensure the assignment is linked to a `RecurringSeries`.

