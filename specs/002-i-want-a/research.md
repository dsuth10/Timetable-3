# Phase 0: Research & Technical Approach

## Decisions

### 1. Interface Architecture: View Toggle & State
**Decision**: Implement a top-level "View Mode" state (Teacher Aide vs. Class) in `uiStore` or `App.tsx`.
**Rationale**: The user explicitly requested a "class based interface as well as a teach aide based interface". Switching modes will toggle the main content area and the side panels (Bottom Drawer, Right Panel).
**Implementation**:
- Add `viewMode: 'AIDE' | 'CLASS'` to `uiStore`.
- `App.tsx` renders `AideScheduleView` or `ClassScheduleView` based on this state.

### 2. Class Schedule View
**Decision**: Create a new `ClassScheduleView` component that reuses the logic of `TimetableGrid` but pivots the data.
**Rationale**: The schedule should look "essentially the same".
**Data Handling**:
- Fetch all assignments (using existing `assignmentsApi.weeklyMatrix`).
- Client-side filter: `assignments.filter(a => a.classroom_id === selectedClassId)`.
- Display logic: The `TimeSlottedColumn` will need to handle overlapping items (multiple TAs in the same slot). The existing `OverlapCalculator` should work, but visually it might need tweaking to stack TAs vertically within a slot.

### 3. Side Panels
**Decision**:
- **Bottom Drawer**: Reuse `AideDrawer` concept but for Classes (`ClassroomDrawer`). It will list classes.
- **Right Panel**: Create `TeacherAideListPanel`.
**Rationale**:
- **ClassroomDrawer**: Needs to allow selecting the "Active Class".
- **TeacherAideListPanel**: Replaces `UnassignedPanel` (Task Bank). It lists TAs.
- **Interaction**: Clicking a time slot in `ClassScheduleView` updates a `selectedTimeSlot` state. `TeacherAideListPanel` subscribes to this and filters the TA list to show only those available (no conflicting assignment, within working hours).

### 4. Data & Allocations
**Decision**: Treat "Class Allocation" as an `Assignment` linked to a `Task` that belongs to the Class.
**Rationale**: The backend data model links `Assignment -> Task -> Classroom`.
**Creation Flow**:
- When a TA is dropped onto a time slot:
  1. Create a "Class Support" Task for that Class + Time (via `tasksApi.createOneOff`).
  2. Create an Assignment linking the Task + TA (via `assignmentsApi.create`).
- This maintains data integrity without schema changes.

### 5. Drag and Drop
**Decision**: Use `@hello-pangea/dnd`.
**Rationale**: Already used in the project.
**Implementation**:
- `TeacherAideListPanel`: Draggables are `TeacherAideCard` items. Type: `TEACHER_AIDE`.
- `ClassScheduleView`: Droppables are time slots.
- `onDrop`: Handle `TEACHER_AIDE` type drops. Calculate time based on drop position. Trigger the creation flow.

## Alternatives Considered

### Alternative A: Backend-side "Available Aides" Endpoint
- **Idea**: `GET /aides/available?date=...&time=...`
- **Rejected**: The app is Local-First. We already have all aides and their schedules loaded. Client-side filtering is instant and works offline.

### Alternative B: "Allocations" Table
- **Idea**: Create a new table `class_allocations`.
- **Rejected**: Violates the principle of reusing existing entities (`Task`, `Assignment`). It would duplicate logic and make collision detection harder.

## Unresolved Questions (Clarifications)
- **Default Duration**: When clicking a slot or dragging, what is the default duration?
  - *Assumption*: Use the slot duration (e.g., 15 mins or 30 mins) or a default of 1 hour if not specified.
- **Unassigned Tasks**: Should the Class View show unassigned tasks?
  - *Assumption*: Yes, it's helpful. But the primary focus is Allocations.


























