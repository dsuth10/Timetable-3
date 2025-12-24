# Implementation Plan: Set Assignment Details Dialog in Daily View

**Branch**: `007-when-assigning-tasks` | **Date**: 2025-12-24 | **Spec**: `specs/007-when-assigning-tasks/spec.md`
**Input**: Feature specification from `/specs/007-when-assigning-tasks/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Success
2. Fill Technical Context
   → Project Type: web (frontend/src, backend/src detected)
   → Structure Decision: Option 2 (Web application)
3. Fill the Constitution Check section
   → Local-first, REST API, Drag-and-Drop priority confirmed.
4. Evaluate Constitution Check section
   → Pass
5. Execute Phase 0 → research.md
   → Success
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, AGENTS.md
   → Success
7. Re-evaluate Constitution Check section
   → Pass
8. Plan Phase 2 → Describe task generation approach
   → Success
9. STOP - Ready for /tasks command
```

## Summary
The goal is to bring functional parity to the Daily View by intercepting task drops and showing the "Set Assignment Details" dialog (`AssignmentDurationModal`). Currently, the Daily View assigns tasks immediately using default times. By leveraging the existing `useDragDrop` hook and updating it to handle Daily View's specific ID formats, we can ensure consistent behavior, including conflict detection, availability validation, and recurring task support.

## Technical Context
**Language/Version**: TypeScript 5.x, React 18, Python 3.12+  
**Primary Dependencies**: Material UI v5, Zustand, @hello-pangea/dnd, SQLAlchemy  
**Storage**: SQLite (backend/instance/timetable.db)  
**Testing**: pytest (backend), Vitest + React Testing Library (frontend)  
**Target Platform**: Desktop Browser (Local-first)
**Project Type**: web  
**Performance Goals**: <100ms UI response for drag interactions  
**Constraints**: Must work completely offline; 30-minute default increments for assignments  
**Scale/Scope**: ~25-30 aides, ~50 classrooms, ~100 tasks in bank.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Local-First | Does it work offline? | PASS |
| II. REST API | Are endpoints clean and documented? | PASS |
| III. Testing | Is coverage mandatory for this feature? | PASS |
| IV. DnD First | Is DnD the primary interaction? | PASS |
| V. Accessibility | Does it meet WCAG AA standards? | PASS |
| VI. Data Integrity | Is conflict prevention enforced? | PASS |

## Project Structure

### Documentation (this feature)
```
specs/007-when-assigning-tasks/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /tasks)
```

### Source Code (repository root)
```
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── TaskModals/  # AssignmentDurationModal.tsx
│   │   └── TimetableGrid/
│   ├── hooks/           # useDragDrop.tsx
│   ├── pages/           # DailyDisplayPage.tsx
│   └── services/
└── tests/
```

**Structure Decision**: Web application structure (Option 2) as the project has clear frontend/backend separation.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - Research compatibility of `useDragDrop` hook with `DailyDisplayPage` data structures.
   - Verify if `AssignmentDurationModal` requires any additional data (e.g., classroom list) not currently in `DailyDisplayPage`.

2. **Findings**:
   - `useDragDrop` hook is highly reusable but expects `droppableId` containing date.
   - `DailyDisplayPage` date is in the URL/state, not in individual slot IDs.
   - `AssignmentDurationModal` already handles aide selection and recurring logic.

**Output**: `research.md` with all research tasks resolved.

## Phase 1: Design & Contracts
1. **Entities** → `data-model.md`: No new database entities required; reuse `Assignment` and `Task`.
2. **API Contracts** → `/contracts/`: No new endpoints; leverage `POST /assignments` and `PUT /tasks/{id}`.
3. **Failing Tests**: Create Vitest mocks for DnD in `DailyDisplayPage`.
4. **Update agent file**: Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor`.

**Output**: data-model.md, contracts/assignment_assignment.yaml, quickstart.md, .cursorrules updated.

## Phase 2: Task Planning Approach
**Task Generation Strategy**:
- Update `useDragDrop.tsx` to handle flexible `droppableId` formats and optional `defaultDate`.
- Refactor `DailyDisplayPage.tsx` to use the standardized hook.
- Ensure `AideRow.tsx` uses consistent IDs.
- Implement frontend integration tests for the new workflow.

**Estimated Output**: 10-15 numbered, ordered tasks in `tasks.md`.

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All Clarifications resolved
- [ ] Complexity deviations documented (N/A)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
