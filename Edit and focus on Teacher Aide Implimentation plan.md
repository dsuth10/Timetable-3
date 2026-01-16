# Implementation Plan: Add Action Buttons to Teacher Aide Cards

## Overview
Add three action buttons to the teacher aide cards in the `TeacherAideListPanel` component:
1. **Set Absence** - Mark the teacher aide as absent for a date
2. **Edit Details** - Open the aide edit modal to modify details and availability
3. **View Schedule** - Navigate to the aide's weekly schedule view

## Current State Analysis

### Component Location
- **File**: `frontend/src/components/Layout/SidePanel/TeacherAideListPanel.tsx`
- **Usage**: Used in `frontend/src/pages/Schedule.tsx` (line 714)
- **Current Props**: `assignmentsByAide: Record<string, Assignment[]>`

### Current Card Structure
The cards currently display:
- Drag indicator icon (left)
- Avatar with first letter of name
- Name (Typography, body2, fontWeight 600)
- Details/notes (Typography, caption, text.secondary)

### Existing Functionality (Reference Implementation)
The functionality already exists in other components:

1. **Set Absence** (`AideDrawer.tsx`):
   - Uses `onMarkAbsence(aideId)` handler
   - Opens `AbsenceModal` component
   - Handler in Schedule.tsx: `handleMarkAbsence(aideId: number)` (line 294)

2. **Edit Details** (`DailyAideSidebar.tsx`):
   - Uses `onEditAide(aide)` handler
   - Opens `AideFormModal` component
   - Handler in Schedule.tsx: `setShowAideFormModal(true)` and `setSelectedAide(aide)`

3. **View Schedule** (`DailyAideSidebar.tsx`):
   - Uses `handleViewSchedule(aideId)` function
   - Navigates to `/schedule?aideId=${aideId}&week=${weekParam}&view=AIDE`
   - Uses `startOfWeek` from `date-fns` to calculate week start

## Detailed Implementation Plan

### Phase 1: Update Component Props Interface

**File**: `frontend/src/components/Layout/SidePanel/TeacherAideListPanel.tsx`

**Changes**:
1. Extend the `Props` type to include:
   ```typescript
   type Props = {
     assignmentsByAide: Record<string, Assignment[]>;
     onMarkAbsence?: (aideId: number) => void;
     onEditAide?: (aide: TeacherAide) => void;
     onViewSchedule?: (aideId: number) => void;
     selectedWeekStartISO?: string; // For calculating week start in view schedule
   };
   ```

2. Update component function signature to accept new props:
   ```typescript
   export default function TeacherAideListPanel({ 
     assignmentsByAide = {},
     onMarkAbsence,
     onEditAide,
     onViewSchedule,
     selectedWeekStartISO
   }: Props)
   ```

### Phase 2: Modify Card Layout Structure

**File**: `frontend/src/components/Layout/SidePanel/TeacherAideListPanel.tsx`

**Current Structure** (lines 151-171):
```tsx
<CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
  <DragIndicator fontSize="small" color="action" />
  <Avatar ... />
  <Box>
    <Typography variant="body2" fontWeight={600}>
      {aide.name}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {aide.details || 'No details'}
    </Typography>
  </Box>
</CardContent>
```

**New Structure**:
```tsx
<CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
  {/* Top Row: Drag Indicator, Avatar, Name */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <DragIndicator fontSize="small" color="action" />
    <Avatar ... />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        {aide.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {aide.details || 'No details'}
      </Typography>
    </Box>
  </Box>
  
  {/* Bottom Row: Action Buttons */}
  <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5, mt: 0.5, ml: 4.5 }}>
    {/* Button 1: Set Absence */}
    {/* Button 2: Edit Details */}
    {/* Button 3: View Schedule */}
  </Box>
</CardContent>
```

**Key Layout Changes**:
- Change `CardContent` from `display: 'flex', alignItems: 'center'` to `display: 'flex', flexDirection: 'column'`
- Move name Typography up with `mb: 0.5` margin
- Add new button container Box with `ml: 4.5` to align with content (accounting for drag indicator + avatar + gap)
- Use `gap: 0.5` for tight button spacing

### Phase 3: Add Action Buttons

**File**: `frontend/src/components/Layout/SidePanel/TeacherAideListPanel.tsx`

**Required Imports**:
```typescript
import { 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { 
  EventBusy as AbsenceIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon 
} from '@mui/icons-material';
import type { TeacherAide } from '../../../types';
```

**Button Implementation** (inside the button container Box):

