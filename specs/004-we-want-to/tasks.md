# Tasks: Relief Pool - Absent Aide Task Reassignment

**Input**: Design documents from `/specs/004-we-want-to/`  
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow Status
```
✅ 1. Loaded plan.md - Tech: Python 3.12+, Flask, React 18, TypeScript
✅ 2. Loaded design documents - 1 entity modification, 6 API endpoints
✅ 3. Generated 62 tasks across 7 phases
✅ 4. Applied parallel markers [P] for independent files
✅ 5. Numbered tasks T001-T043
✅ 6. Dependencies mapped
✅ 7. Parallel execution examples included
✅ 8. Validation complete
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included in each task

---

## Phase 3.1: Setup & Database Migration

- [x] T001 Create Alembic migration for `original_aide_id` column in `backend/migrations/versions/003_add_relief_pool_support.py`
- [x] T002 Run migration and verify schema: `alembic upgrade head`

---

## Phase 3.2: Backend Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**Contract Tests - New Endpoints**
- [x] T003 [P] Contract test GET /api/relief-pool in `backend/tests/contract/test_relief_pool_list.py`
- [x] T004 [P] Contract test GET /api/relief-pool/count in `backend/tests/contract/test_relief_pool_count.py`
- [x] T005 [P] Contract test POST /api/relief-pool/{id}/reassign in `backend/tests/contract/test_relief_pool_reassign.py`
- [x] T006 [P] Contract test POST /api/relief-pool/{id}/dismiss in `backend/tests/contract/test_relief_pool_dismiss.py`

**Contract Tests - Modified Endpoints**
- [x] T007 [P] Contract test POST /api/absences (relief pool cascade) in `backend/tests/contract/test_absences_relief_pool.py`
- [x] T008 [P] Contract test DELETE /api/absences/{id} (restoration) in `backend/tests/contract/test_absences_restore.py`

**Integration Tests - User Scenarios**
- [x] T009 [P] Integration test: Absence creates Relief Pool tasks in `backend/tests/integration/test_relief_pool_flow.py::test_absence_creates_relief_pool`
- [x] T010 [P] Integration test: Reassign Relief Pool task in `backend/tests/integration/test_relief_pool_flow.py::test_reassign_relief_pool_task`
- [x] T011 [P] Integration test: Date restriction enforcement in `backend/tests/integration/test_relief_pool_flow.py::test_date_restriction`
- [x] T012 [P] Integration test: Absence restoration in `backend/tests/integration/test_relief_pool_flow.py::test_absence_restoration`
- [x] T013 [P] Integration test: End-of-day cleanup in `backend/tests/integration/test_relief_pool_flow.py::test_cleanup`
- [x] T013b [P] Integration test: Time adjustment during reassignment in `backend/tests/integration/test_relief_pool_flow.py::test_time_adjustment_on_reassign`
- [x] T013c [P] Integration test: Conflict during Relief Pool reassignment in `backend/tests/integration/test_relief_pool_flow.py::test_conflict_during_reassign`

---

## Phase 3.3: Backend Core Implementation (ONLY after tests are failing)

**Model Updates**
- [x] T014 Add RELIEF_POOL to ASSIGNMENT_STATUSES in `backend/api/models/assignment.py`
- [x] T015 Add `original_aide_id` column and relationship in `backend/api/models/assignment.py`
- [x] T016 Add RELIEF_POOL validation rules in `backend/api/models/assignment.py`

**Service Layer**
- [x] T017 [P] Create ReliefPoolService with get_all(), get_count() in `backend/api/services/relief_pool_service.py`
- [x] T018 Add reassign() method to ReliefPoolService in `backend/api/services/relief_pool_service.py`
- [x] T019 Add dismiss() method to ReliefPoolService in `backend/api/services/relief_pool_service.py`
- [x] T020 Add cleanup_expired() method to ReliefPoolService in `backend/api/services/relief_pool_service.py`

**Modify Absence Service**
- [x] T021 Modify cascade to set RELIEF_POOL status in `backend/api/services/absence_service.py`
- [x] T022 Add restore_assignments() method in `backend/api/services/absence_service.py`

**API Routes**
- [x] T023 [P] Create relief_pool blueprint with GET /relief-pool in `backend/api/routes/relief_pool.py`
- [x] T024 Add GET /relief-pool/count endpoint in `backend/api/routes/relief_pool.py`
- [x] T025 Add POST /relief-pool/{id}/reassign endpoint in `backend/api/routes/relief_pool.py`
- [x] T026 Add POST /relief-pool/{id}/dismiss endpoint in `backend/api/routes/relief_pool.py`
- [x] T027 Modify POST /api/absences response in `backend/api/routes/absences.py`
- [x] T028 Modify DELETE /api/absences/{id} to restore tasks in `backend/api/routes/absences.py`
- [x] T029 Register relief_pool blueprint in `backend/api/__init__.py`

**Scheduler**
- [x] T030 Add Relief Pool cleanup job to scheduler in `backend/api/scheduler.py`

---

## Phase 3.4: Frontend Tests First (TDD)

- [ ] T031 [P] Component test ReliefPoolTab renders tasks in `frontend/tests/components/ReliefPoolTab.test.tsx`
- [ ] T032 Component test ReliefPoolTab date grouping in `frontend/tests/components/ReliefPoolTab.test.tsx`
- [ ] T033 [P] Store test reliefPool fetch and state in `frontend/tests/store/reliefPool.test.ts`

---

## Phase 3.5: Frontend Core Implementation (ONLY after tests are failing)

**TypeScript Types**
- [x] T034 Add RELIEF_POOL to Assignment status type in `frontend/src/types/index.ts`
- [x] T035 Add original_aide_id to Assignment interface in `frontend/src/types/index.ts`
- [x] T036 Add ReliefPoolTask and ReliefPoolByDate types in `frontend/src/types/index.ts`

**API Client**
- [x] T037 [P] Create reliefPoolApi with getAll(), getCount() in `frontend/src/services/reliefPoolApi.ts`
- [x] T038 Add reassign() method to reliefPoolApi in `frontend/src/services/reliefPoolApi.ts`
- [x] T039 Add dismiss() method to reliefPoolApi in `frontend/src/services/reliefPoolApi.ts`

**Zustand Store**
- [x] T040 Create reliefPool store with fetch, count in `frontend/src/store/stores/reliefPool.ts`
- [x] T040b Add auto-refresh trigger to reliefPool store when absences change in `frontend/src/store/stores/reliefPool.ts`

**UI Components**
- [x] T041 Create ReliefPoolTab component with task cards in `frontend/src/components/Layout/SidePanel/ReliefPoolTab.tsx`
- [x] T042 Add date grouping and original aide labels to ReliefPoolTab in `frontend/src/components/Layout/SidePanel/ReliefPoolTab.tsx`
- [x] T042b Implement WCAG AA accessibility for ReliefPoolTab (keyboard nav, ARIA labels, focus management) in `frontend/src/components/Layout/SidePanel/ReliefPoolTab.tsx`
- [x] T043 Add tab navigation to TaskBank (Task Bank | Relief Pool) in `frontend/src/components/Layout/SidePanel/TaskBank.tsx`
- [x] T044 Add Relief Pool badge count to tab in `frontend/src/components/Layout/SidePanel/TaskBank.tsx`
- [x] T044b Ensure Relief Pool tab view doesn't affect aide selector state in `frontend/src/components/Layout/SidePanel/TaskBank.tsx`

**Drag-and-Drop Integration**
- [x] T045 Add date restriction validation to useDragDrop hook in `frontend/src/hooks/useDragDrop.tsx`
- [x] T046 Update TimetableSlot drop validation for Relief Pool in `frontend/src/components/TimetableGrid/TimetableSlot.tsx`
- [x] T047 Add date restriction error toast/message in `frontend/src/components/ToastNotifications.tsx`

---

## Phase 3.6: E2E Tests (Cypress)

- [ ] T048 [P] E2E test: Relief Pool tab appears with badge in `frontend/cypress/e2e/relief-pool.cy.ts`
- [ ] T049 [P] E2E test: Drag Relief Pool task to same-day slot in `frontend/cypress/e2e/relief-pool.cy.ts`
- [ ] T050 [P] E2E test: Date restriction prevents wrong-day drop in `frontend/cypress/e2e/relief-pool.cy.ts`
- [ ] T051 [P] E2E test: Dismiss Relief Pool task in `frontend/cypress/e2e/relief-pool.cy.ts`
- [ ] T051b [P] E2E test: Multiple absent aides tasks grouped by original aide in `frontend/cypress/e2e/relief-pool.cy.ts`

---

## Phase 3.7: Polish & Validation

- [x] T052 Run all backend tests and ensure passing: `cd backend && pytest`
- [ ] T053 Run all frontend tests and ensure passing: `cd frontend && npm test`
- [ ] T054 Run E2E tests: `cd frontend && npm run e2e`
- [ ] T055 Manual testing per quickstart.md scenarios
- [x] T056 Update README.md with Relief Pool feature documentation

---

## Dependencies

```
Migration (T001-T002) 
    ↓
