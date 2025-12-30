
# Implementation Plan: Delete Recurring Assignment Instances for Specific Aide

**Branch**: `010-we-need-to` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-we-need-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Success
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: web (frontend + backend)
   → Structure: Option 2 (Web application)
3. Fill the Constitution Check section based on constitution document.
   → Completed
4. Evaluate Constitution Check section below
   → No violations found
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md
   → All clarifications resolved in spec.md
   → research.md generated with 6 decisions
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → contracts/delete-recurring-series-for-aide.md generated
   → data-model.md generated (no schema changes)
   → quickstart.md generated with 5 test scenarios
7. Re-evaluate Constitution Check section
   → No new violations
   → Update Progress Tracking: Post-Design Constitution Check ✓
8. Plan Phase 2 → Describe task generation approach
   → Described below (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary

Add a fourth deletion option "Remove this and future recurring instances for this aide" to the Task Delete Dialog. This allows administrators to delete all future recurring assignments for a specific aide without affecting other aides' assignments or the task template. The solution uses existing database relationships (`recurring_series_id`, `aide_id`, `original_aide_id`) and adds a single new backend endpoint.

## Technical Context
**Language/Version**: Python 3.12+ (Backend), TypeScript (Strict Mode) (Frontend)
**Primary Dependencies**: Flask, SQLAlchemy, Material-UI v5, Zustand, @hello-pangea/dnd
**Storage**: SQLite (`backend/instance/timetable.db`)
**Testing**: pytest (backend), Vitest + RTL (frontend)
**Target Platform**: Desktop web application
**Project Type**: web (frontend + backend)
**Performance Goals**: N/A (single-request delete operation)
**Constraints**: Offline-capable, single-user, no authentication
**Scale/Scope**: Typically <100 recurring assignments per series

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First Architecture | ✓ PASS | No external dependencies; uses local SQLite |
| II. REST API Contract | ✓ PASS | New endpoint follows REST patterns with JSON response |
| III. Comprehensive Testing | ✓ PASS | Contract tests + unit tests planned |
| IV. Drag-and-Drop First | N/A | Delete operation accessed via context menu/dialog |
| V. Accessibility | ✓ PASS | Dialog with radio buttons maintains keyboard nav |
| VI. Data Integrity | ✓ PASS | Atomic deletion in single transaction; version check |

## Project Structure

### Documentation (this feature)
```
specs/010-we-need-to/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command) ✓
├── data-model.md        # Phase 1 output (/plan command) ✓
├── quickstart.md        # Phase 1 output (/plan command) ✓
├── contracts/           # Phase 1 output (/plan command) ✓
│   └── delete-recurring-series-for-aide.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
backend/
├── api/
│   ├── routes/
│   │   └── assignments.py      # Add DELETE /{id}/recurring-series-for-aide
│   └── services/
│       └── assignment_service.py  # New: deletion logic
└── tests/
    ├── contract/
    │   └── test_delete_recurring_series_for_aide.py
    └── unit/
        └── test_assignment_series_delete.py

frontend/
├── src/
│   ├── components/
│   │   └── TaskModals/
│   │       └── TaskDeleteDialog.tsx  # Add 4th deletion option
│   └── services/
│       └── assignmentsApi.ts         # Add deleteRecurringSeriesForAide()
└── tests/
    └── components/
        └── TaskDeleteDialog.test.tsx  # Add tests for new option
```

**Structure Decision**: Web application structure (Option 2) - frontend and backend directories with separate test hierarchies.

## Phase 0: Outline & Research

### Extracted Unknowns
- ✓ How to detect if an assignment was manually modified from the recurring series pattern
- ✓ How to handle Relief Pool assignments (include if `original_aide_id` matches)
- ✓ Whether to delete past or future assignments (future only, based on clarification)

### Research Tasks Completed
All research documented in `research.md`:
1. Delete operation strategy → Single backend endpoint with atomic transaction
2. Modification detection → Compare `start_time`/`end_time` with series template
3. Relief Pool handling → Include if `original_aide_id` matches target aide
4. UI option visibility → Show only when `recurring_series_id` is not null
5. API response format → Include counts for deleted and skipped assignments
6. Preview mode → Support `?preview=true` for count before deletion

**Output**: research.md ✓

## Phase 1: Design & Contracts

### Entities
No new entities. Uses existing:
- `Assignment` (existing model)
- `RecurringSeries` (existing model)
- `Task` (existing model, not modified by this operation)

### API Contracts
Single new endpoint:
- `DELETE /api/assignments/{id}/recurring-series-for-aide` - documented in contracts/

### Contract Tests Planned
- `test_delete_recurring_series_for_aide.py`:
  - Test successful deletion returns count
  - Test preview mode returns would-delete count
  - Test non-recurring assignment returns 400
  - Test version mismatch returns 409
  - Test modified assignments are skipped
  - Test past assignments are preserved

### Test Scenarios from User Stories
1. Basic deletion flow (4 weeks → delete 3 future)
2. Non-recurring assignment (option hidden)
3. Modified assignment preserved
4. Relief Pool assignments included
5. Past assignments preserved

**Output**: data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate TDD-style tasks from Phase 1 design docs

**Estimated Tasks**:

| Phase | Tasks |
|-------|-------|
| Setup & Failing Tests | 3 tasks (backend contract, backend unit, frontend component) |
| Backend Implementation | 3 tasks (service, route, integration) |
| Frontend Implementation | 3 tasks (API function, dialog update, count preview) |
| Integration & Polish | 2 tasks (E2E test, quickstart verification) |
| **Total** | ~11 tasks |

**Ordering Strategy**:
- TDD order: Tests before implementation
- Backend before frontend (frontend calls backend)
- Mark [P] for parallel execution where independent

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md)

## Complexity Tracking
*No complexity violations identified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | - | - |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - 12 tasks created
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
