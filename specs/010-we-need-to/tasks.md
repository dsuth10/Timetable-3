# Tasks: Delete Recurring Assignment Instances for Specific Aide

**Input**: Design documents from `/specs/010-we-need-to/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Success: Python 3.12+ (Backend), TypeScript (Frontend)
2. Load optional design documents:
   → data-model.md: No new entities; uses existing Assignment, RecurringSeries
   → contracts/: DELETE /api/assignments/{id}/recurring-series-for-aide
   → research.md: 6 decisions covering deletion logic, modification detection
   → quickstart.md: 5 manual test scenarios
3. Generate tasks by category:
   → Tests First: Contract tests, unit tests, component tests
   → Backend: Service layer, route endpoint
   → Frontend: API function, dialog update, preview count
   → Polish: Integration tests, manual verification
4. Apply task rules:
   → TDD: Tests MUST fail before implementation
   → [P] for parallel where files are independent
5. Number tasks sequentially (T001-T012)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 3.1: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.2
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T001 [P] Create contract tests for `DELETE /api/assignments/{id}/recurring-series-for-aide` in `backend/tests/contract/test_delete_recurring_series_for_aide.py`. Tests must cover:
  - Successful deletion returns `deleted_count` and `deleted_ids`
  - Preview mode (`?preview=true`) returns `would_delete_count` without deleting
  - Non-recurring assignment (no `recurring_series_id`) returns 400
  - Version mismatch returns 409
  - Assignment not found returns 404

- [x] T002 [P] Create unit tests for modification detection and deletion logic in `backend/tests/unit/test_assignment_series_delete.py`. Tests must cover:
  - `is_assignment_modified()` returns `True` when `start_time` differs from series
  - `is_assignment_modified()` returns `True` when `end_time` differs from series
  - `get_deletable_assignments()` filters by `aide_id` OR `original_aide_id`
  - `get_deletable_assignments()` only includes dates >= selected assignment date
  - Relief Pool assignments with matching `original_aide_id` are included

- [x] T003 [P] Create component tests for the new deletion option in `frontend/tests/components/TaskDeleteDialog.test.tsx`. Tests must cover:
  - Fourth option "Remove this and future recurring instances for this aide" is visible when `assignment.recurring_series_id` exists
  - Fourth option is hidden when `assignment.recurring_series_id` is null
  - Selecting the option calls the correct API endpoint
  - Count is displayed in the option description when loaded

---

## Phase 3.2: Backend Implementation (ONLY after tests T001-T002 are failing)

- [x] T004 Implement `AssignmentSeriesService` in `backend/api/services/assignment_service.py` (create new file or add to existing). Must include:
  - `is_assignment_modified(assignment, series)` function comparing times
  - `get_deletable_assignments(assignment_id, preview=False)` returning list of IDs
  - `delete_recurring_series_for_aide(assignment_id, version)` performing atomic deletion
  - Use SQLAlchemy joins with `recurring_series` table
  - Filter: `(aide_id = target OR original_aide_id = target) AND date >= selected_date AND times match series`

- [x] T005 Implement `DELETE /api/assignments/{id}/recurring-series-for-aide` endpoint in `backend/api/routes/assignments.py`. Must include:
  - Accept `version` in request body (required)
  - Accept `?preview=true` query parameter (optional)
  - Return 400 if assignment has no `recurring_series_id`
  - Return 404 if assignment not found
  - Return 409 if version mismatch
  - Return 200 with `deleted_count`, `deleted_ids`, `skipped_count`, `skipped_reason`, `message`
  - For preview: Return `would_delete_count`, `would_delete_ids`, `would_skip_count`

- [x] T006 Verify T001 and T002 tests now pass by running:
  ```bash
  cd backend && pytest tests/contract/test_delete_recurring_series_for_aide.py tests/unit/test_assignment_series_delete.py -v
  ```

---

## Phase 3.3: Frontend Implementation (ONLY after T006 passes)

- [x] T007 Add `deleteRecurringSeriesForAide(assignmentId, version, preview?)` function to `frontend/src/services/assignmentsApi.ts`. Must:
  - Call `DELETE /api/assignments/{id}/recurring-series-for-aide`
  - Accept optional `preview` boolean parameter
  - Append `?preview=true` to URL if preview is true
  - Return response data with counts

- [x] T008 Update `TaskDeleteDialog.tsx` in `frontend/src/components/TaskModals/TaskDeleteDialog.tsx` to add fourth deletion option. Must:
  - Add new state type: `'instance' | 'recurring' | 'reset' | 'delete'`
  - Show option only when `assignment?.recurring_series_id` is not null
  - Label: "Remove this and future recurring instances for this aide"
  - Description: "Delete this and X more recurring assignments for [Aide Name]. Modified assignments will be preserved."
  - Fetch preview count when option is rendered (use `useEffect` with `preview=true`)
  - Call `deleteRecurringSeriesForAide()` on confirmation
  - Show success toast with deletion count

- [x] T009 Verify T003 tests now pass by running:
  ```bash
  cd frontend && npm run test -- tests/components/TaskDeleteDialog.test.tsx
  ```

---

## Phase 3.4: Integration & Polish

- [x] T010 [P] Create integration test for full delete flow in `backend/tests/integration/test_recurring_series_delete_flow.py`. Must:
  - Set up 4-week recurring series for Aide Smith
  - Set up same task for Aide Jones
  - Delete Week 2 for Aide Smith
  - Verify Smith's Weeks 2-4 deleted, Week 1 preserved
  - Verify Jones's assignments untouched

- [x] T011 [P] Add edge case tests to `backend/tests/contract/test_delete_recurring_series_for_aide.py`:
  - Test deletion when one assignment is modified (should be skipped)
  - Test deletion includes Relief Pool assignments with matching `original_aide_id`
  - Test past assignments are not deleted (only selected date and future)

- [x] T012 Run manual verification scenarios from `quickstart.md`:
  1. Basic deletion flow (4 weeks → delete future 3)
  2. Option hidden for non-recurring
  3. Modified assignment preserved
  4. Relief Pool assignments included
  5. Past assignments preserved

---

## Dependencies

```
T001-T003 (failing tests) → must complete before → T004-T005 (backend)
T004-T005 (backend) → must complete before → T006 (verify backend tests)
T006 (backend tests pass) → must complete before → T007-T008 (frontend)
T007-T008 (frontend) → must complete before → T009 (verify frontend tests)
All implementation → must complete before → T010-T012 (integration & polish)
```

Dependency graph:
```
T001 ─┐
T002 ─┼──▶ T004 ──▶ T005 ──▶ T006 ──┐
T003 ─┘                              │
                                     ▼
                              T007 ──▶ T008 ──▶ T009 ──┐
                                                       │
                                                       ▼
                                            T010, T011, T012
