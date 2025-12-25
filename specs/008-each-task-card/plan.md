# Implementation Plan: Task Card Enhancements

**Branch**: `008-each-task-card` | **Date**: 2025-12-25 | **Spec**: [specs/008-each-task-card/spec.md]

## Summary
Enhance the visual display of task cards across Aide, Daily, and Class views. Task cards will now show titles, times, classroom badges (with names), and category-specific icons on the right side. Class view will specifically include the names of assigned aides.

## Technical Context
**Language/Version**: Python 3.12, TypeScript, React 18+  
**Primary Dependencies**: Flask, SQLAlchemy, Material-UI v5, Zustand, @hello-pangea/dnd  
**Storage**: SQLite  
**Testing**: pytest, Vitest + RTL  
**Target Platform**: Desktop (single-user local server)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Responsive UI with smooth drag-and-drop  
**Constraints**: Local-first, REST API, MUI v5 components  
**Scale/Scope**: Display enhancement across 3 main timetable views

## Constitution Check
- [x] Local-First Architecture: PASS (Frontend only changes)
- [x] REST API Contract: PASS (No API changes needed)
- [x] Comprehensive Testing: PASS (Planned for Vitest/RTL)
- [x] Drag-and-Drop First: PASS (Ensuring TaskCard remains draggable)
- [x] Accessibility: PASS (Using MUI icons and accessible colors)
- [x] Data Integrity: PASS (No schema changes)

## Project Structure

### Documentation (this feature)
```
specs/008-each-task-card/
├── spec.md              # Feature Specification
├── plan.md              # This file
├── research.md          # Iconography and layout decisions
├── data-model.md        # Mapping existing entities
├── quickstart.md        # Verification steps
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)
```
frontend/
├── src/
│   ├── components/
│   │   ├── TimetableGrid/
│   │   │   ├── TaskCard.tsx        # Main component to update
│   │   │   ├── TimeSlottedColumn.tsx # Prop drilling for aide names
│   │   ├── AideRow.tsx             # Daily view row component
│   │   ├── TimetableGrid/
│   │   │   └── ClassTimetableGrid.tsx # Class view container
```

**Structure Decision**: Web application (frontend focus for this feature).

## Phase 0: Outline & Research
Completed. See `research.md`.

## Phase 1: Design & Contracts
Completed.
- `data-model.md`: Documented existing entities.
- No new API contracts required.
- `quickstart.md`: Documented verification steps.

## Phase 2: Task Planning Approach
**Task Generation Strategy**:
- Update `TaskCard` to support "Class Mode" vs "Aide Mode".
- Implement category icon mapping.
- Implement classroom badge with name.
- Update `TimeSlottedColumn` and `AideRow` to pass required data to `TaskCard`.
- Add Vitest tests for `TaskCard` in different modes and sizes.

**Ordering Strategy**:
- 1. Update `TaskCard` component logic and styling.
- 2. Update parent components to provide missing data (aide names, etc.).
- 3. Add tests to verify all display requirements.

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [x] Phase 2: Task planning complete (approach described)
- [x] Phase 3: Tasks generated
- [x] Phase 4: Implementation complete
- [x] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| No Contract/Model Tasks | This is a pure UI display enhancement using existing stable API fields. | Adding dummy contracts would create unnecessary maintenance overhead. |

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
