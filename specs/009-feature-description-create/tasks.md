# Tasks: Snap-to-Gap Drag and Drop Task Assignment

**Input**: Design documents from `/specs/009-feature-description-create/`
**Prerequisites**: plan.md (required), research.md, data-model.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Success
2. Load optional design documents:
   → data-model.md: No DB changes; frontend Gap entity identified.
   → research.md: Frontend-first gap calculation and hover highlighting.
3. Generate tasks by category:
   → Setup: Unit and component test shells.
   → Tests: TDD-style unit, component, and integration tests.
   → Core: Gap calculation utility, Highlight component.
   → Integration: useDragDrop logic, Timetable view updates.
   → Polish: Validation tests, quickstart verification.
4. Apply task rules:
   → [P] for parallel (utility vs component).
   → TDD: Tests MUST fail before implementation.
5. Number tasks sequentially (T001, T002...)
6. Return: SUCCESS (tasks ready for execution)
```

## Phase 3.1: Setup & Failing Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.2
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation.**

- [x] T001 [P] Create failing unit tests for `calculateGaps` in `frontend/tests/unit/gapUtils.test.ts`.
- [x] T002 [P] Create failing component tests for `GapHighlight` in `frontend/tests/components/GapHighlight.test.tsx`.
- [x] T003 [P] Create failing integration test for the snap-to-gap workflow in `frontend/tests/integration/SnapToGap.test.tsx`.

## Phase 3.2: Core Utility Implementation
- [x] T004 Implement `calculateGaps` utility in `frontend/src/utils/gapUtils.ts` to identify available spaces >= 10m respecting grid lines.
- [x] T005 [P] Verify T001 (unit tests) now passes.

## Phase 3.3: UI Component Implementation
- [x] T006 Implement `GapHighlight` component in `frontend/src/components/TimetableGrid/GapHighlight.tsx` using aide's color and transparency.
- [x] T007 [P] Verify T002 (component tests) now passes.

## Phase 3.4: Integration & Logic
- [x] T008 Update `AideRow.tsx` and `TimetableGrid` to calculate gaps on hover and render `GapHighlight`.
- [x] T009 Update `useDragDrop.tsx` to identify target gap and snap times in `onDragEnd`.
- [x] T010 Implement minimum duration (10m) enforcement and error toast in `useDragDrop.tsx`.
- [x] T011 Ensure `AssignmentDurationModal` opens automatically with snapped times in `useDragDrop.tsx`. Also, implement a check at the moment of drop to verify the gap is still valid (FR-011).
- [x] T012 Verify T003 (integration test) now passes.

## Phase 3.5: Polish & Validation
- [x] T013 [P] Add unit test for FR-011 (concurrent modification/invalid gap) in `backend/tests/unit/test_daily_view_service.py`.
- [x] T014 [P] Performance check: Ensure hover highlighting doesn't lag the UI.
- [x] T015 Run manual verification scenarios from `quickstart.md`.

## Dependencies
- T001-T003 block T004-T007 (TDD).
- T004 blocks T008, T009.
- T006 blocks T008.
- T008-T011 block T012 (Integration success).
- All core tasks block T015 (Final validation).

## Parallel Example
```
# Run utility and component tests in parallel:
Task: "Create failing unit tests for calculateGaps in frontend/tests/unit/gapUtils.test.ts"
Task: "Create failing component tests for GapHighlight in frontend/tests/components/GapHighlight.test.tsx"
```

## Notes
- [P] tasks = different files, no dependencies.
- Use `addMinutesToTime` and `calculateDuration` from existing `timeUtils.ts`.
- Grid lines are: 08:50, 09:10, 09:40, 10:10, 10:40, 11:10, 11:50, 12:20, 12:50, 13:20, 14:00, 14:30.
- Error message: "All tasks need to be at least 10 minutes wide."