```

## Parallel Execution Examples

### Phase 3.1: Run all failing tests in parallel
```
# Launch T001-T003 together:
Task: "Create contract tests for DELETE /api/assignments/{id}/recurring-series-for-aide in backend/tests/contract/test_delete_recurring_series_for_aide.py"
Task: "Create unit tests for modification detection in backend/tests/unit/test_assignment_series_delete.py"
Task: "Create component tests for new deletion option in frontend/tests/components/TaskDeleteDialog.test.tsx"
```

### Phase 3.4: Run polish tasks in parallel
```
# Launch T010-T011 together:
Task: "Create integration test for full delete flow in backend/tests/integration/test_recurring_series_delete_flow.py"
Task: "Add edge case tests to backend/tests/contract/test_delete_recurring_series_for_aide.py"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD discipline)
- Backend must complete before frontend (frontend calls backend API)
- Commit after each task to maintain atomic changes
- Run `pytest` after T006 to ensure all backend tests pass
- Run `npm run test` after T009 to ensure all frontend tests pass

## Validation Checklist
*GATE: Checked before marking complete*

- [ ] All contract endpoints have corresponding tests (T001)
- [ ] Service layer has unit tests (T002)
- [ ] Frontend component has tests (T003)
- [ ] All tests come before implementation (TDD)
- [ ] Parallel tasks are truly independent (different files)
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Manual quickstart verification completed (T012)

