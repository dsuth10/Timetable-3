# Implementation Plan: Add Action Buttons to Teacher Aide Cards

## Overview
Add three action buttons to the teacher aide cards in the **Daily Display page** (left sidebar). These are the cards that display teacher aide names under the "Staff" heading in the `DailyAideSidebar` component:
1. **Set Absence** - Mark the teacher aide as absent for a date (NEW - needs to be added)
2. **Edit Details** - Open the aide edit modal to modify details and availability (EXISTS - needs repositioning)
3. **View Schedule** - Navigate to the aide's weekly schedule view (EXISTS - needs repositioning)

**Note**: The name should be moved up slightly, and the three buttons should appear below the name.

## Current State Analysis

### Component Location
- **File**: `frontend/src/components/DailyAideSidebar.tsx`
- **Usage**: Used in `frontend/src/pages/DailyDisplayPage.tsx` (line 246)
- **Current Props**: `aides: AideWithStatus[]`, `date: string`, `onEditAide: (aide: TeacherAide) => void`

### Current Card Structure
The cards currently display (lines 47-120):
- **Top Section**: Avatar + Name + Details (horizontal layout)
- **Middle Section**: "Absent" Chip (if aide is absent)
- **Bottom Section**: Three buttons in a row:
  1. Edit Details button (Edit icon) ✅ EXISTS
  2. View Weekly Schedule button (Visibility icon) ✅ EXISTS
  3. Detailed Task Editor button (Book icon) ❌ DISABLED - needs to be replaced with "Set Absence"

### Existing Functionality (Reference Implementation)

1. **Set Absence** - NEEDS TO BE ADDED:
   - Reference: `AideDrawer.tsx` (line 76-83) shows how absence button works
   - Opens `AbsenceModal` component
   - Handler pattern: `onMarkAbsence(aideId: number)`
   - Icon: `EventBusy` from `@mui/icons-material`

2. **Edit Details** - EXISTS but needs repositioning:
   - Already implemented in `DailyAideSidebar.tsx` (lines 90-98)
   - Uses `onEditAide(aide)` prop handler
   - Opens `AideFormModal` component
   - Handler in `DailyDisplayPage.tsx`: `handleEditAide(aide)` (line 199)
   - Icon: `Edit` from `@mui/icons-material`

3. **View Schedule** - EXISTS but needs repositioning:
   - Already implemented in `DailyAideSidebar.tsx` (lines 100-108)
   - Uses `handleViewSchedule(aideId)` local function (lines 16-23)
   - Navigates to `/schedule?aideId=${aideId}&week=${weekParam}&view=AIDE`
   - Uses `startOfWeek` from `date-fns` to calculate week start
   - Icon: `Visibility` from `@mui/icons-material`

## Detailed Implementation Plan

### Phase 1: Update Component Props Interface

**File**: `frontend/src/components/DailyAideSidebar.tsx`

**Changes**:
1. Extend the `Props` type to include the absence handler:
   ```typescript
   type Props = {
       aides: AideWithStatus[];
       date: string;
       onEditAide: (aide: TeacherAide) => void;
       onMarkAbsence?: (aideId: number) => void; // NEW PROP
   };
   ```

2. Update component function signature to accept new prop:
   ```typescript
   export default function DailyAideSidebar({ 
       aides, 
       date, 
       onEditAide,
       onMarkAbsence // NEW PROP
   }: Props)
   ```

### Phase 2: Modify Card Layout Structure

**File**: `frontend/src/components/DailyAideSidebar.tsx`

**Current Structure** (lines 47-120):
```tsx
<Box
  sx={{
    p: 2,
    borderBottom: 1,
    borderColor: 'divider',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    ...
  }}
>
  {/* Top: Avatar + Name + Details */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Avatar ... />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle2" noWrap>
        {aide.name}
      </Typography>
      {aide.details && (
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {aide.details}
        </Typography>
      )}
    </Box>
  </Box>

  {/* Absent Chip (if applicable) */}
  {aide.is_absent && (
    <Chip label="Absent" color="error" size="small" sx={{ alignSelf: 'start' }} />
  )}

  {/* Buttons Row */}
  <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, mt: 0.5 }}>
    {/* Edit button */}
    {/* View Schedule button */}
    {/* Disabled Book button - needs to be replaced */}
  </Box>
</Box>
```

