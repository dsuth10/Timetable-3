# Quickstart: Testing Class-based Interface

## Prerequisites
1. Ensure the backend is running.
2. Ensure the frontend is running.
3. Have at least one **Classroom**, one **Teacher Aide**, and one **Task** in the system.

## Manual Test Steps

### 1. Switch to Class View
- Open the application.
- Look for the View Toggle (e.g., "Aides | Classes") in the top bar.
- Click "Classes".
- **Verify**: The interface changes. The bottom drawer shows Classrooms. The main area shows a schedule grid. The right panel shows "Teacher Aides".

### 2. Select a Class
- Click on a Classroom in the bottom drawer.
- **Verify**: The main schedule grid updates to show the schedule for the selected class. The header reflects the class name.

### 3. Check Availability Logic
- Click on an empty time slot in the schedule (e.g., Monday 09:00).
- **Verify**: The right panel updates the list of Teacher Aides. TAs who are already assigned at 09:00 should *not* appear (or appear disabled).

### 4. Drag and Drop Allocation
- Find a Teacher Aide in the right panel.
- Drag the TA card to the 09:00 slot on the schedule.
- Drop the card.
- **Verify**:
  - A new block appears on the schedule at 09:00.
  - The block shows the TA's name.
  - The right panel updates (the TA might disappear if they are now fully booked for that slot).

### 5. Multiple Allocations
- Drag *another* Teacher Aide to the *same* 09:00 slot.
- **Verify**:
  - A second block appears at 09:00.
  - Both blocks are visible (stacked or side-by-side).

### 6. Navigation
- Switch back to "Aides" view.
- **Verify**: You return to the Teacher Aide schedule.
- Switch back to "Classes" view.
- **Verify**: The previously selected class is still active (or resets gracefully).





