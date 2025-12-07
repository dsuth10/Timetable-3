# Quickstart: Quick-Click Task Creation

This quickstart validates the Quick-Click Task Creation feature by walking through the complete user workflow.

## Prerequisites

1. Backend server running on `http://localhost:5000`
2. Frontend application running on `http://localhost:5173`
3. Database seeded with at least:
   - One teacher aide (e.g., "Alex Smith", id=1)
   - One classroom (e.g., "Class 3A", id=3)
4. Browser open to Schedule page viewing an aide's schedule

## Test Scenario: Quick Support Task Creation

This scenario validates **User Story 1** from the specification.

### Step 1: Navigate to Schedule View
1. Open frontend application
2. Navigate to Schedule page
3. Select a teacher aide from the aide selector (e.g., "Alex Smith")
4. Verify the weekly timetable grid is displayed with time slots

**Expected**: Timetable grid shows Monday-Friday columns with time slots (typically 30-minute increments)

### Step 2: Locate Time Slot with "+" Button
1. Find an empty 30-minute time slot (e.g., Monday 10:00-10:30)
2. Look for the "+" button in the top-right corner of the time slot cell
3. Verify button is visible but subtle (low opacity ~0.4)
4. Hover over the button to verify it becomes fully opaque

**Expected**: "+" button appears in top-right corner of every time slot cell, visible on hover

### Step 3: Click "+" Button to Open Modal
1. Click the "+" button in the selected time slot
2. Verify modal dialog opens

**Expected**: Modal opens with pre-filled context:
- Start Time: 10:00 (locked, cannot be changed)
- Duration: 30 minutes (pre-selected, matching slot length)
- Aide: Not shown in form (automatically set to currently-viewed aide)
- Classroom: Empty dropdown (requires manual selection)

### Step 4: Fill Out Task Details
1. Enter task title: "One-on-one reading with Emma"
2. Select category: "Individual Support" from dropdown
3. Select classroom: "Class 3A" from dropdown (optional but recommended)
4. Enter notes: "Focus on blending and digraphs" (optional)
5. Verify duration can be changed (try selecting 15, 45, or 60 minutes)
6. Verify start time is locked and cannot be changed

**Expected**: 
- Form accepts all inputs
- Duration dropdown shows 5-minute increment options (5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60)
- Start time field is disabled/read-only
- Category dropdown shows 4 options: Playground, Class Support, Group Support, Individual Support

### Step 5: Submit Form
1. Click "Create" button
2. Verify modal closes
3. Wait for API response (should be <500ms)

**Expected**: 
- Modal closes automatically on success
- No error messages displayed
- Loading state shown during request (if implemented)

### Step 6: Verify Task Created in Task Bank
1. Locate Task Bank sidebar/panel
2. Find the newly created task "One-on-one reading with Emma"
3. Verify task shows:
   - Title: "One-on-one reading with Emma"
   - Category: Individual Support (with appropriate color/icon)
   - No locked times displayed (task is reusable)
   - Classroom: Class 3A (if selected)

**Expected**: Task appears in Task Bank with no time constraints, ready to be dragged to other slots

### Step 7: Verify Assignment Created in Schedule
1. Return to timetable grid
2. Locate the clicked time slot (Monday 10:00-10:30)
3. Verify assignment block appears with:
   - Title: "One-on-one reading with Emma"
   - Color: Blue (for Individual Support category)
   - Time range: 10:00-10:30
   - Proper positioning in the time slot

**Expected**: Colored assignment block appears in the clicked time slot, matching the task details

### Step 8: Verify Task is Reusable
1. Locate the task "One-on-one reading with Emma" in Task Bank
2. Drag the task to a different time slot (e.g., Friday 10:00-10:30)
3. Verify new assignment is created for the dragged slot

**Expected**: Task can be dragged to other slots, creating new assignments with the same task template

### Step 9: Test Conflict Detection
1. Click "+" button in the same time slot (Monday 10:00-10:30) that now has an assignment
2. Fill out form with different task details
3. Submit form
4. Verify error message is displayed

**Expected**: 
- Error message: "Assignment conflicts with existing assignment"
- Modal remains open (does not close)
- Form data is preserved (user can retry after fixing conflict)

