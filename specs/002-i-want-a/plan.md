# Implementation Plan: Class-based Interface

**Branch**: `002-i-want-a` | **Date**: 2025-12-01 | **Spec**: `specs/002-i-want-a/spec.md`
**Input**: Feature specification from `specs/002-i-want-a/spec.md`

## Execution Flow (/plan command scope)
*Steps 1-7 completed.*

## Summary
The user wants a Class-based interface alongside the existing Teacher Aide interface. This involves:
1.  A toggle to switch views.
2.  A "Class Schedule" view showing allocations for a selected class.
3.  A "Class Drawer" to select the class.
4.  A "Teacher Aide List" side panel to drag TAs into the schedule.
5.  Logic to filter TAs by availability when a time slot is clicked.

## Technical Context
**Language/Version**: Python 3.12 (Backend), TypeScript 5+ (Frontend)
**Primary Dependencies**: Flask, React, Material-UI, @hello-pangea/dnd, Zustand
**Storage**: SQLite (local-first)
**Testing**: pytest (Backend), Vitest (Frontend)
**Target Platform**: Web (Desktop optimized)
**Project Type**: Web application (Frontend + Backend)
**Performance Goals**: Instant view switching, <100ms drag response
**Constraints**: Local-first, offline capable
**Scale/Scope**: ~20 classes, ~30 TAs

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Local-First**: YES. All data is local. Filtering is client-side.
- **REST API**: YES. Reusing existing `weeklyMatrix`, `tasks`, `assignments` endpoints.
- **Comprehensive Testing**: YES. Tasks will include component and integration tests.
- **Drag-and-Drop**: YES. Core interaction is D&D.
- **Accessibility**: YES. Standard MUI components.
- **Data Integrity**: YES. Using atomic operations where possible (or existing API patterns).

## Project Structure

### Documentation (this feature)
```
specs/002-i-want-a/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /tasks)
```

### Source Code (repository root)
```
frontend/src/
├── components/
│   ├── Layout/
│   │   ├── AideDrawer.tsx         # Existing (reference)
│   │   ├── ClassroomDrawer.tsx    # NEW: Drawer for selecting classes
│   │   └── SidePanel/             # NEW: Folder for side panels
│   │       ├── TaskBank.tsx       # Refactor of UnassignedPanel
│   │       └── TeacherAideList.tsx # NEW: List of TAs
│   ├── TimetableGrid/
│   │   ├── TimetableGrid.tsx      # Existing
│   │   └── ClassTimetableGrid.tsx # NEW: Schedule for Classes
├── services/
│   └── ... (Existing)
├── store/
│   ├── stores/
│   │   ├── uiStore.ts             # Update: Add view mode
```

**Structure Decision**: Web application (Frontend + Backend). Adding new components to `frontend/src/components` and updating state in `frontend/src/store`.

## Phase 0: Outline & Research
*Completed. See `research.md`.*

## Phase 1: Design & Contracts
*Completed. See `data-model.md` and `quickstart.md`.*

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- **Refactoring**:
  1.  Extract `UnassignedPanel` into a reusable `SidePanel` container or generic component to allow swapping content.
  2.  Refactor `AideDrawer` to share logic/styles with new `ClassroomDrawer`.
- **New Components**:
  1.  `ClassroomDrawer`: Copy/Adapt `AideDrawer`.
  2.  `TeacherAideListPanel`: New component to list TAs with drag support.
  3.  `ClassTimetableGrid`: Adapt `TimetableGrid` for Class-centric view.
- **State**:
  1.  Update `uiStore` to handle `viewMode`.
  2.  Update `App.tsx` (or main layout) to switch views.
- **Integration**:
  1.  Implement "Click slot to filter TAs" logic.
  2.  Implement "Drag TA to slot" logic (Create Task + Assignment).

**Ordering Strategy**:
1.  State & Layout (View Toggle).
2.  Classroom Drawer.
3.  Class Timetable Grid (Read-only first).
4.  Teacher Aide List Panel (Static).
5.  Interaction (Click to filter).
6.  Drag & Drop (Write).

**Estimated Output**: ~10-12 tasks.

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*
Phase 3: Tasks generated (/tasks)
Phase 4: Implementation
Phase 5: Validation

## Complexity Tracking
*None required.*

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [x] Phase 2: Task planning complete (approach defined)
- [ ] Phase 3: Tasks generated
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented
