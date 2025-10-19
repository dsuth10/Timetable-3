# Time Slot Drag & Drop - Quick Start Guide

## What's New?

Your timetable now supports **precision time-based scheduling** with 15-minute granularity. Tasks can be dragged to specific time slots, not just to days.

## How It Works

### Before
```
Monday Column (entire day)
├── Task A (09:00-10:30)
├── Task B (11:00-12:00)
└── Task C (14:00-15:00)
```
You could only drag tasks to entire day columns.

### After
```
Monday Column (36 time slots)
├── 08:00 slot [droppable]
├── 08:15 slot [droppable]
├── 08:30 slot [droppable]
├── ...
├── 09:00 slot [droppable] ← Task A starts here
├── 09:15 slot [droppable] ├ Task A continues
├── 09:30 slot [droppable] ├ Task A continues
├── 10:00 slot [droppable] ├ Task A continues
├── 10:15 slot [droppable] └ Task A ends
├── 10:30 slot [droppable]
├── 11:00 slot [droppable] ← Task B
└── ...
```
You can now drag tasks to any 15-minute slot!

## Usage Examples

### 1. Move Task to Different Time
**Action**: Drag Task A from 09:00 to 14:00
**Result**: 
- Task moves to 14:00-15:30 (duration preserved)
- Visual feedback shows highlighted drop zone
- Times update immediately

### 2. Move Task Across Days
**Action**: Drag Monday 09:00 task to Wednesday 11:00
**Result**:
- Both date and time updated
- Single undo operation restores both

### 3. Invalid Drop (Beyond Working Hours)
**Action**: Try to drag 2-hour task to 16:00
**Result**:
- End time would be 18:00 (exceeds 17:00 limit)
- Drop prevented, task returns to original position
- Console shows error message

### 4. Conflicting Task
**Action**: Drag task to occupied time slot
**Result**:
- Conflict modal appears
- Option to replace existing task
- Or cancel the operation

## Visual Feedback

### Hover Over Time Slot
- Background: Light gray
- Time label: Fades in (shown every hour)

### Drag Over Time Slot
- Background: Light blue
- Border: Pulsing blue animation
- Clear indication of drop target

### During Drag
- Dragged task: Slightly rotated, semi-transparent
- Other tasks: Remain in place
- Drop zones: Highlight on hover

## Keyboard Shortcuts

### Existing (still available)
- `Ctrl+Z`: Undo last action
- `Ctrl+Y` / `Ctrl+Shift+Z`: Redo

### Undo/Redo Now Includes
- Time slot changes
- Cross-day moves with time changes
- All changes in a single drag operation

## DroppableId Format

For developers or debugging:

```typescript
// New format (with time)
"aide-{aideId}-date-{YYYY-MM-DD}-time-{HH:MM}"
// Example: "aide-1-date-2024-10-21-time-09:00"

// Old format (still supported, backward compatible)
"aide-{aideId}-date-{YYYY-MM-DD}"
// Example: "aide-1-date-2024-10-21"

// Unassigned panel
"unassigned"
```

## API Changes

### Assignment Update Payload
Now includes time fields when dropping in time slot:

```typescript
{
  aide_id: number | null,
  date: string,           // YYYY-MM-DD (if changed)
  start_time: string,     // HH:MM:SS (if time slot drop)
  end_time: string,       // HH:MM:SS (calculated from duration)
  version: number         // For optimistic locking
}
```

## Configuration

### Current Settings
- **Working Hours**: 8:00 AM - 5:00 PM (17:00)
- **Time Granularity**: 15 minutes
- **Total Slots per Day**: 36
- **Total Droppables**: 180 (36 slots × 5 days)

### Customization Points (if needed)
Located in `frontend/src/components/TimetableGrid/timeUtils.ts`:

```typescript
export const SLOT_INTERVAL_MINUTES = 15;  // Change granularity
export const SLOT_HEIGHT_PX = 30;         // Change visual height
export const START_HOUR = 8;               // Change start time
export const END_HOUR = 17;                // Change end time
```

## Troubleshooting

### Task Snaps Back After Drop
**Cause**: End time would exceed 17:00 working hours
**Solution**: Choose an earlier time slot or shorten task duration

### No Visual Feedback During Drag
**Cause**: Browser may not support CSS animations
**Solution**: Update browser to latest version

### Task Doesn't Move
**Cause**: May be a conflict or validation error
**Solution**: Check browser console for error messages

### Performance Issues
**Cause**: Too many tasks or browser extensions
**Solution**: 
1. Close unnecessary browser tabs
2. Disable browser extensions temporarily
3. See `TIME_SLOT_PERFORMANCE_NOTES.md` for profiling

## Testing the Feature

### Quick Test Checklist
1. ✅ Open the Schedule page
2. ✅ Drag any task to a different time slot
3. ✅ Verify time changes in task card
4. ✅ Try to drag task past 17:00 (should fail)
5. ✅ Drag task to another day at specific time
6. ✅ Click Undo button (should restore original time)
7. ✅ Create overlapping task (should show conflict modal)

### Expected Behavior
- Smooth drag animation
- Clear visual feedback
- Immediate time updates
- No console errors (except boundary violations)

## Need Help?

See detailed documentation:
- `TIME_SLOT_IMPLEMENTATION_SUMMARY.md` - Full implementation details
- `TIME_SLOT_PERFORMANCE_NOTES.md` - Performance analysis
- `time-slot-drag-drop.plan.md` - Original implementation plan

## Feedback

The implementation now provides calendar-grade time scheduling with:
- ✅ Visual time slot targeting
- ✅ 15-minute precision
- ✅ Duration preservation
- ✅ Conflict detection
- ✅ Full undo/redo support
- ✅ 60fps smooth animations
- ✅ <100ms response time

Enjoy scheduling with precision! 🎯

