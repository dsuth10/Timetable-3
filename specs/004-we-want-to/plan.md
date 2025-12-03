# Implementation Plan: Relief Pool - Absent Aide Task Reassignment

**Branch**: `004-we-want-to` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-we-want-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded spec.md with 16 functional requirements
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ All context filled from existing codebase
3. Fill Constitution Check section
   → ✅ Checked against constitution.md
4. Evaluate Constitution Check
   → ✅ PASS - No violations
5. Execute Phase 0 → research.md
   → ✅ Complete
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → ✅ Complete
7. Re-evaluate Constitution Check
   → ✅ PASS - Design compliant
8. Plan Phase 2 → Describe task approach
   → ✅ Complete
9. STOP - Ready for /tasks command
```

## Summary

This feature introduces the **Relief Pool** - a secondary task bank that captures "orphaned" assignments when teacher aides are marked absent. Unlike the current behavior (which simply unassigns tasks, losing their time context), the Relief Pool preserves all assignment details (time, date, classroom, original aide) and enables date-restricted reassignment to other aides. Tasks auto-expire after their scheduled day ends.

**Key Technical Approach**:
- Add new assignment status `RELIEF_POOL` to track orphaned assignments
- Store original aide reference in new `original_aide_id` column
- Modify absence cascade to set status=RELIEF_POOL instead of UNASSIGNED
- Create new API endpoint to fetch Relief Pool tasks
- Add Relief Pool tab to Task Bank UI with date grouping
- Implement date-restricted drag-and-drop validation
- Background job for end-of-day cleanup

## Technical Context
**Language/Version**: Python 3.12+, TypeScript (strict mode)  
**Primary Dependencies**: Flask 3.x, SQLAlchemy 2.x, React 18, Material-UI v5, @hello-pangea/dnd, Zustand  
**Storage**: SQLite (local file)  
**Testing**: pytest (backend), Vitest + RTL (frontend), Cypress (E2E)  
**Target Platform**: Desktop browser (offline-first)
**Project Type**: Web (frontend + backend)  
**Performance Goals**: Real-time updates, <200ms UI response  
**Constraints**: Offline-capable, single SQLite file, no authentication for MVP  
**Scale/Scope**: Single school, ~20-50 aides, ~100-200 daily tasks

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Local-First Architecture** | ✅ PASS | SQLite storage, no external dependencies |
| **II. REST API Contract** | ✅ PASS | New endpoints follow existing patterns |
| **III. Comprehensive Testing** | ✅ PASS | Contract + integration tests planned |
| **IV. Drag-and-Drop First** | ✅ PASS | Relief Pool uses existing DnD infrastructure |
| **V. Accessibility (WCAG AA)** | ✅ PASS | Tab-based UI follows existing accessible patterns |
| **VI. Data Integrity** | ✅ PASS | Atomic absence cascade, conflict detection |

**No violations detected.**

## Project Structure

### Documentation (this feature)
```
specs/004-we-want-to/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   └── relief-pool-api.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
backend/
├── api/
│   ├── models/
│   │   └── assignment.py      # Add RELIEF_POOL status, original_aide_id
│   ├── routes/
│   │   ├── absences.py        # Modify cascade behavior
│   │   └── relief_pool.py     # NEW: Relief Pool endpoints
│   ├── services/
│   │   ├── absence_service.py # Modify to use RELIEF_POOL status
│   │   └── relief_pool_service.py  # NEW: Cleanup, restoration logic
│   └── scheduler.py           # Add cleanup job
├── migrations/                # Alembic migration for new column
└── tests/
    ├── contract/
    │   └── test_relief_pool.py  # NEW
    └── integration/
        └── test_relief_pool_flow.py  # NEW

frontend/
├── src/
│   ├── components/
│   │   ├── Layout/SidePanel/
│   │   │   ├── TaskBank.tsx        # Add tab navigation
│   │   │   └── ReliefPoolTab.tsx   # NEW: Relief Pool display
│   │   └── TimetableGrid/
│   │       └── TimetableSlot.tsx   # Modify drop validation
│   ├── services/
│   │   └── reliefPoolApi.ts        # NEW: API client
│   ├── store/stores/
│   │   └── reliefPool.ts           # NEW: Zustand store
│   └── types/
│       └── index.ts                # Add ReliefPoolTask type
└── tests/
    └── components/
        └── ReliefPoolTab.test.tsx  # NEW