**New Structure** (Modified layout):
```tsx
<Box
  sx={{
    p: 2,
    borderBottom: 1,
    borderColor: 'divider',
    display: 'flex',
    flexDirection: 'column',
    gap: 0.75, // Reduced from 1 for tighter spacing
    ...
  }}
>
  {/* Top: Avatar + Name + Details - Name moved up slightly */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Avatar ... />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle2" noWrap sx={{ mb: 0.25 }}> {/* Added mb to move name up */}
        {aide.name}
      </Typography>
      {aide.details && (
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {aide.details}
        </Typography>
      )}
    </Box>
  </Box>

  {/* Buttons Row - moved up, positioned below name */}
  <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5, mt: 0.25, ml: 4.5 }}>
    {/* Button 1: Set Absence (NEW) */}
    {/* Button 2: Edit Details (EXISTS - keep) */}
    {/* Button 3: View Schedule (EXISTS - keep) */}
  </Box>

  {/* Absent Chip - moved below buttons */}
  {aide.is_absent && (
    <Chip label="Absent" color="error" size="small" sx={{ alignSelf: 'start', mt: 0.25 }} />
  )}
</Box>
```

**Key Layout Changes**:
- Add `mb: 0.25` to name Typography to move it up slightly
- Reduce main gap from `gap: 1` to `gap: 0.75` for tighter spacing
- Move buttons Box up (reduce `mt` from `0.5` to `0.25`)
- Add `ml: 4.5` to buttons Box to align with content (avatar + gap)
- Reduce button gap from `gap: 1` to `gap: 0.5` for tighter spacing
- Move "Absent" Chip below buttons instead of above
- Replace disabled Book button with Set Absence button

### Phase 3: Update Action Buttons

**File**: `frontend/src/components/DailyAideSidebar.tsx`

**Required Imports**:
- Add `EventBusy` icon import (currently missing)
- Keep existing `Edit` and `Visibility` imports

**Current Imports** (line 2):
```typescript
import { Edit, Visibility, Book } from '@mui/icons-material';
```

**Updated Imports**:
```typescript
import { Edit, Visibility, EventBusy as AbsenceIcon } from '@mui/icons-material';
// Remove Book import as it's being replaced
```

**Button Implementation** (replace lines 89-119):

**Current Buttons** (lines 89-119):
- Edit Details button (keep)
- View Schedule button (keep)
- Disabled Book button (REPLACE with Set Absence)

**Updated Button Row**:
```tsx
<Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5, mt: 0.25, ml: 4.5 }}>
  {/* Button 1: Set Absence (NEW - replaces disabled Book button) */}
  {onMarkAbsence && (
    <Tooltip title="Mark Absence">
      <IconButton
        size="small"
        onClick={() => onMarkAbsence(aide.id)}
        sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
      >
        <AbsenceIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )}

  {/* Button 2: Edit Details (EXISTS - keep existing) */}
  <Tooltip title="Edit Details & Availability">
    <IconButton
      size="small"
      onClick={() => onEditAide(aide)}
      sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
    >
      <Edit fontSize="small" />
    </IconButton>
  </Tooltip>

  {/* Button 3: View Schedule (EXISTS - keep existing) */}
  <Tooltip title="View Weekly Schedule">
    <IconButton
      size="small"
      onClick={() => handleViewSchedule(aide.id)}
      sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
    >
      <Visibility fontSize="small" />
    </IconButton>
  </Tooltip>
</Box>
```

**Changes**:
- Replace disabled Book button with Set Absence button (EventBusy icon)
- Reduce gap from `1` to `0.5` for tighter spacing
- Adjust margin top to `0.25` and add left margin `ml: 4.5` for alignment
- Remove `e.stopPropagation()` (not needed here - no drag-and-drop on these cards)
- Conditionally render Set Absence button only if `onMarkAbsence` prop is provided

