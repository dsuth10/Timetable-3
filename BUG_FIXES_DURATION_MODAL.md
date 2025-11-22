# Bug Fixes for Task Duration Modal

## Bug 1: Modal Dismissed Before Validation (CRITICAL)

### Issue
The `handleModalConfirm` function cleared the pending state (line 357) **before** performing validations (lines 360-407). This caused the modal to dismiss immediately, preventing users from correcting invalid inputs when:
- End time exceeded working hours (17:00)
- Aide was unavailable during selected time
- Aide had no availability set for the selected day

### Impact
- Poor user experience: Users had to restart the drag-drop operation to fix validation errors
- No feedback mechanism: Modal disappeared before user could see and fix the error
- Workflow interruption: Lost all entered data on validation failure

### Fix
Moved `setPendingAssignment(null)` to **after** all validations pass (new line 409), just before executing the operation.

**Before:**
```typescript
const { type, task, assignmentId, currentAssignment, sourceData } = pendingAssignment;

// Clear pending state
setPendingAssignment(null);  // ❌ Modal dismissed immediately

// Validate end time doesn't exceed working hours
if (timeToMinutes(data.endTime.slice(0, 5)) > END_HOUR * 60) {
  // User can't see this error in the modal!
  window.dispatchEvent(new CustomEvent('app:error', { 
    detail: { message: 'Cannot assign task: end time would exceed working hours (17:00)' } 
  }));
  return;
}
```

**After:**
```typescript
const { type, task, assignmentId, currentAssignment, sourceData } = pendingAssignment;

// Validate end time doesn't exceed working hours
if (timeToMinutes(data.endTime.slice(0, 5)) > END_HOUR * 60) {
  // ✅ Modal stays open, error shown, user can correct input
  window.dispatchEvent(new CustomEvent('app:error', { 
    detail: { message: 'Cannot assign task: end time would exceed working hours (17:00)' } 
  }));
  return;
}

// ... more validations ...

// All validations passed - now clear pending state to dismiss modal
setPendingAssignment(null);  // ✅ Only dismissed after validations pass
```

### Files Modified
- `frontend/src/hooks/useDragDrop.tsx` (line 357 moved to line 409)

---

## Bug 2: Incorrect Nullish Handling in Undo Operation (DATA CORRUPTION)

### Issue
The undo operation used logical OR (`||`) instead of nullish coalescing (`??`) when restoring aide ID and date values. This caused incorrect behavior when:
- Aide ID was `0` (a valid database ID)
- Date string was empty `""` (though less likely)

### Impact
- **Data corruption**: Undo would incorrectly unassign an assignment if the original aide had ID `0`
- **Lost assignments**: Instead of restoring to aide 0, the assignment would become unassigned
- **Inconsistent state**: Undo would not properly restore the original state

### Example Scenario
1. Assignment originally assigned to aide with ID `0`
2. User moves assignment to aide with ID `5`
3. User clicks Undo
4. **BUG**: Assignment becomes unassigned instead of returning to aide `0`
   - Because `0 || null` evaluates to `null` (0 is falsy)

### Fix
Replaced all instances of `||` with `??` (nullish coalescing operator) in:
1. Undo payload construction (lines 485-486, 489)
2. ID string generation (line 460)
3. Description string generation (line 461)

**Before:**
```typescript
const undoPayload: any = { 
  aide_id: sourceData?.aideId || null,  // ❌ Treats 0 as falsy
  date: sourceData?.date || currentAssignment.date,  // ❌ Treats "" as falsy
  start_time: currentAssignment.start_time,
  end_time: currentAssignment.end_time,
  status: sourceData?.aideId !== null ? 'ASSIGNED' : 'UNASSIGNED',  // ❌ Wrong check
  version: latestAssignment.version
};
```

**After:**
```typescript
const undoPayload: any = { 
  aide_id: sourceData?.aideId ?? null,  // ✅ Only replaces null/undefined
  date: sourceData?.date ?? currentAssignment.date,  // ✅ Only replaces null/undefined
  start_time: currentAssignment.start_time,
  end_time: currentAssignment.end_time,
  status: (sourceData?.aideId ?? null) !== null ? 'ASSIGNED' : 'UNASSIGNED',  // ✅ Correct check
  version: latestAssignment.version
};
```

### Additional Fixes
Also fixed the same pattern in string templates for operation IDs and descriptions:

**Line 460 - Operation ID:**
```typescript
// Before: id: `move-${assignmentId}-${sourceData?.aideId || 'unassigned'}-...`
// After:  id: `move-${assignmentId}-${sourceData?.aideId ?? 'unassigned'}-...`
```

**Line 461 - Operation Description:**
```typescript
// Before: description: `Move assignment ${assignmentId} from ${sourceData?.aideId || 'unassigned'} to ${data.aideId || 'unassigned'}...`
// After:  description: `Move assignment ${assignmentId} from ${sourceData?.aideId ?? 'unassigned'} to ${data.aideId ?? 'unassigned'}...`
```

### Files Modified
- `frontend/src/hooks/useDragDrop.tsx` (lines 460, 461, 485, 486, 489)

---

## Testing Recommendations

### For Bug 1:
1. Drag a task to a time slot that would end after 17:00
2. Confirm in modal - verify error message appears AND modal stays open
3. Correct the end time and confirm again - verify success

4. Drag a task to an aide during unavailable hours
5. Confirm in modal - verify error message appears AND modal stays open
6. Change to available hours or different aide - verify success

### For Bug 2:
1. Create aide with ID `0` (if database supports it)
2. Assign a task to aide 0
3. Move assignment to different aide
4. Click Undo
5. Verify assignment returns to aide 0 (not unassigned)

### General Testing:
- Test with aide IDs: 0, 1, 100, null
- Test validation errors don't dismiss modal
- Test successful operations do dismiss modal
- Test undo/redo cycles preserve correct aide IDs

---

## Summary

Both bugs have been fixed:
- ✅ **Bug 1**: Modal now stays open during validation failures
- ✅ **Bug 2**: Aide ID `0` and other falsy values now handled correctly
- ✅ All linter checks pass
- ✅ No breaking changes to existing functionality

These fixes improve data integrity and user experience significantly.

