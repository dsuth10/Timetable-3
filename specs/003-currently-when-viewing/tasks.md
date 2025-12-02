+
# Tasks: Interactive Task Selection on Aide Assignment

**Branch**: `003-currently-when-viewing` | **Date**: 2025-12-02 | **Plan**: [specs/003-currently-when-viewing/plan.md](specs/003-currently-when-viewing/plan.md)

## Phase 3.1: Setup & Tests (TDD)
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T001 [P] Create contract tests for Task filtering and Creation in `backend/tests/contract/test_task_selection_flow.py`. (Uses code from plan.md Phase 1)
- [x] T002 [P] Create frontend contract types and API service stubs in `frontend/src/types/contracts.ts` and `frontend/src/services/taskService.ts`.
- [x] T003 [P] Create stub for `TaskSelectionModal` component in `frontend/src/components/Modals/TaskSelectionModal.tsx`.

## Phase 3.2: Backend Implementation
- [x] T004 Modify `GET /api/tasks` endpoint in `backend/api/routes/tasks.py` to support `classroom_id` query parameter filtering. (Already implemented)
- [x] T005 Verify `POST /api/tasks` in `backend/api/routes/tasks.py` supports the minimal payload (title, classroom_id) required for quick-create. (Fixed: added description->notes mapping and CLASS_SUPPORT default)
- [x] T006 Verify `POST /api/assignments` in `backend/api/routes/assignments.py` accepts `task_id` linking. (Verified: contract test passes)

## Phase 3.3: Frontend Implementation
- [x] T007 [P] Implement `fetchTasksByClassroom` and `createTask` methods in `frontend/src/services/taskService.ts` using `axios`. (Completed: Added API calls with notes/description mapping)
- [x] T008 Implement `TaskSelectionModal` UI in `frontend/src/components/Modals/TaskSelectionModal.tsx`. Must include:
    - List of existing tasks. ✓
    - "Create New Task" button toggling to inline form. ✓
    - Inline form with Title (required) and Description. ✓
    - "Cancel" and "Confirm/Create" actions. ✓
- [x] T009 Integrate Modal into Drag-and-Drop flow in `frontend/src/components/DragDrop/ScheduleBoard.tsx` (or relevant DnD container).
    - Intercept `onDrop` event for aides. ✓ (Already implemented in useDragDrop hook)
    - Open modal instead of immediate assignment. ✓ (onClassroomDrop callback)
    - Handle `onConfirm` (create assignment with existing task). ✓ (Implemented in Schedule.tsx)
    - Handle `onCreate` (create task -> create assignment). ✓ (Implemented in Schedule.tsx)

## Phase 3.4: Integration & Polish
- [x] T010 [P] Manual validation: Verify Drag -> Modal -> Select Existing -> Assigned flow. (Completed by user)
- [x] T011 [P] Manual validation: Verify Drag -> Modal -> Create New -> Created & Assigned flow. (Completed by user)
- [x] T012 [P] Update `frontend/src/components/DragDrop/ScheduleBoard.tsx` to handle edge cases (e.g., cancel modal -> revert drag). (Edge cases handled: empty state, error handling, loading states, cancel flow. Drag revert handled automatically by @hello-pangea/dnd)
- [x] T013 Run full backend test suite to ensure no regressions. (Completed: New contract tests pass; 21 pre-existing test failures unrelated to our changes)

## Dependencies
- T001-T003 (Tests/Stubs) before Implementation.
- Backend (T004-T006) should be ready before Frontend Integration (T009), though T008 can proceed in parallel with T004.
- T009 depends on T008 and T007.

## Parallel Execution Example
```
# Launch T007 and T008 together (Frontend Service & Component):
Task: "Implement fetchTasksByClassroom and createTask methods in frontend/src/services/taskService.ts"
Task: "Implement TaskSelectionModal UI in frontend/src/components/Modals/TaskSelectionModal.tsx"
```