**Important Notes**:
- Set Absence button is conditionally rendered based on `onMarkAbsence` prop existence
- All three buttons maintain consistent styling with existing buttons
- Button order: Set Absence (new), Edit Details (existing), View Schedule (existing)
- Icons use `fontSize="small"` for compact display
- Buttons don't need `e.stopPropagation()` as these cards don't have drag-and-drop

### Phase 4: Update DailyDisplayPage.tsx to Pass Handlers

**File**: `frontend/src/pages/DailyDisplayPage.tsx`

**Changes Required**:

1. **Add Imports** (if not already present):
```typescript
import AbsenceModal from '../components/AbsenceModal';
// Check if useAbsencesStore is already imported
import { useAbsencesStore } from '../store/stores/absences';
```

2. **Add State for Absence Modal** (add to existing state declarations, around line 54):
```typescript
const [showAbsenceModal, setShowAbsenceModal] = useState(false);
const [selectedAbsenceAideId, setSelectedAbsenceAideId] = useState<number | null>(null);
const [selectedAbsenceDate, setSelectedAbsenceDate] = useState<string | null>(null);
```

3. **Create Handler Function** (add after `handleEditAide`, around line 202):

```typescript
// Handler for marking aide absence from card
const handleMarkAbsence = useCallback((aideId: number) => {
  setSelectedAbsenceAideId(aideId);
  setSelectedAbsenceDate(dateParam); // Use current date from URL
  setShowAbsenceModal(true);
}, [dateParam]);

// Handler for absence created callback
const handleAbsenceCreated = useCallback((aideId: number) => {
  // Refresh daily data to show updated absence status
  fetchDailyData();
  setShowAbsenceModal(false);
  setSelectedAbsenceAideId(null);
  setSelectedAbsenceDate(null);
}, [fetchDailyData]);
```

4. **Update DailyAideSidebar Usage** (line 246):

**Current**:
```tsx
<DailyAideSidebar
  aides={data.aides}
  date={dateParam}
  onEditAide={handleEditAide}
/>
```

**New**:
```tsx
<DailyAideSidebar
  aides={data.aides}
  date={dateParam}
  onEditAide={handleEditAide}
  onMarkAbsence={handleMarkAbsence}
/>
```

5. **Add AbsenceModal Component** (add near other modals, around line 349):

```tsx
<AbsenceModal
  open={showAbsenceModal}
  aides={data?.aides || []}
  onClose={() => {
    setShowAbsenceModal(false);
    setSelectedAbsenceAideId(null);
    setSelectedAbsenceDate(null);
  }}
  onCreated={handleAbsenceCreated}
  initialAideId={selectedAbsenceAideId || undefined}
  initialDate={selectedAbsenceDate || undefined}
/>
```

### Phase 5: Verify Existing State Management

**File**: `frontend/src/pages/DailyDisplayPage.tsx`

**Current State** (already exists - lines 53-54):
```typescript
const [showAideModal, setShowAideModal] = useState(false);
const [editingAide, setEditingAide] = useState<any>(null);
```

**Current AideFormModal Usage** (lines 341-349):
```tsx
<AideFormModal
  open={showAideModal}
  aide={editingAide}
  onClose={() => {
    setShowAideModal(false);
    setEditingAide(null);
  }}
  onUpdated={handleAideUpdated}
/>
```

**No Changes Needed**:
- State management for aide editing already exists and works correctly
- `handleEditAide` function (line 199) already sets `editingAide` and opens modal
- `handleAideUpdated` function (line 204) already handles refresh and cleanup
- The existing implementation is correct and doesn't need modification

### Phase 6: Styling Refinements

**File**: `frontend/src/components/DailyAideSidebar.tsx`

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
   - [ ] Click "Set Absence" button opens AbsenceModal with correct aide and date pre-selected
   - [ ] Click "Edit Details" button opens AideFormModal with correct aide data
   - [ ] Click "View Schedule" button navigates to schedule page with correct aide and week
   - [ ] Buttons are properly positioned below the name
   - [ ] Name is moved up slightly as specified