### Step 10: Test Different Slot Durations
1. Navigate to a time slot that is shorter than 30 minutes (if available, e.g., 15-minute slot)
2. Click "+" button
3. Verify default duration matches slot length (e.g., 15 minutes for 15-minute slot)
4. Create a task with this duration
5. Verify assignment is created with correct duration

**Expected**: 
- Default duration matches slot length for slots <30 minutes
- Default duration is 30 minutes for slots ≥30 minutes
- Assignment created with selected duration

## Test Scenario: Rapid Task Library Building

This scenario validates **User Story 2** from the specification.

### Step 1: Create Multiple Tasks Quickly
1. Navigate through the schedule slot-by-slot
2. For each slot, click "+" and create a task:
   - Monday 8:45-9:00: "Morning Check-in" (Playground, 15 min)
   - Monday 11:30-12:00: "Lunch Supervision" (Class Support, 30 min)
   - Monday 1:15-1:45: "Transition Support" (Group Support, 30 min)
3. After each creation, verify:
   - Task appears in Task Bank
   - Assignment appears in schedule

**Expected**: All tasks created successfully, all assignments visible in schedule

### Step 2: Verify Task Bank Contains All Tasks
1. Open Task Bank sidebar
2. Verify all created tasks are listed:
   - "Morning Check-in"
   - "Lunch Supervision"
   - "Transition Support"
   - "One-on-one reading with Emma" (from previous scenario)
3. Verify tasks show no locked times

**Expected**: All tasks in Task Bank are reusable with no time constraints

### Step 3: Reuse Existing Task
1. Navigate to Tuesday 8:45-9:00 (same time as Monday's "Morning Check-in")
2. Click "+" button
3. Notice "Morning Check-in" is already in Task Bank
4. Option A: Cancel modal and drag existing task from Task Bank
5. Option B: Create variant task if needed

**Expected**: User can choose to reuse existing task or create variant

## Validation Checklist

- [ ] "+" button appears on all time slots (empty and occupied)
- [ ] Button is subtle (low opacity) but discoverable
- [ ] Modal opens with correct pre-filled context
- [ ] Start time is locked to clicked slot
- [ ] Duration defaults correctly (30 min for ≥30 min slots, slot length for <30 min)
- [ ] Duration dropdown shows 5-minute increment options
- [ ] Classroom field is empty by default
- [ ] Form validation works (required fields, category selection)
- [ ] Task and assignment created atomically (both succeed or both fail)
- [ ] Task appears in Task Bank with no locked times
- [ ] Assignment appears in schedule at correct time slot
- [ ] Conflict detection prevents overlapping assignments
- [ ] Error messages are clear and actionable
- [ ] Created tasks are reusable (can be dragged to other slots)
- [ ] UI updates immediately after creation (optimistic updates)

## API Validation

### Verify API Endpoint
1. Open browser developer tools → Network tab
2. Perform quick-click creation
3. Verify API call: `POST /api/quick-create-task`
4. Verify request payload contains all required fields
5. Verify response status: `201 Created`
6. Verify response contains both `task` and `assignment` objects

**Expected**: 
- Single API call creates both task and assignment
- Response includes complete task and assignment data
- No additional API calls required

### Verify Error Handling
1. Attempt to create task with missing title → Verify 400 error
2. Attempt to create task with invalid category → Verify 400 error
3. Attempt to create overlapping assignment → Verify 409 error with conflict details
4. Attempt to create task with invalid aide_id → Verify 404 error

**Expected**: All error cases return appropriate status codes and error messages

## Success Criteria

✅ **Feature is complete when**:
1. All steps above pass without errors
2. Task and assignment are created atomically
3. UI updates immediately after creation
4. Conflict detection prevents scheduling conflicts
5. Created tasks are fully reusable
6. All validation rules are enforced
7. Error messages are clear and helpful
8. Feature works for all slot durations (15, 30, 45, 60 minutes)
9. Feature integrates seamlessly with existing drag-and-drop workflow

## Notes

- This quickstart assumes backend and frontend are running locally
- Database should be in a clean state or conflicts may occur
- Some steps may vary based on UI implementation details
- Accessibility testing (keyboard navigation, screen readers) should be performed separately