```

**Structure Decision**: Web application with existing backend/frontend split. New files follow established patterns.

## Phase 0: Outline & Research

### Research Questions Resolved

1. **How to track Relief Pool assignments?**
   - **Decision**: Add `RELIEF_POOL` to ASSIGNMENT_STATUSES enum
   - **Rationale**: Minimal schema change, leverages existing assignment infrastructure
   - **Alternatives**: New ReliefPoolTask table (rejected - duplicates data), Boolean flag (rejected - less explicit)

2. **How to preserve original aide reference?**
   - **Decision**: Add `original_aide_id` column to Assignment model
   - **Rationale**: Enables restoration when absence is cancelled
   - **Alternatives**: Store in separate audit table (rejected - overcomplicated for MVP)

3. **How to implement date-restricted reassignment?**
   - **Decision**: Frontend validation + backend enforcement on assignment update
   - **Rationale**: Provides immediate UX feedback and backend safety
   - **Alternatives**: Frontend-only (rejected - security risk)

4. **How to implement auto-cleanup?**
   - **Decision**: Extend existing APScheduler job to include Relief Pool cleanup
   - **Rationale**: Reuses existing background scheduler infrastructure
   - **Alternatives**: Database trigger (rejected - SQLite limitations), Cron (rejected - external dependency)

5. **How to handle absence restoration?**
   - **Decision**: On absence DELETE, attempt to restore RELIEF_POOL assignments to original aide if slots available
   - **Rationale**: Provides seamless UX for accidental absence marks
   - **Alternatives**: Manual-only restoration (rejected - poor UX)

**Output**: research.md (see separate file)

## Phase 1: Design & Contracts

### Data Model Changes
See `data-model.md` for full entity definitions.

**Key Changes**:
- `Assignment.status` enum: Add `RELIEF_POOL`
- `Assignment.original_aide_id`: New nullable FK to TeacherAide
- Index on `(status, date)` for efficient Relief Pool queries

### API Contracts
See `contracts/relief-pool-api.md` for OpenAPI-style definitions.

**New Endpoints**:
- `GET /api/relief-pool` - List all Relief Pool tasks (grouped by date)
- `POST /api/relief-pool/{id}/reassign` - Reassign with date validation
- `POST /api/relief-pool/{id}/dismiss` - Mark as dismissed
- `GET /api/relief-pool/count` - Get pending count for badge

**Modified Endpoints**:
- `POST /api/absences` - Cascade now sets RELIEF_POOL instead of UNASSIGNED
- `DELETE /api/absences/{id}` - Attempt restoration of RELIEF_POOL tasks

### Test Scenarios
See `quickstart.md` for integration test scenarios.

**Output**: data-model.md, contracts/relief-pool-api.md, quickstart.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Generate contract tests for each new endpoint (4 tests)
- Generate model migration task for schema changes
- Generate service layer tasks for Relief Pool logic
- Generate frontend component tasks (ReliefPoolTab, store, API client)
- Generate integration tests for each user story (6 scenarios)
- Implementation tasks follow TDD order

**Ordering Strategy**:
1. **Backend Foundation** [P]: Migration, model changes, service layer
2. **Backend API** [P]: New endpoints, modified absence endpoints
3. **Backend Tests**: Contract tests, integration tests
4. **Frontend Foundation** [P]: Types, API client, Zustand store
5. **Frontend UI**: ReliefPoolTab component, TaskBank modifications
6. **Frontend Integration**: Drag-drop validation, date restriction
7. **E2E Tests**: Cypress tests for full flow

**Estimated Output**: 18-22 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitution violations - table empty*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | - | - |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - 62 tasks in tasks.md
- [x] Phase 4: Implementation complete (/implement command)
- [ ] Phase 5: Validation passed (manual testing pending)

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
