# Quickstart: Task Card Enhancements

**Feature**: `008-each-task-card`

## Overview
This feature updates the visual representation of assigned tasks in three key areas:
1. **Aide Schedule**: Weekly view for a single aide.
2. **Daily Timeline**: Horizontal timeline for all aides.
3. **Class Schedule**: Weekly view for a single classroom.

## Development Setup
No backend changes are required. Ensure the frontend development server is running.

```bash
cd frontend
npm run dev
```

## Verification Steps

### 1. Aide Weekly View
1. Navigate to the **Schedule** page.
2. Select an aide from the list (Aide View).
3. Observe a task card in the grid.
4. **Expected**:
   - Task Title is visible.
   - Start and End times are visible (e.g., "09:00 - 09:30").
   - Category icon (Park/School/Groups/Person) is on the right, colored by category.
   - Classroom chip (Icon + Name) is visible if assigned.
   - Generic school icon if no classroom is assigned.

### 2. Daily Timeline View
1. Navigate to the **Home** or **Daily View** page.
2. Observe task cards in the horizontal rows for different aides.
3. **Expected**:
   - Same elements as the Aide Weekly View.
   - Elements scale or wrap if the slot is narrow.

### 3. Class Weekly View
1. Navigate to the **Schedule** page.
2. Change the view mode to **Class**.
3. Select a classroom.
4. Observe a task card in the grid.
5. **Expected**:
   - Task Title is visible.
   - Start and End times are visible.
   - **Assigned Aide Name** (e.g., "John Smith") is visible below the title.
   - If multiple aides are assigned to the same task, names are separated by commas.
   - Category icon is on the right.

## Troubleshooting
- If icons don't appear, check that the `TaskCard` is receiving the full `task` object including its `category` and `classroom`.
- If aide names are missing in Class View, check that the `aides` array is being passed correctly to `TimeSlottedColumn` and then to `TaskCard`.

