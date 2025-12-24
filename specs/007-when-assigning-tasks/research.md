# Research: Set Assignment Details Dialog in Daily View

## 1. Component Analysis: AssignmentDurationModal
- **Location**: `frontend/src/components/TaskModals/AssignmentDurationModal.tsx`
- **Purpose**: A comprehensive dialog for setting assignment details (date, times, aide, recurrence).
- **Data Dependencies**: Requires a `Task` object, an array of `TeacherAide` objects, and `initialData` (aide, date, start/end times).
- **Confirmation Flow**: Calls `onConfirm` with a rich data object including recurrence rules.

## 2. Hook Analysis: useDragDrop
- **Location**: `frontend/src/hooks/useDragDrop.tsx`
- **Current Logic**:
    - Intercepts `onDragEnd`.
    - Parses `destDroppableId` for `aide-{id}-date-{date}-time-{HH:MM}`.
    - Manages `pendingAssignment` state.
    - Returns `ConflictUI` and `DurationModal` components.
- **Limitation**: Hardcoded ID format parsing assumes date is in the ID. Daily View currently uses `aide-{id}-slot-{time}`.

## 3. Page Analysis: DailyDisplayPage
- **Location**: `frontend/src/pages/DailyDisplayPage.tsx`
- **Current interaction**: Manually calls `assignTask` store method on drop.
- **Missing**: No conflict resolution, no time adjustment, no recurrence support.

## 4. Proposed Technical Solution
- **Update Hook**: Modify `useDragDrop` to accept a `defaultDate` option. If parsing the `droppableId` fails to find a date component, fallback to `defaultDate`.
- **Standardize IDs**: Ensure `AideRow` uses a format recognizable by the updated hook.
- **Integration**: Replace `DailyDisplayPage`'s custom DnD logic with the hook.

## 5. Rationale for Decision
- **Consistency**: Using the same hook and modal ensures the user experience is identical across all scheduling views.
- **Maintainability**: Centralizing the assignment logic in `useDragDrop` reduces code duplication and ensures bug fixes or enhancements (like recurrence) apply globally.
- **Safety**: Conflict detection and availability validation are "free" when using the existing hook.

## 6. Alternatives Considered
- **Custom Logic in DailyView**: Rejected as it would require duplicating complex logic for conflict detection and recurrence rules.
- **Direct Store Call**: Rejected as it bypasses the user confirmation step requested by the user.