2. **UI/UX Tests**:
   - [ ] Name is positioned correctly (moved up slightly)
   - [ ] Buttons are aligned properly below name
   - [ ] Buttons are appropriately sized and spaced
   - [ ] Tooltips appear correctly on hover
   - [ ] Cards maintain consistent appearance
   - [ ] Layout works with long aide names
   - [ ] Layout works with long details text

3. **Edge Cases**:
   - [ ] Works when `onMarkAbsence` prop is not provided (button should not render)
   - [ ] Handles missing aide data gracefully
   - [ ] Works when aide has no details text
   - [ ] Works when aide is absent (chip should still appear correctly)

4. **Integration Tests**:
   - [ ] Absence creation from card updates the schedule correctly
   - [ ] Aide edit from card updates the card display correctly
   - [ ] Navigation to schedule view shows correct aide and week
   - [ ] All modals close correctly after operations

## File Summary

### Files to Modify

1. **`frontend/src/components/DailyAideSidebar.tsx`**
   - Add `onMarkAbsence` prop to Props interface
   - Update component signature
   - Modify card layout structure (move name up, reposition buttons)
   - Replace disabled Book button with Set Absence button
   - Update imports (add EventBusy, remove Book)
   - Adjust spacing and alignment

2. **`frontend/src/pages/DailyDisplayPage.tsx`**
   - Add AbsenceModal import and related store imports
   - Add state for absence modal (`showAbsenceModal`, `selectedAbsenceAideId`, `selectedAbsenceDate`)
   - Create `handleMarkAbsence` handler function
   - Create `handleAbsenceCreated` callback
   - Update DailyAideSidebar usage with `onMarkAbsence` prop
   - Add AbsenceModal component to render tree

### Files to Reference (No Changes)

1. **`frontend/src/components/Layout/AideDrawer.tsx`** - Reference for absence button implementation (line 76-83)
2. **`frontend/src/components/AbsenceModal.tsx`** - Modal component for absence creation (needs to be imported and used)
3. **`frontend/src/components/AideFormModal.tsx`** - Modal component for aide editing (already in use)
4. **`frontend/src/pages/Schedule.tsx`** - Reference for how absence handling is done in Schedule page (lines 294-322)

## Implementation Order

1. **Start with Props and Handlers** (Phase 1, 4)
   - Update props interface in DailyAideSidebar
   - Create handlers in DailyDisplayPage.tsx
   - Pass props to DailyAideSidebar component

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

**Recommendation**: Use Option 1 (Incremental) for better control and easier troubleshooting. However, since most buttons already exist, this can be done more efficiently by:
1. First: Add Set Absence button and handler
2. Second: Adjust layout (move name up, reposition buttons)
3. Third: Test all functionality together

## Potential Issues and Solutions

### Issue 1: Button Alignment
**Problem**: Buttons might not align correctly with content
**Solution**: Use `ml: 4.5` to account for avatar width + gap, adjust as needed

### Issue 2: Card Height Inconsistency
**Problem**: Cards with buttons might be taller than expected
**Solution**: Set consistent `minHeight` on CardContent or use flexbox alignment

### Issue 3: Button Click Area
**Problem**: Small buttons might be hard to click
**Solution**: Ensure adequate padding (`p: 0.5`) and touch target size

### Issue 4: State Management for Edit
**Problem**: AideFormModal might not receive correct aide data
**Solution**: Verify state flow and ensure `aide` prop is passed correctly

### Issue 5: Date Format for Absence
**Problem**: Date parameter format might not match AbsenceModal expectations
**Solution**: Ensure `dateParam` is in YYYY-MM-DD format (already handled by DailyDisplayPage)

## Success Criteria

✅ All three buttons appear on each teacher aide card
✅ Name is positioned slightly higher than before
✅ Buttons are aligned below the name
✅ Each button performs its intended action correctly
✅ Buttons don't interfere with drag-and-drop
✅ UI is consistent with existing design patterns
✅ All edge cases are handled gracefully
✅ No console errors or warnings
