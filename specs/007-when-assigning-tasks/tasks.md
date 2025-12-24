# Tasks: Set Assignment Details Dialog in Daily View

**Input**: Design documents from `/specs/007-when-assigning-tasks/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Success: TS/React/Python stack, DnD focus.
2. Load optional design documents:
   → data-model.md: Reusing existing entities.
   → contracts/: assignments.yaml contract.
   → research.md: Update useDragDrop hook and integrate into DailyDisplayPage.
3. Generate tasks by category:
   → Setup: hook refactoring.
   → Tests: frontend integration tests for DnD and dialog appearance.
   → Core: refactor useDragDrop, update AideRow, update DailyDisplayPage.
   → Polish: validation check and UI cleanup.
4. Apply task rules:
   → T001-T002 (different files) marked [P].
   → Tests before implementation.
5. Number tasks sequentially (T001, T002...).
6. Generate dependency graph.
7. Create parallel execution examples.
8. Validate task completeness.
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Infrastructure
- [x] T001 [P] Refactor `useDragDrop` hook in `frontend/src/hooks/useDragDrop.tsx` to support `defaultDate` parameter and fallback date parsing logic.
- [x] T002 [P] Update `AideRow` component in `frontend/src/components/AideRow.tsx` to ensure `droppableId` format is compatible with the refactored hook (e.g., `aide-{id}-slot-{time}`).

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T003 [P] Create integration test `frontend/tests/integration/DailyViewAssignment.test.tsx` asserting that dropping a task template onto an aide slot opens the `AssignmentDurationModal`.
- [x] T004 [P] Add test case to `frontend/tests/integration/DailyViewAssignment.test.tsx` ensuring that dropping a task onto an absent aide's row is blocked.
- [x] T012 [P] Add test case to `frontend/tests/integration/DailyViewAssignment.test.tsx` verifying that the dialog includes the "Make this a recurring task" toggle option (FR-007).
- [x] T013 [P] Add test case to `frontend/tests/integration/DailyViewAssignment.test.tsx` verifying that users can change the assigned Teacher Aide and Classroom in the dialog (FR-008).

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T005 Refactor `frontend/src/pages/DailyDisplayPage.tsx` to use the `useDragDrop` hook instead of its local `onDragEnd` logic.
- [x] T006 Ensure `DailyDisplayPage.tsx` renders the `ConflictUI` and `DurationModal` returned by the hook.
- [x] T007 Update `onConfirm` handler in `DailyDisplayPage.tsx` (via the hook) to call `fetchDailyData` after successful assignment creation.
- [x] T008 [P] Add logic to `useDragDrop.tsx` to block drops if the aide is marked as absent (handle `isDropDisabled` consistently with `DailyView`).

## Phase 3.4: Integration & Validation
- [x] T009 Verify that overlapping assignments in `DailyDisplayPage` stack vertically as defined in the spec (FR-013). Specifically: (1) Create two assignments with overlapping time ranges for the same aide, (2) Verify both assignments are visible in the timeline, (3) Verify they are stacked vertically (not overlapping horizontally), (4) Verify each assignment card shows correct time range and task title.
- [x] T010 [P] Update `quickstart.md` with final verification steps and screenshots if applicable.
- [x] T011 Run all frontend tests and ensure 100% pass rate.

## Dependencies
- T001 and T002 block T005.
- T003, T004, T012, and T013 must fail before T005-T008 are started.
- T005 and T006 block T007.
- T007 blocks T009.

## Parallel Example
```
# Launch T001 and T002 together:
Task: "Refactor useDragDrop hook in frontend/src/hooks/useDragDrop.tsx"
Task: "Update AideRow component droppable IDs in frontend/src/components/AideRow.tsx"

# Launch T003, T004, T012, and T013 together:
Task: "Create integration test for Daily View DnD dialog appearance"
Task: "Add test case for blocking drops on absent aides"
Task: "Add test case for recurring task toggle in dialog"
Task: "Add test case for changing aide/classroom in dialog"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- The `AssignmentDurationModal` already handles classroom assignment logic; ensure `DailyDisplayPage` provides necessary classroom context if needed.
- **Class Row Support**: FR-006 and Acceptance Scenario 2 reference Class rows in Daily View. If the current Daily View implementation does not support Class rows, these requirements are deferred to a future enhancement. The dialog implementation should be flexible enough to support Class rows when they are added.