1. **Set Absence Button**:
```tsx
{onMarkAbsence && (
  <Tooltip title="Mark Absence">
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onMarkAbsence(aide.id);
      }}
      sx={{ 
        border: 1, 
        borderColor: 'divider', 
        borderRadius: 1,
        p: 0.5,
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.main'
        }
      }}
    >
      <AbsenceIcon fontSize="small" />
    </IconButton>
  </Tooltip>
)}
```

2. **Edit Details Button**:
```tsx
{onEditAide && (
  <Tooltip title="Edit Details & Availability">
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onEditAide(aide);
      }}
      sx={{ 
        border: 1, 
        borderColor: 'divider', 
        borderRadius: 1,
        p: 0.5,
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.main'
        }
      }}
    >
      <EditIcon fontSize="small" />
    </IconButton>
  </Tooltip>
)}
```

3. **View Schedule Button**:
```tsx
{onViewSchedule && (
  <Tooltip title="View Weekly Schedule">
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onViewSchedule(aide.id);
      }}
      sx={{ 
        border: 1, 
        borderColor: 'divider', 
        borderRadius: 1,
        p: 0.5,
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.main'
        }
      }}
    >
      <VisibilityIcon fontSize="small" />
    </IconButton>
  </Tooltip>
)}
```

**Important Notes**:
- All buttons use `e.stopPropagation()` to prevent triggering drag operations
- Buttons are conditionally rendered based on prop existence
- Consistent styling with `DailyAideSidebar` buttons for UI consistency
- Small size icons and padding for compact display

### Phase 4: Update Schedule.tsx to Pass Handlers

**File**: `frontend/src/pages/Schedule.tsx`

**Changes Required**:

1. **Add Import** (if not already present):
```typescript
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek } from 'date-fns';
```

2. **Add Navigation Hook** (inside Schedule component):
```typescript
const navigate = useNavigate();
```

3. **Create Handler Functions** (add after existing handlers, around line 303):

```typescript
// Handler for viewing aide schedule from card
const handleViewAideSchedule = useCallback((aideId: number) => {
  // Calculate start of the week for the current selected week
  const weekStart = startOfWeek(new Date(selectedWeekStartISO + 'T00:00:00'), { weekStartsOn: 1 });
  const weekParam = format(weekStart, 'yyyy-MM-dd');
  
  // Navigate to schedule with aide filter
  navigate(`/schedule?aideId=${aideId}&week=${weekParam}&view=AIDE`);
}, [selectedWeekStartISO, navigate]);

// Handler for editing aide from card
const handleEditAideFromCard = useCallback((aide: TeacherAide) => {
  setSelectedAideForEdit(aide); // Need to check if this state exists or create new
  setShowAideFormModal(true);
}, []);
```

**Note**: Check if `selectedAideForEdit` state exists. If not, we may need to use a different approach or add this state.

4. **Update TeacherAideListPanel Usage** (line 714):

**Current**:
```tsx
<TeacherAideListPanel assignmentsByAide={assignmentsByAide} />
```

**New**:
```tsx
<TeacherAideListPanel 
  assignmentsByAide={assignmentsByAide}
  onMarkAbsence={handleMarkAbsence}
  onEditAide={handleEditAideFromCard}
  onViewSchedule={handleViewAideSchedule}
  selectedWeekStartISO={selectedWeekStartISO}
/>
```

### Phase 5: Handle Aide Edit State Management

**File**: `frontend/src/pages/Schedule.tsx`

**Check Current State**:
- Review if there's a state for selected aide for editing
- If `AideFormModal` uses a prop like `aide` (similar to TaskEditModal), we need to ensure proper state

**Potential State Addition** (if needed):
```typescript
const [selectedAideForEdit, setSelectedAideForEdit] = useState<TeacherAide | null>(null);
```

