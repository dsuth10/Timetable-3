# Task Bank Drop Availability Fix - Detailed Analysis

## Problem Statement

When dragging a task from the **task bank** (unassigned task template) onto a time slot where the aide has partial availability, the system incorrectly rejects the drop before checking if the task can be snapped to the available portion of the time slot.

### Specific Scenario
- **Date**: January 28, 2026 (Wednesday)
- **Aide**: Dan Castellaneta (ID: 9)
- **Aide Availability**: 09:20 - 15:00 on Wednesdays
- **Target Slot**: `aide-9-slot-09:10` (09:10-09:40 time slot)
- **Expected Behavior**: Task should snap to 09:20-09:40 (available portion)
- **Actual Behavior**: Error shown "Cannot assign: Dan Castellaneta is only available 09:20-15:00 on WE"

## Root Cause Analysis

### Current Flow (Broken)

1. **User drops task template onto slot `aide-9-slot-09:10`**
   - DroppableId parsed: `destTime = "09:10"`, `destAideId = 9`, `destDate = "2026-01-28"`

2. **Validation runs FIRST** (lines 276-310 in `useDragDrop.tsx`)
   - Uses `destTime` (09:10) + `getDefaultDuration(09:10)` = 30 minutes
   - Checks availability from **09:10-09:40**
   - Validation fails: Dan is only available from 09:20
   - Error shown and function returns **BEFORE gap snapping**

3. **Gap snapping NEVER HAPPENS** because validation fails first

### Comparison: Moving Existing Assignment (Works)

1. **User moves existing assignment to same slot**
   - Same droppableId parsing

2. **Validation is SKIPPED** (line 283: only validates `isTaskTemplate || isTeacherAide`)
   - Assignments skip the early validation

3. **Gap snapping runs** (line 578 in assignment handler)
   - `getSnappedTimes()` correctly finds gap from **09:20-09:40**
   - Task successfully moves to available portion

4. **Backend validation occurs** when assignment is saved
   - Backend validates final times (09:20-09:40) ✓

### Why Gap Snapping Works

The `getSnappedTimes()` function (lines 103-139):
1. Calculates gaps using `calculateGaps()` which **already respects availability windows**
2. Finds gaps that overlap with the dropped slot
3. Returns the gap's start/end times if found
4. Falls back to slot time if no gap found

The `calculateGaps()` function (in `gapUtils.ts`):
- Lines 50-72: Shrinks grid intervals to fit within availability boundaries
- Line 62: `intervalStart = availStart` when availability starts later
- This ensures gaps only exist within the aide's availability window

So gap snapping **would work correctly** if it ran before validation.

## Technical Details

### Code Locations

**File**: `frontend/src/hooks/useDragDrop.tsx`

**Validation Section** (lines 276-310):
```typescript
if (availability.length > 0 && destTime) {
  const duration = getDefaultDuration(destTime);
  if (isTaskTemplate || isTeacherAide) {
    const endTime = addMinutesToTime(destTime, duration);
    const isAvailable = isAideAvailable(
      availability,
      destDate,
      destTime + ':00',  // ❌ Uses unsnapped slot time
      endTime + ':00'
    );
    if (!isAvailable) {
      // Shows error and returns
    }
  }
}
```

**Task Template Handler** (lines 444-489):
```typescript
if (isTaskTemplate) {
  // ...
  if (destTime && destDate && destAideId !== null) {
    // Gap snapping happens here (line 469)
    const snapped = getSnappedTimes(destAideId, destDate, destTime, defaultDuration);
    startTime = snapped.startTime;  // Would be 09:20:00
    endTime = snapped.endTime;      // Would be 09:40:00
  }
}
```

**Gap Snapping Function** (lines 103-139):
```typescript
const getSnappedTimes = useCallback((aideId, date, time, fallbackDuration) => {
  // ...
  const gaps = calculateGaps(..., aide.availability);
  const targetGap = gaps.find(g => {
    // Finds gap that overlaps with slot
    return gapStartMins < slotEndMins && gapEndMins > slotStartMins;
  });
  if (targetGap) {
    return {
      startTime: targetGap.start_time + ':00',  // 09:20:00
      endTime: targetGap.end_time + ':00'       // 09:40:00
    };
  }
  // Fallback to slot time if no gap found
});
```

## Solution Options

### Option 1: Perform Gap Snapping Before Validation (RECOMMENDED)

