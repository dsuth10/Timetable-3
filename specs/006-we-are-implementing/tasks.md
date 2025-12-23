# Tasks: Daily Display Timetable

**Input**: Design documents from `/specs/006-we-are-implementing/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Summary of Work
Implement a horizontal daily timeline for teacher aide scheduling, including a fixed right-hand panel for Task Bank and Relief Pool with drag-and-drop functionality, overlap handling, and absence visualization.

## Phase 3.1: Setup
- [x] T001 Create backend service file `backend/api/services/daily_view_service.py`
- [x] T002 Create backend API file `backend/api/routes/daily_view.py`
- [x] T003 [P] Create frontend store `frontend/src/store/stores/dailyDisplay.ts` using Zustand
- [x] T004 [P] Create frontend API service `frontend/src/services/dailyDisplayApi.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] Contract test GET `/api/daily-view/{date}` in `backend/tests/contract/test_daily_view_get.py`
- [x] T006 [P] Contract test POST `/api/daily-view/assign` in `backend/tests/contract/test_daily_view_assign.py`
- [x] T007 [P] Integration test for Daily View layout in `frontend/tests/integration/DailyViewLayout.test.tsx`
- [x] T008 [P] Integration test for drag from Task Bank in `frontend/tests/integration/TaskBankDrag.test.tsx`
- [x] T009 [P] Integration test for drag from Relief Pool (with confirmation) in `frontend/tests/integration/ReliefPoolDrag.test.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T010 Implement `DailyViewService.get_daily_data(date)` in `backend/api/services/daily_view_service.py` to fetch aides, absences, and assignments, including a `timeline_config` defining variable slot durations (e.g., 20m/30m)
- [x] T011 Implement `DailyViewService.assign_task()` in `backend/api/services/daily_view_service.py` handling both template and relief pool assignments
- [x] T012 Implement GET `/api/daily-view/{date}` endpoint in `backend/api/routes/daily_view.py`
- [x] T013 Implement POST `/api/daily-view/assign` endpoint in `backend/api/routes/daily_view.py`
- [x] T014 [P] Implement `DailyDisplayApi` methods in `frontend/src/services/dailyDisplayApi.ts`
- [x] T015 [P] Implement `DailyDisplayStore` actions and state in `frontend/src/store/stores/dailyDisplay.ts`

## Phase 3.4: UI Components & Drag-and-Drop
- [x] T016 Create `DailyDisplayPage` shell in `frontend/src/pages/DailyDisplayPage.tsx`
- [x] T017 Implement `DailyTimeline` horizontal scrolling grid in `frontend/src/components/DailyTimeline.tsx` based on the `timeline_config` provided by the backend
- [x] T018 Implement `AideRow` with sticky name column in `frontend/src/components/AideRow.tsx`
- [x] T019 [P] Implement `TaskBank` with grouped categories and search in `frontend/src/components/TaskBank.tsx`
- [x] T020 [P] Implement `ReliefPool` list in `frontend/src/components/ReliefPool.tsx`
- [x] T021 [P] Implement `DatePicker` navigation component in `frontend/src/components/DailyDatePicker.tsx`
- [x] T022 Implement `@hello-pangea/dnd` context and Droppable zones in `frontend/src/pages/DailyDisplayPage.tsx`
- [x] T022b Configure custom sensors for horizontal auto-scrolling during drag operations in `frontend/src/hooks/useTimelineDrag.ts`
- [x] T023 Implement `AssignmentConfirmationDialog` for relief tasks in `frontend/src/components/AssignmentConfirmationDialog.tsx`

## Phase 3.5: Polish & Refinement
- [x] T024 Implement "thin strips" side-by-side rendering for overlapping assignments in `frontend/src/components/AideRow.tsx`
- [x] T025 Add "reddened out" styling for absent aide rows in `frontend/src/components/AideRow.tsx`
- [x] T026 [P] Add unit tests for `DailyViewService` logic in `backend/tests/unit/test_daily_view_service.py`
- [x] T027 [P] Add unit tests for frontend utility functions (slot calculation, time formatting) in `frontend/src/utils/dailyViewUtils.test.ts`
- [x] T028 Final validation using `specs/006-we-are-implementing/quickstart.md`

## Dependencies
- Setup (T001-T004) before tests (T005-T009)
- Tests (T005-T009) before implementation (T010-T023)
- T010 blocks T012
- T011 blocks T013
- T012-T013 block T014
- T014 blocks T015
- T015 blocks T016-T023
- UI Components (T016-T021) before DND integration (T022)
- T022 blocks T022b, T023
- T023 blocks T024-T028

## Parallel Execution Examples
```
# Phase 3.2: Launch backend contract tests and frontend integration tests
Task: "Contract test GET /api/daily-view/{date} in backend/tests/api/test_daily_view_get.py"
Task: "Contract test POST /api/daily-view/assign in backend/tests/api/test_daily_view_assign.py"
Task: "Integration test for Daily View layout in frontend/src/tests/integration/DailyViewLayout.test.tsx"
Task: "Integration test for drag from Task Bank in frontend/src/tests/integration/TaskBankDrag.test.tsx"

# Phase 3.4: Build independent UI components
Task: "Implement TaskBank with grouped categories and search in frontend/src/components/TaskBank.tsx"
Task: "Implement ReliefPool list in frontend/src/components/ReliefPool.tsx"
```

## Notes
- [P] tasks = different files, no shared logic dependencies.
- Ensure backend API handles 20m vs 30m slots correctly in validation.
- Commit after each task completion.
- Verify each TDD test fails before writing the implementation.