**Update AideFormModal Usage** (find where it's rendered, likely around line 842):
```tsx
<AideFormModal
  open={showAideFormModal}
  onClose={() => {
    setShowAideFormModal(false);
    setSelectedAideForEdit(null); // Clear selection
  }}
  aide={selectedAideForEdit} // Pass selected aide
  onCreated={async (newAide) => {
    await fetchAides();
    setShowAideFormModal(false);
  }}
  onUpdated={async (updatedAide) => {
    await fetchAides();
    setShowAideFormModal(false);
    setSelectedAideForEdit(null);
  }}
/>
```

### Phase 6: Styling Refinements

**File**: `frontend/src/components/Layout/SidePanel/TeacherAideListPanel.tsx`

**Card Height Adjustment**:
- Cards may need slightly more height to accommodate buttons
- Ensure cards maintain consistent height
- Consider adding `minHeight` to CardContent if needed

**Button Styling Consistency**:
- Match button styling with `DailyAideSidebar` for consistency
- Ensure hover states are visible
- Consider adding active/pressed states if needed

**Responsive Considerations**:
- Ensure buttons remain accessible on smaller screens
- Consider tooltip positioning
- Test with long aide names to ensure layout doesn't break

### Phase 7: Testing Checklist

1. **Functionality Tests**:
   - [ ] Click "Set Absence" button opens AbsenceModal with correct aide pre-selected
   - [ ] Click "Edit Details" button opens AideFormModal with correct aide data
   - [ ] Click "View Schedule" button navigates to schedule page with correct aide and week
   - [ ] Buttons don't interfere with drag-and-drop functionality
   - [ ] Buttons work correctly when cards are filtered by search

2. **UI/UX Tests**:
   - [ ] Name is positioned correctly (moved up slightly)
   - [ ] Buttons are aligned properly below name
   - [ ] Buttons are appropriately sized and spaced
   - [ ] Tooltips appear correctly on hover
   - [ ] Cards maintain consistent appearance
   - [ ] Layout works with long aide names
   - [ ] Layout works with long details text

3. **Edge Cases**:
   - [ ] Works when `onMarkAbsence` prop is not provided
   - [ ] Works when `onEditAide` prop is not provided
   - [ ] Works when `onViewSchedule` prop is not provided
   - [ ] Works when `selectedWeekStartISO` is undefined
   - [ ] Handles missing aide data gracefully

4. **Integration Tests**:
   - [ ] Absence creation from card updates the schedule correctly
   - [ ] Aide edit from card updates the card display correctly
   - [ ] Navigation to schedule view shows correct aide and week
   - [ ] All modals close correctly after operations

## File Summary

### Files to Modify

1. **`frontend/src/components/Layout/SidePanel/TeacherAideListPanel.tsx`**
   - Add new props to Props interface
   - Update component signature
   - Modify CardContent layout structure
   - Add three action buttons with handlers
   - Add required imports

2. **`frontend/src/pages/Schedule.tsx`**
   - Add navigation hook
   - Create handler functions for card actions
   - Update TeacherAideListPanel usage with new props
   - Ensure proper state management for aide editing

### Files to Reference (No Changes)

1. **`frontend/src/components/Layout/AideDrawer.tsx`** - Reference for absence button implementation
2. **`frontend/src/components/DailyAideSidebar.tsx`** - Reference for all three button implementations
3. **`frontend/src/components/AbsenceModal.tsx`** - Modal component for absence creation
4. **`frontend/src/components/AideFormModal.tsx`** - Modal component for aide editing

## Implementation Order

1. **Start with Props and Handlers** (Phase 1, 4)
   - Update props interface
   - Create handlers in Schedule.tsx
   - Pass props to component

2. **Update Layout Structure** (Phase 2)
   - Modify CardContent layout
   - Adjust spacing and positioning

3. **Add Buttons** (Phase 3)
   - Implement each button one at a time
   - Test each button individually

4. **Refine and Test** (Phase 5, 6, 7)
   - Handle state management
   - Apply styling refinements
   - Comprehensive testing

## Recommended Approach

**Option 1: Incremental Implementation (Recommended)**
- Implement one button at a time
- Test each button before moving to the next
- Allows for easier debugging and validation

**Option 2: Complete Implementation**
- Implement all changes at once
- Faster but harder to debug if issues arise

**Recommendation**: Use Option 1 (Incremental) for better control and easier troubleshooting.

## Potential Issues and Solutions

### Issue 1: Drag-and-Drop Interference
**Problem**: Buttons might trigger drag operations
**Solution**: Use `e.stopPropagation()` on all button click handlers

### Issue 2: Card Height Inconsistency
**Problem**: Cards with buttons might be taller than expected
**Solution**: Set consistent `minHeight` on CardContent or use flexbox alignment

### Issue 3: Button Click Area
**Problem**: Small buttons might be hard to click
**Solution**: Ensure adequate padding (`p: 0.5`) and touch target size

### Issue 4: State Management for Edit
**Problem**: AideFormModal might not receive correct aide data
**Solution**: Verify state flow and ensure `aide` prop is passed correctly

### Issue 5: Week Calculation for View Schedule
**Problem**: Week start calculation might be incorrect
**Solution**: Use the same logic as `DailyAideSidebar` for consistency

## Success Criteria

✅ All three buttons appear on each teacher aide card
✅ Name is positioned slightly higher than before
✅ Buttons are aligned below the name
✅ Each button performs its intended action correctly
✅ Buttons don't interfere with drag-and-drop
✅ UI is consistent with existing design patterns
✅ All edge cases are handled gracefully
✅ No console errors or warnings