**Approach**: For task templates, do gap snapping first, then validate using the snapped times.

**Pros**:
- ✅ Maintains validation (good UX - immediate feedback)
- ✅ Validation uses correct times (snapped to gap)
- ✅ Consistent with how assignments work (they skip early validation)
- ✅ Minimal code changes

**Cons**:
- ⚠️ Slight performance cost (calculates gaps before validation)
- ⚠️ Need to ensure gap snapping doesn't fail silently

**Implementation**:
1. In task template handler (before line 463), call `getSnappedTimes()` first
2. Use snapped times for validation instead of raw `destTime`
3. If validation passes, proceed with modal

**Code Changes**:
```typescript
// In task template handler (around line 463)
if (destTime && destDate && destAideId !== null) {
  // Check for small gap first
  if (checkForSmallGap(destAideId, destDate, destTime)) return;

  // --- GAP SNAPPING FIRST ---
  const defaultDuration = getDefaultDuration(destTime);
  const snapped = getSnappedTimes(destAideId, destDate, destTime, defaultDuration);
  
  // Now validate using SNAPPED times (instead of slot time)
  const aide = aides.find(a => a.id === destAideId);
  if (aide && aide.availability && aide.availability.length > 0) {
    const isAvailable = isAideAvailable(
      aide.availability,
      destDate,
      snapped.startTime,  // ✅ Use snapped start time
      snapped.endTime     // ✅ Use snapped end time
    );
    
    if (!isAvailable) {
      // Show error (same as before)
      return;
    }
  }
  
  // If validation passes, use snapped times for modal
  startTime = snapped.startTime;
  endTime = snapped.endTime;
}
```

**Also need to remove/skip the early validation** (lines 276-310) for task templates, OR update it to use snapped times. Actually, easier to just skip early validation for task templates since we validate later with snapped times.

### Option 2: Skip Validation for Task Templates (Like Assignments)

**Approach**: Remove task templates from early validation check, let gap snapping + backend handle it.

**Pros**:
- ✅ Simpler code change
- ✅ Consistent with how assignments work
- ✅ Backend will still validate

**Cons**:
- ❌ No immediate feedback for truly invalid drops
- ❌ User might see error later in modal/backend

### Option 3: Move Validation to After Gap Snapping

**Approach**: Remove early validation entirely, validate after gap snapping for all types.

**Pros**:
- ✅ Always uses correct times for validation
- ✅ Single validation point

**Cons**:
- ❌ Larger refactoring
- ❌ May affect other drag types (teacher aides)

## Recommended Solution: Option 1

**Why**: 
- Provides best user experience (immediate feedback)
- Maintains existing validation logic
- Minimal code changes
- Respects the complex scheduling structure

## Implementation Plan

### Step 1: Move Gap Snapping Before Validation
- In task template handler, calculate snapped times first
- Remove task templates from early validation (lines 276-310)
- Add validation after gap snapping using snapped times

### Step 2: Test Cases
1. ✅ Task bank → slot with partial availability (09:10 slot, 09:20 availability start)
2. ✅ Task bank → slot fully within availability
3. ✅ Task bank → slot outside availability (should still error)
4. ✅ Existing assignment moves (should still work)
5. ✅ Teacher aide drops (should still work)

### Step 3: Edge Cases to Consider
- What if gap snapping finds no gap? (should fallback to slot time, validate that)
- What if snapped times don't fit default duration? (gap snapping respects duration)
- What if availability window is smaller than default duration? (should error appropriately)

## Files to Modify

1. **`frontend/src/hooks/useDragDrop.tsx`**
   - Lines 276-310: Remove task templates from early validation OR update to use snapped times
   - Lines 463-471: Move gap snapping before validation, validate with snapped times

## Testing Strategy

1. **Manual Testing**:
   - Test the specific scenario (Dan Castellaneta, Jan 28, 09:10 slot)
   - Verify task snaps to 09:20-09:40
   - Verify modal shows correct times

2. **Edge Case Testing**:
   - Slot before availability (should error)
   - Slot after availability (should error)
   - Slot spanning availability boundary (should snap correctly)

## Impact Assessment

**Risk Level**: LOW
- Isolated change to task template drop handling
- Doesn't affect assignment moves or teacher aide drops
- Backend validation remains as safety net

**User Impact**: POSITIVE
- Fixes frustrating UX issue
- Makes task bank drops work consistently with assignment moves
- Maintains all existing functionality
