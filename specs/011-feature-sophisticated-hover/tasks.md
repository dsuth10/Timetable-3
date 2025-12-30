# Tasks: Sophisticated Hover Tooltip

**Input**: Design documents from `/specs/011-feature-sophisticated-hover/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Success
2. Load optional design documents:
   → data-model.md: Success
   → contracts/: Success
   → research.md: Success
3. Generate tasks by category:
   → Setup: project init, types
   → Tests: contract tests, component tests
   → Core: service logic, API endpoints, UI components
   → Integration: component linking
   → Polish: verification
4. Apply task rules:
   → [P] for parallel (different files)
   → TDD: Tests before implementation
5. Number tasks sequentially (T001, T002...)
6. Return: SUCCESS (tasks ready for execution)
```

## Phase 3.1: Setup
- [X] T001 Define `TooltipData` interface and update related types in `frontend/src/types/index.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [X] T002 [P] Contract test for `GET /api/assignments/{id}/tooltip` in `backend/tests/contract/test_tooltip_get.py`
- [X] T003 [P] Component tests for `TaskTooltip` (hover behavior, mobile long-press, empty states, recurrence list) in `frontend/tests/components/TaskTooltip.test.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [X] T004 Implement `get_tooltip_data` logic in `backend/api/services/assignment_service.py` (aggregate task title, classroom, aides, recurrence, and notes)
- [X] T005 Implement `GET /api/assignments/{id}/tooltip` route in `backend/api/routes/assignments.py`
- [X] T006 Create `TooltipDataFetcher` component for lazy-loading tooltip content in `frontend/src/components/common/TooltipDataFetcher.tsx`
- [X] T007 Create `TaskTooltip` component using MUI `Tooltip` and `TooltipDataFetcher` in `frontend/src/components/TimetableGrid/TaskTooltip.tsx`
- [X] T008 Integrate `TaskTooltip` into `TaskCard.tsx` with 1-second delay in `frontend/src/components/TimetableGrid/TaskCard.tsx`

## Phase 3.4: Polish & Integration
- [X] T009 [P] Verify performance: Ensure tooltip data fetch latency is < 200ms
- [X] T010 [P] Execute verification steps in `specs/011-feature-sophisticated-hover/quickstart.md`
- [X] T011 Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor` to update project state
- [X] T012 [P] Unit tests for `get_tooltip_data` service logic in `backend/tests/unit/test_assignment_service.py`
- [X] T013 [P] Accessibility verification: Ensure tooltip meets WCAG AA (ARIA labels, keyboard navigation)

## Dependencies
- T001 (Types) blocks T003 (Frontend tests) and T007 (Frontend implementation)
- T002 (Contract test) blocks T004 (Service) and T005 (Route)
- T004 (Service) blocks T005 (Route) and T012 (Unit tests)
- T005 (Backend endpoint) blocks T006 (Frontend fetcher)
- T006 (Fetcher) blocks T007 (Tooltip UI)
- T007 (Tooltip UI) blocks T008 (Integration) and T013 (Accessibility)
- All implementation tasks (T004-T008) block T009-T011

## Parallel Example
```
# Setup and initial tests:
Task: "Define TooltipData interface in frontend/src/types/index.ts"
Task: "Contract test for GET /api/assignments/{id}/tooltip in backend/tests/contract/test_tooltip_get.py"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Use MUI `Tooltip` `enterDelay={1000}` for the 1-second requirement
- Handle long-press for mobile via MUI Tooltip's default touch behavior