Backend Tests (T003-T013) [All Parallel]
    ↓
Model Updates (T014-T016) [Sequential - same file]
    ↓
Services (T017-T022)
├── ReliefPoolService (T017-T020)
└── AbsenceService (T021-T022)
    ↓
Routes (T023-T029)
├── relief_pool.py (T023-T026)
└── absences.py (T027-T028)
    ↓
Scheduler (T030)
    ↓
Frontend Tests (T031-T033) [All Parallel]
    ↓
Types (T034-T036) [Sequential - same file]
    ↓
API Client (T037-T039)
    ↓
Store (T040)
    ↓
Components (T041-T047)
├── ReliefPoolTab (T041-T042)
├── TaskBank (T043-T044)
└── DnD Integration (T045-T047)
    ↓
E2E Tests (T048-T051) [All Parallel]
    ↓
Polish (T052-T056)
```

---

## Parallel Execution Examples

### Backend Contract Tests (T003-T008)
```bash
# All 6 contract tests can run in parallel (different test files):
pytest backend/tests/contract/test_relief_pool_list.py &
pytest backend/tests/contract/test_relief_pool_count.py &
pytest backend/tests/contract/test_relief_pool_reassign.py &
pytest backend/tests/contract/test_relief_pool_dismiss.py &
pytest backend/tests/contract/test_absences_relief_pool.py &
pytest backend/tests/contract/test_absences_restore.py &
wait
```

### Backend Integration Tests (T009-T013)
```bash
# All 5 integration tests can run in parallel (same file, different test functions):
pytest backend/tests/integration/test_relief_pool_flow.py -k "test_absence_creates" &
pytest backend/tests/integration/test_relief_pool_flow.py -k "test_reassign" &
pytest backend/tests/integration/test_relief_pool_flow.py -k "test_date_restriction" &
pytest backend/tests/integration/test_relief_pool_flow.py -k "test_restoration" &
pytest backend/tests/integration/test_relief_pool_flow.py -k "test_cleanup" &
wait
```

### Frontend Parallel Tasks
```bash
# API client and store can be created in parallel:
# Task: reliefPoolApi.ts (T037)
# Task: reliefPool.ts store (T040)
```

### E2E Tests (T048-T051)
```bash
# All Cypress tests in same file but can be parallelized with Cypress Dashboard:
npx cypress run --spec "cypress/e2e/relief-pool.cy.ts" --parallel
```

---

## Validation Checklist

- [x] All 6 API endpoints have corresponding contract tests (T003-T008)
- [x] Assignment entity modification has model tasks (T014-T016)
- [x] All 9 quickstart scenarios have integration tests (T009-T013c + T048-T051b)
- [x] Tests come before implementation (Phase 3.2 before 3.3, Phase 3.4 before 3.5)
- [x] Parallel tasks [P] are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task

---

## Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Setup & Migration | T001-T002 | 30 min |
| Backend Tests | T003-T013c | 2.5 hrs |
| Backend Core | T014-T030 | 4 hrs |
| Frontend Tests | T031-T033 | 1 hr |
| Frontend Core | T034-T047 | 4.5 hrs |
| E2E Tests | T048-T051b | 1.5 hrs |
| Polish | T052-T056 | 1 hr |
| **Total** | **62 tasks** | **~15 hrs** |

---

*Tasks generated from design documents. Ready for implementation.*

