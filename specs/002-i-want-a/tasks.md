# Tasks: Class-based Interface

**Spec**: `specs/002-i-want-a/spec.md`
**Plan**: `specs/002-i-want-a/plan.md`

## Setup & State
- [x] **T001**: Update `uiStore.ts` to include `viewMode` state.
  - Action: Add `viewMode: 'AIDE' | 'CLASS'`, `selectedClassId`, and `setViewMode` actions.
  - File: `frontend/src/store/stores/uiStore.ts`
  - Note: Default to `'AIDE'` to preserve existing behavior.

- [x] **T002**: Implement View Toggle in Top Navigation.
  - Action: Add a toggle button group (MUI ToggleButton) to `AppBar.tsx` or main layout to switch `viewMode`.
  - File: `frontend/src/components/Layout/AppBar.tsx`
  - Dependency: T001

## Core Components [P]
- [x] **T003**: Create `ClassroomDrawer` component. [P]
  - Action: Duplicate/Adapt `AideDrawer` to list Classrooms.
  - Logic: Fetch classrooms from `classroomsStore`. On click, set `selectedClassId` in `uiStore`.
  - File: `frontend/src/components/Layout/ClassroomDrawer.tsx`

- [x] **T004**: Create `TeacherAideListPanel` component. [P]
  - Action: Create a new side panel component that lists Teacher Aides.
  - Logic: Fetch aides from `aidesStore`. Render draggable items (`Draggable` from `@hello-pangea/dnd`) with type `TEACHER_AIDE`.
  - File: `frontend/src/components/Layout/SidePanel/TeacherAideListPanel.tsx`

- [x] **T005**: Refactor `UnassignedPanel` to be generic or swappable. [P]
  - Action: Rename/Move `UnassignedPanel` to `components/Layout/SidePanel/TaskBank.tsx`.
  - Update usages in `ManagementPanel.tsx` or `App.tsx` to render conditionally based on `viewMode`.
  - File: `frontend/src/components/Layout/SidePanel/TaskBank.tsx`

## Schedule View
- [x] **T006**: Create `ClassTimetableGrid` component.
  - Action: Create a version of `TimetableGrid` optimized for Classes.
  - Logic:
    - Accept `selectedClassId`.
    - Filter `assignments` where `assignment.task.classroom_id === selectedClassId`.
    - Pass filtered assignments to `TimeSlottedColumn`.
  - File: `frontend/src/components/TimetableGrid/ClassTimetableGrid.tsx`
  - Note: Reuse `TimeSlottedColumn` if possible, or extend it to support stacking TAs.

- [x] **T007**: Update Main Layout to Switch Views.
  - Action: In `App.tsx` (or `Schedule.tsx`), conditionally render:
    - If `viewMode === 'AIDE'`: `AideDrawer` + `TimetableGrid` + `TaskBank`.
    - If `viewMode === 'CLASS'`: `ClassroomDrawer` + `ClassTimetableGrid` + `TeacherAideListPanel`.
  - File: `frontend/src/pages/Schedule.tsx`
  - Dependency: T001, T003, T004, T006

## Logic & Integration
- [x] **T008**: Implement Availability Filtering.
  - Action: Add `selectedTimeSlot` to `uiStore` (date, time, duration).
  - In `ClassTimetableGrid`, on slot click -> set `selectedTimeSlot`.
  - In `TeacherAideListPanel`, subscribe to `selectedTimeSlot` and filter the list (exclude TAs assigned at that time).
  - Files: `frontend/src/store/stores/uiStore.ts`, `frontend/src/components/TimetableGrid/ClassTimetableGrid.tsx`, `frontend/src/components/Layout/SidePanel/TeacherAideListPanel.tsx`
  - Dependency: T007

- [x] **T009**: Implement Drag-and-Drop Allocation Logic.
  - Action: In `DragDropContext` (or main handler), handle `onDrop` for type `TEACHER_AIDE`.
  - Logic:
    - Source: `TeacherAideListPanel` (aideId).
    - Destination: `ClassTimetableGrid` slot (date, time).
    - Action:
      1. `tasksApi.createOneOff({ title: 'Class Support', category: 'CLASS_SUPPORT', ... })`
      2. `assignmentsApi.create({ task_id, aide_id, ... })`
      3. Refresh data.
  - File: `frontend/src/hooks/useDragDrop.tsx` (or wherever `onDragEnd` is defined).
  - Dependency: T008

## Polish & Testing [P]
- [x] **T010**: Add Unit Tests for Filtering Logic. [P]
  - Action: Test the "Available Aides" filter function.
  - File: `frontend/src/utils/availability.test.ts`

- [x] **T011**: Manual Validation / Quickstart Run. [P]
  - Action: Execute steps in `quickstart.md`.
  - Verify view toggling, data display, and drag-and-drop persistence.
