# Task Duration Popup Implementation Summary

## Overview
This feature adds an interactive duration selection popup that appears when dragging tasks from the task bank or moving existing assignments in the schedule. Users can now specify exact start time, end time, date, and aide before creating or updating assignments.

## Changes Made

### 1. New Component: AssignmentDurationModal
**File:** `frontend/src/components/TaskModals/AssignmentDurationModal.tsx`

A comprehensive modal dialog that provides:
- **Date Picker**: Allows selecting the assignment date (pre-filled from drop location)
- **Time Pickers**: Start and end time selection with 15-minute intervals
  - Start time defaults to the drop location time
  - End time defaults to start + 30 minutes
  - Auto-adjusts end time if it becomes invalid when start time changes
- **Aide Selector**: Dropdown to select or change the assigned aide
- **Task Information Display**: Shows task title, category, and classroom (read-only)
- **Duration Display**: Shows calculated duration in a friendly format (e.g., "1 hour 30 minutes")
- **Validation**:
  - End time must be after start time
  - Times must be within working hours (8:00 - 17:00)
  - Clear error messages for validation failures
- **Actions**:
  - Cancel: Dismisses modal without creating/updating assignment
  - Confirm: Proceeds with assignment creation/update

### 2. Modified: useDragDrop Hook
**File:** `frontend/src/hooks/useDragDrop.tsx`

Major changes:
- **New State**: Added `pendingAssignment` state to hold data while modal is open
- **Intercepted Task Template Drops**: When dragging from task bank:
  - Calculates default start time (drop location) and end time (start + 30 min)
  - Shows modal instead of immediately creating assignment
  - Ignores task template times (always defaults to 30 minutes)
- **Intercepted Assignment Updates**: When dragging existing assignments:
  - Calculates new times based on drop location (30-minute default)
  - Shows modal for confirmation/editing
  - Allows changing aide, date, and times
- **New Handler**: `handleModalConfirm` processes modal confirmations:
  - Validates availability (existing logic preserved)
  - Creates or updates assignment with undo/redo support
  - Handles conflicts (shows existing ConflictModal)
- **Updated Return**: Now returns `{ onDragEnd, ConflictUI, DurationModal }`

### 3. Modified: Schedule Page
**File:** `frontend/src/pages/Schedule.tsx`

Minimal integration changes:
- Destructured `DurationModal` from `useDragDrop` hook
- Rendered `DurationModal` alongside `ConflictUI`

## Key Design Decisions

1. **Default Duration**: Always 30 minutes (ignores task template times for consistency)
2. **All Fields Editable**: Users can change aide, date, start time, and end time
3. **Cancel Behavior**: No assignment created/updated if user cancels
4. **Validation Timing**: 
   - Basic checks before showing modal (prevents obviously invalid drops)
   - Full validation when user confirms in modal
5. **Visual Updates**: Cards resize/reposition after modal confirms (not during editing)
6. **Delete Operations**: Dropping to unassigned panel bypasses modal (immediate delete)

## User Experience Flow

### Creating New Assignment (Task Bank → Schedule):
1. User drags task from task bank
2. User drops task on schedule at specific time slot
3. Modal appears with:
   - Start time: drop location time
   - End time: drop location time + 30 minutes
   - Date: drop location date
   - Aide: drop location aide
4. User can edit any field
5. User clicks "Confirm Assignment" → assignment created
6. Or user clicks "Cancel" → no assignment created

### Moving Existing Assignment:
1. User drags existing assignment
2. User drops at new location
3. Modal appears with:
   - Start time: new location time (or preserves if no time slot)
   - End time: new location time + 30 minutes
   - Date: new location date
   - Aide: new location aide
4. User can edit any field
5. User clicks "Confirm Assignment" → assignment updated
6. Or user clicks "Cancel" → assignment stays in original location

## Validation Rules

1. **End time must be after start time**
2. **Start time must be between 8:00 and 17:00**
3. **End time cannot exceed 17:00**
4. **Aide must be available during selected time** (if aide is assigned)
5. **Duration is automatically calculated and displayed**

## Error Handling

- Clear error messages displayed in modal
- Availability conflicts detected before and after modal
- Conflict resolution modal appears after duration modal (if needed)
- Working hours violations caught with descriptive errors

## Technical Notes

- Uses Material-UI `@mui/x-date-pickers` for date/time selection
- Leverages existing time utility functions from `timeUtils.ts`
- Maintains undo/redo support through existing `useUndoStore`
- Preserves conflict detection and resolution flow
- No breaking changes to existing functionality

## Files Modified

1. **Created**: `frontend/src/components/TaskModals/AssignmentDurationModal.tsx` (352 lines)
2. **Modified**: `frontend/src/hooks/useDragDrop.tsx` (significant refactor)
3. **Modified**: `frontend/src/pages/Schedule.tsx` (minor integration)

## Testing Recommendations

1. **Task Bank to Schedule**: Drag tasks to various time slots
2. **Edit Times**: Change start/end times in modal
3. **Edit Date**: Change assignment date in modal
4. **Edit Aide**: Change aide in modal
5. **Validation**: Try invalid times (end before start, outside working hours)
6. **Availability**: Test with aides that have limited availability
7. **Cancel**: Verify canceling doesn't create assignments
8. **Existing Assignments**: Move existing assignments between slots
9. **Delete**: Drag assignments back to unassigned panel
10. **Undo/Redo**: Test undo/redo after creating/updating assignments

## Future Enhancements

- Remember user's last duration preference
- Quick presets (15 min, 30 min, 1 hour buttons)
- Show aide availability directly in modal
- Keyboard shortcuts for common durations
- Recurring assignment creation from modal

