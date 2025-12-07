# Tasks: Quick-Click Task Creation

**Input**: Design documents from `specs/main/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: Python 3.12+, Flask 3.x, React 18+, TypeScript, SQLite
   → Structure: Web application (backend/ + frontend/)
2. Load design documents ✓
   → data-model.md: Uses existing Task and Assignment entities (no new models)
   → contracts/: API spec for POST /api/quick-create-task
   → quickstart.md: 2 user stories with test scenarios
3. Generate tasks by category ✓
   → Setup: No new dependencies required
   → Tests: Contract test, integration test, component test
   → Backend: New route endpoint
   → Frontend: Modal component, grid button, API service, state updates
4. Apply task rules ✓
   → Different files = [P] for parallel
   → Tests before implementation (TDD)
5. Number tasks sequentially ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓
9. Return: SUCCESS (18 tasks ready)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths relative to repository root

## Path Conventions (Web App Structure)
```
backend/
├── api/routes/      # Flask route handlers
├── api/services/    # Business logic (reuse existing)
├── tests/contract/  # API contract tests
└── tests/integration/  # Integration tests

frontend/
├── src/components/  # React components
├── src/services/    # API client
├── src/store/stores/  # Zustand stores
└── tests/components/  # Component tests
```

## Phase 3.1: Setup
- [x] T001 Project structure already exists (backend/ + frontend/)
- [x] T002 Dependencies already installed (Flask, React, Material-UI, Zustand)
- [x] T003 Linting and formatting already configured

**Note**: No setup tasks required - project infrastructure already in place.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Contract test POST /api/quick-create-task in `backend/tests/contract/test_quick_create_task.py`
  - Test successful creation (201 response with task and assignment)
  - Test validation errors (400 for missing/invalid fields)
  - Test collision detection (409 for overlapping assignments)
  - Test foreign key errors (404 for invalid aide_id/classroom_id)
  - Test response schema matches contract specification

- [x] T005 [P] Integration test quick-click workflow in `backend/tests/integration/test_quick_click_flow.py`
  - Test full workflow: API call → task created → assignment created → both in database
  - Test atomicity: verify rollback on collision
  - Test task appears in Task Bank (via GET /api/tasks)
  - Test assignment appears in schedule (via GET /api/assignments)
  - Test created task is reusable (can create second assignment with same task_id)

- [x] T006 [P] Component test QuickCreateTaskModal in `frontend/tests/components/QuickCreateTaskModal.test.tsx`
  - Test modal opens/closes correctly
  - Test form validation (required fields, category selection)
  - Test duration dropdown options (5-minute increments)
  - Test start time is locked/read-only
  - Test form submission triggers API call
  - Test error handling and display

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Backend

- [x] T007 POST /api/quick-create-task endpoint in `backend/api/routes/tasks.py`
  - Add new route handler
  - Validate request body (title, category, date, start_time, duration_minutes, aide_id)
  - Validate optional fields (classroom_id, notes)
  - Validate time format and 5-minute increments
  - Calculate end_time from start_time + duration_minutes
  - Check collision detection using existing CollisionService
  - Create Task with placeholder times (09:00-10:00) in transaction
  - Create Assignment with actual times in same transaction
  - Return 201 with both task and assignment data
  - Handle errors: 400 (validation), 409 (collision), 404 (foreign key), 500 (database)

### Frontend API Service

- [x] T008 [P] Add quickCreateTask function to `frontend/src/services/tasksApi.ts`
  - Function signature: `quickCreateTask(data: QuickCreateTaskRequest): Promise<QuickCreateTaskResponse>`
  - Type definitions for request/response
  - Axios POST call to `/api/quick-create-task`
  - Error handling with proper error types
  - Return typed response with task and assignment

### Frontend Components

- [x] T009 [P] Create QuickCreateTaskModal component in `frontend/src/components/TimetableGrid/QuickCreateTaskModal.tsx`
  - Material-UI Dialog component
  - Form fields: title (text), category (select), duration (select), classroom (select), notes (textarea)
  - Start time display (locked/read-only)
  - Duration dropdown with 5-minute increment options (5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60)
  - Default duration logic: 30 min for slots ≥30 min, slot length for <30 min
  - Form validation (required fields, category selection)
  - Submit handler calls tasksApi.quickCreateTask
  - Loading state during submission
  - Error display (toast notifications)
  - Success handler closes modal and triggers state updates
  - Accessibility: ARIA labels, keyboard navigation, focus management

- [x] T010 Add "+" button to TimetableGrid time slots in `frontend/src/components/TimetableGrid/TimeSlottedColumn.tsx` (or TimetableGrid.tsx)
  - Small "+" icon in top-right corner of each time slot cell
  - Opacity 0.4 default, full opacity on hover
  - Button appears on both empty and occupied cells
  - Click handler opens QuickCreateTaskModal with context:
    - date: clicked slot's date
    - start_time: clicked slot's start time (locked)
    - duration: default based on slot length
    - aide_id: currently-viewed aide (from props/context)
  - Accessibility: ARIA label "Create task in this time slot", keyboard accessible

- [x] T011 Update TimetableGrid to pass modal props in `frontend/src/components/TimetableGrid/TimetableGrid.tsx`
  - Import QuickCreateTaskModal component
  - Add state for modal open/close
  - Add state for selected slot context (date, start_time, aide_id)
  - Pass click handler to TimeSlottedColumn
  - Render QuickCreateTaskModal with context props
  - Handle modal close and success callbacks

### Frontend State Management

- [x] T012 Update tasks store to handle quick-create response in `frontend/src/store/stores/tasks.ts`
  - Add task to store on successful quick-create
  - Optimistic update (add immediately, rollback on error)
  - Trigger Task Bank re-render

- [x] T013 Update assignments store to handle quick-create response in `frontend/src/store/stores/assignments.ts`
  - Add assignment to store on successful quick-create
  - Optimistic update (add immediately, rollback on error)
  - Trigger TimetableGrid re-render
  - Update weekly assignments view

## Phase 3.4: Integration

- [x] T014 Wire up complete quick-click flow
  - Verify "+" button click → modal opens with correct context
  - Verify form submission → API call → state updates → UI updates
  - Verify modal closes on success
  - Verify task appears in Task Bank
  - Verify assignment appears in schedule grid
  - Verify error handling (validation, collision, network errors)
  - Verify created task is draggable from Task Bank

## Phase 3.5: Polish

- [x] T015 [P] Add error handling edge cases
  - Network timeout handling
  - Retry logic for transient failures (form data preserved for retry)
  - Form data preservation on error
  - Clear error messages for all error types

- [x] T016 [P] Accessibility verification
  - Keyboard navigation through modal form (Material-UI Dialog handles this)
  - Screen reader compatibility (ARIA labels added)
  - Focus management (Material-UI Dialog provides focus trap, autoFocus on title field)
  - ARIA labels and descriptions (all form fields have aria-label)
  - Color contrast verification (uses Material-UI theme colors)

- [x] T017 [P] Performance optimization
  - API response time verified via contract tests (<500ms expected)
  - Modal opens instantly (lightweight component, no heavy computations)
  - Optimistic updates implemented (immediate UI feedback)
  - React.memo used on TimetableSlot for re-render optimization

- [ ] T018 Run quickstart.md validation
  - Execute all steps from quickstart.md (requires manual testing)
  - Verify User Story 1 scenario passes
  - Verify User Story 2 scenario passes
  - Document any deviations or issues

## Dependencies

- **T004-T006** (tests) must complete before **T007-T013** (implementation)
- **T007** (backend endpoint) blocks **T008** (frontend API service)
- **T008** (API service) blocks **T009-T011** (frontend components)
- **T009** (modal component) blocks **T010-T011** (grid integration)
- **T012-T013** (state management) can run in parallel with **T009-T011** but must complete before **T014**
- **T014** (integration) requires all previous tasks complete
- **T015-T018** (polish) can run in parallel after **T014** completes

## Parallel Execution Examples

### Example 1: Initial Test Phase (T004-T006)
```
# Launch all three test files in parallel:
Task: "Contract test POST /api/quick-create-task in backend/tests/contract/test_quick_create_task.py"
Task: "Integration test quick-click workflow in backend/tests/integration/test_quick_click_flow.py"
Task: "Component test QuickCreateTaskModal in frontend/tests/components/QuickCreateTaskModal.test.tsx"
```
**Note**: All tests will fail initially (no implementation yet). This is expected and correct.

### Example 2: Frontend Development (T008-T009)
```
# Can develop API service and modal component in parallel:
Task: "Add quickCreateTask function to frontend/src/services/tasksApi.ts"
Task: "Create QuickCreateTaskModal component in frontend/src/components/TimetableGrid/QuickCreateTaskModal.tsx"
```
**Note**: T008 provides types that T009 can use, but T009 can be developed with placeholder types initially.

### Example 3: State Management (T012-T013)
```
# Both stores can be updated in parallel:
Task: "Update tasks store to handle quick-create response in frontend/src/store/stores/tasks.ts"
Task: "Update assignments store to handle quick-create response in frontend/src/store/stores/assignments.ts"
```

### Example 4: Polish Phase (T015-T017)
```
# All polish tasks can run in parallel:
Task: "Add error handling edge cases"
Task: "Accessibility verification"
Task: "Performance optimization"
```

## Notes

- **[P] tasks** = different files, no dependencies between them
- **Verify tests fail** before implementing (TDD approach)
- **Commit after each task** to maintain clean git history
- **Avoid**: vague tasks, modifying same file in parallel [P] tasks
- **Backend validation**: Existing `validate_time_30min` middleware already supports 5-minute increments (no changes needed)
- **Collision detection**: Reuse existing `CollisionService.validate_assignment()` (no new service needed)
- **Models**: No new database models required - feature uses existing Task and Assignment entities

## Validation Checklist

- [x] Contract test covers all API contract scenarios
- [x] Integration test covers full workflow
- [x] Component test covers modal interactions
- [x] All tests come before implementation (TDD)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Dependencies are clearly documented
- [x] User stories are covered by integration tests

## Task Summary

**Total Tasks**: 18
- **Setup**: 0 (infrastructure already exists)
- **Tests**: 3 (contract, integration, component)
- **Backend**: 1 (new endpoint)
- **Frontend**: 6 (API service, modal, grid button, grid integration, 2 state stores)
- **Integration**: 1 (end-to-end flow)
- **Polish**: 4 (error handling, accessibility, performance, validation)

**Estimated Effort**: 
- Tests: 2-3 hours
- Backend: 2-3 hours
- Frontend: 6-8 hours
- Integration: 1-2 hours
- Polish: 2-3 hours
- **Total**: 13-19 hours
