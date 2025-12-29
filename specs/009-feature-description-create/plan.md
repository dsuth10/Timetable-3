
# Implementation Plan: Snap-to-Gap Drag and Drop Task Assignment

**Branch**: `009-feature-description-create` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-feature-description-create/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Success
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: Web (Frontend + Backend)
   → Structure Decision: Option 2 (Web application)
3. Fill the Constitution Check section based on the content of the constitution document.
   → Done
4. Evaluate Constitution Check section below
   → Pass: Align with D&D-first and comprehensive testing.
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → Identified Research: Dynamic gap calculation, dnd library hover logic.
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, AGENTS.md
7. Re-evaluate Constitution Check section
   → Pass
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach
9. STOP - Ready for /tasks command
```

## Summary
The "Snap-to-Gap" feature enhances the existing drag-and-drop timetable by automatically adjusting task times to perfectly fill empty spaces (at least 10 minutes wide) in an aide's schedule. It will provide visual feedback via aide-colored highlights and automatically open the edit dialog upon drop for confirmation.

## Technical Context
**Language/Version**: Python 3.12+, TypeScript (Strict Mode), React 18+  
**Primary Dependencies**: Flask, SQLAlchemy, Vite, Material-UI v5, Zustand, @hello-pangea/dnd  
**Storage**: SQLite (`backend/instance/timetable.db`)  
**Testing**: pytest (Backend), Vitest + React Testing Library (Frontend)  
**Target Platform**: Desktop, Offline-capable  
**Project Type**: Web application  
**Performance Goals**: Immediate visual feedback for drag operations, <200ms API response  
**Constraints**: WCAG AA accessibility, metric date/time, 10-minute minimum gap, grid line boundaries  
**Scale/Scope**: Timetable views (Daily Display, Teacher Aide Schedule)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Note |
|-----------|--------|-----------------|
| Local-First | ✅ | Uses local SQLite and frontend bundle. |
| REST API | ✅ | Uses existing REST patterns for assignment updates. |
| Comprehensive Testing | ✅ | Requires integration tests for snapping logic and collisions. |
| Drag-and-Drop First | ✅ | Core focus: improving the DnD experience. |
| Accessibility | ✅ | Highlights must maintain contrast; keyboard support required. |
| Data Integrity | ✅ | Conflict prevention and overlap checking. |

## Project Structure

### Documentation (this feature)
```
specs/009-feature-description-create/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
backend/
├── src/
│   ├── models/          # Assignment, Task
│   ├── services/        # Timetable services (gap calculation logic)
│   └── api/             # REST endpoints
└── tests/               # pytest suites

frontend/
├── src/
│   ├── components/      # Timetable, GapHighlight, TaskBank
│   ├── stores/          # Zustand stores for timetable state
│   └── services/        # API communication
└── tests/               # Vitest + RTL suites
```

**Structure Decision**: Option 2: Web application (Frontend + Backend).

## Phase 0: Outline & Research
1. **Research Task: Dynamic Gap Calculation**
   - How to efficiently identify gaps >= 10m across multiple intervals.
   - Respecting the specific grid lines provided in the spec.
2. **Research Task: @hello-pangea/dnd Hover Logic**
   - Best practices for rendering custom "ghost" blocks or highlights during drag.
   - Detecting cursor position relative to calculated gaps.
3. **Research Task: Edit Dialog Auto-Opening**
   - Pattern for triggering the existing MUI dialog immediately after a DnD drop.

**Output**: research.md

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Data Model Update**: No schema changes needed; reuse existing `Assignment` and `Task`.
2. **API Contracts**: Ensure `/assignments` endpoint handles non-standard 5-minute/10-minute increments correctly.
3. **Frontend Components**:
   - `GapCalculator`: Utility to find valid snap points.
   - `GapHighlight`: Overlay component for visual feedback.
   - Modified `onDragEnd` in Timetable components.

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, AGENTS.md

## Phase 2: Task Planning Approach
**Task Generation Strategy**:
- Create unit tests for the gap calculation logic (Backend/Utility).
- Implement the gap calculation service.
- Create frontend tests for the hover highlighting component.
- Implement the highlighting logic in the Timetable view.
- Update the drag-and-drop handler to implement the snapping logic.
- Implement the error handling for gaps < 10m.
- Add the auto-opening of the edit dialog.
- Perform end-to-end testing of the full workflow.

**Estimated Output**: ~20-25 tasks.

## Complexity Tracking
*No violations detected.*

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/tasks command)
- [x] Phase 3: Implementation complete
- [x] Phase 4: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented: N/A

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
