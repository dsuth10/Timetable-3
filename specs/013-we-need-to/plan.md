
# Implementation Plan: Robust Export and Import System

**Branch**: `013-we-need-to` | **Date**: 2026-01-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-we-need-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

The Timetable application currently has a backup/export system with 4 formats (SQL, JSON, CSV, SQLite) but lacks import functionality. This feature adds a complete import system that allows administrators to restore backups to fresh installations while maintaining data integrity.

**Primary Requirements**:
- Verify and fix existing export formats (some may be broken)
- Build new import system supporting all 4 backup formats
- Enforce fresh-installation-only import (prevent data overwrite)
- Implement atomic rollback on import failure
- Add comprehensive validation (schema, foreign keys, file integrity)
- Support files up to 100MB with warnings at 50MB

**Technical Approach**:
- Backend: Extend existing `BackupService` with import methods
- Frontend: Add import UI to existing `BackupManagement` component
- Database: Use SQLAlchemy transactions for atomic rollback
- Validation: Multi-stage validation (format → schema → data → relationships)
- Progress tracking: Reuse existing progress system with import-specific states

## Technical Context
**Language/Version**: Python 3.12+ (backend), TypeScript strict mode (frontend)  
**Primary Dependencies**: Flask 3.x, SQLAlchemy 2.x, React 18+, Material-UI v5, Zustand  
**Storage**: SQLite (single file, local-first architecture)  
**Testing**: pytest with comprehensive coverage (backend), Vitest + React Testing Library (frontend)  
**Target Platform**: Desktop web application (Windows/Mac/Linux), local filesystem deployment
**Project Type**: web (frontend + backend architecture)  
**Performance Goals**: Import up to 100MB backup files, handle 10k+ records per table  
**Constraints**: Local-first (no network required), atomic transactions (rollback on failure), 100MB file size limit  
**Scale/Scope**: Single-school deployment (~50-100 teacher aides, ~1000 tasks, ~10k assignments per year)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

**I. Local-First Architecture** ✅ PASS
- Import/export operates entirely on local filesystem
- No network connectivity required
- Uses existing SQLite database
- Single HTML bundle for interface (existing)

**II. REST API Contract** ✅ PASS
- Will add new REST endpoints: POST `/api/backup/import`, GET `/api/backup/validate`
- Returns JSON with standard HTTP status codes (200, 400, 409, 500)
- Follows existing API patterns in `/api/backup/*`
- Error responses include detailed context (validation errors, rollback info)

**III. Comprehensive Testing** ⚠️ REQUIRED
- Backend: pytest coverage for all import methods and validation logic
- Frontend: Vitest + RTL for import UI components
- Integration tests: End-to-end import flow for all 4 formats
- Edge cases: File size limits, schema mismatches, rollback scenarios
- **Action**: Tests must be created before feature completion

**IV. Drag-and-Drop First Interface** N/A
- Not applicable to file upload/import feature
- Uses standard file upload interface (Material-UI)

**V. Accessibility & Inclusive Design** ✅ PASS
- Will use Material-UI components (WCAG AA compliant)
- File upload with keyboard navigation
- Progress indicators with ARIA labels
- Error messages with clear, accessible text
- Screen reader compatible status updates

**VI. Data Integrity & Conflict Prevention** ✅ PASS
- Atomic transactions with automatic rollback on failure
- Multi-stage validation before any data modification
- Fresh-installation check prevents accidental overwrites
- Foreign key validation ensures referential integrity
- Database constraints enforced at SQLAlchemy level

### Technology Stack Compliance ✅ PASS
- Uses existing stack: Flask, SQLAlchemy, React, TypeScript, Material-UI
- No new major dependencies required
- Extends existing `BackupService` and `BackupManagement` components
- Follows established patterns from export functionality

### Summary
**Status**: PASS with testing requirement  
**Violations**: None  
**Required Actions**: Comprehensive test coverage before feature completion (constitutional mandate)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
backend/
├── api/
│   ├── models/           # SQLAlchemy ORM models
│   ├── routes/
│   │   └── backup.py     # Existing: POST /create, GET /progress, GET /download
│   │                     # NEW: POST /import, POST /validate, DELETE /data
│   ├── services/
│   │   └── backup_service.py  # EXTEND: Add import methods
│   └── instance/
│       ├── timetable.db  # SQLite database
│       └── backups/      # Backup file storage
└── tests/
    ├── test_backup_service.py     # EXTEND: Add import tests
    └── test_backup_routes.py      # EXTEND: Add import endpoint tests

frontend/
├── src/
│   ├── components/
│   │   └── Management/
│   │       └── BackupManagement.tsx  # EXTEND: Add import UI
│   ├── services/
│   │   └── backupService.ts     # EXTEND: Add import API calls
│   └── types/
│       └── backup.ts            # EXTEND: Add import types
└── tests/
    └── components/
        └── Management/
            └── BackupManagement.test.tsx  # EXTEND: Add import tests
```

**Structure Decision**: Web application architecture (frontend + backend). Import functionality extends existing backup system components rather than creating new files. Key modifications:
- **Backend**: Extend `BackupService` class with import methods for each format (SQL, JSON, CSV, SQLite)
- **Backend**: Add 3 new REST endpoints to existing `backup.py` routes
- **Frontend**: Add import section to existing `BackupManagement` component
- **Frontend**: Extend `backupService.ts` with import API methods

This approach maintains consistency with existing backup/export architecture and minimizes new file creation.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

The `/tasks` command will generate implementation tasks organized by these categories:

### 1. Export Verification Tasks (FR-009)
- **Task 1**: Test SQL export format - verify all tables, data integrity
- **Task 2**: Test JSON export format - verify structure, relationships
- **Task 3**: Test CSV export format - verify ZIP contents, encoding
- **Task 4**: Test SQLite export format - verify compression, restorability
- **Task 5**: Fix any broken export formats identified

**Rationale**: Must verify existing functionality before building import

### 2. Backend Validation Infrastructure (FR-012, FR-023-027)
- **Task 6** [P]: Create `ValidationResult` and `ValidationStage` classes
- **Task 7** [P]: Create `ImportValidator` class with 4-stage pipeline
- **Task 8**: Implement Stage 1 - File Format Validation
- **Task 9**: Implement Stage 2 - Schema Validation
- **Task 10**: Implement Stage 3 - Data Type Validation
- **Task 11**: Implement Stage 4 - Referential Integrity Validation
- **Task 12** [P]: Write unit tests for each validation stage

**Rationale**: TDD approach - validation logic before import logic

### 3. Backend Import Service (FR-010-011, FR-016-018)
- **Task 13**: Extend `BackupService` with `import_backup()` method
- **Task 14**: Implement `import_sql()` - SQLite script execution
- **Task 15**: Implement `import_json()` - bulk insert with SQLAlchemy
- **Task 16**: Implement `import_csv()` - parse ZIP and import
- **Task 17**: Implement `import_sqlite_gz()` - decompress and copy
- **Task 18**: Implement transaction rollback mechanism
- **Task 19**: Implement database emptiness check (FR-015)
- **Task 20** [P]: Write unit tests for each import format
- **Task 21** [P]: Write integration test for rollback on failure

**Rationale**: Core import functionality with atomic transaction support

### 4. Backend API Endpoints (FR-010, FR-013)
- **Task 22**: Add POST `/api/backup/validate` endpoint
- **Task 23**: Add POST `/api/backup/import` endpoint
- **Task 24**: Add GET `/api/backup/import/{id}/progress` endpoint
- **Task 25**: Add POST `/api/backup/import/{id}/cancel` endpoint
- **Task 26**: Add GET `/api/backup/check-database` endpoint
- **Task 27** [P]: Write contract tests for all new endpoints

**Rationale**: REST API following OpenAPI specification

### 5. Frontend Import UI (FR-013, FR-028-030)
- **Task 28**: Extend `BackupManagement.tsx` with import section
- **Task 29**: Create file upload component with drag-drop support
- **Task 30**: Implement file size validation (50MB warning, 100MB reject)
- **Task 31**: Create import progress component with real-time updates
- **Task 32**: Implement error message display with retry button
- **Task 33**: Implement success message with records summary
- **Task 34**: Add database emptiness check before import
- **Task 35** [P]: Write component tests for import UI

**Rationale**: User-facing import interface with progress tracking

### 6. Frontend API Integration (FR-014, FR-021)
- **Task 36**: Extend `backupService.ts` with import API methods
- **Task 37**: Implement progress polling logic (1-second interval)
- **Task 38**: Implement cancel import functionality
- **Task 39**: Add error handling and user feedback
- **Task 40**: Implement global state refresh after import
- **Task 41** [P]: Write service tests for API integration

**Rationale**: Connect frontend UI to backend APIs

### 7. Integration Testing (All FRs)
- **Task 42**: Test Scenario 1 - Fresh installation import (happy path)
- **Task 43**: Test Scenario 2 - Prevent import to non-empty database
- **Task 44**: Test Scenario 3 - File size validation (50MB, 100MB)
- **Task 45**: Test Scenario 4 - Invalid backup validation
- **Task 46**: Test Scenario 5 - Import failure and rollback
- **Task 47**: Test Scenario 6 - Schema version mismatch warning
- **Task 48**: Test Scenario 7 - All four import formats
- **Task 49**: Test Scenario 8 - Cancel import in progress
- **Task 50**: Test Scenario 9 - Progress tracking and refresh
- **Task 51**: Test Scenario 10 - Data refresh after import

**Rationale**: End-to-end validation of all requirements from quickstart.md

### 8. Documentation and Finalization
- **Task 52**: Update API documentation (Swagger/OpenAPI)
- **Task 53**: Update user manual with import instructions
- **Task 54**: Create troubleshooting guide
- **Task 55**: Performance testing and optimization
- **Task 56**: Final constitution compliance check

**Ordering Strategy**:
1. **Export Verification First** (Tasks 1-5): Must validate existing functionality
2. **Validation Before Import** (Tasks 6-12): TDD - validators before implementations
3. **Backend Before Frontend** (Tasks 13-27 before 28-41): API must exist for UI to call
4. **Tests Alongside Implementation**: Mark [P] for parallel test development
5. **Integration Last** (Tasks 42-51): Requires all components complete

**Estimated Output**: 56 numbered, ordered tasks in tasks.md

**Dependencies**:
- Tasks 1-5 can run in parallel (different export formats)
- Tasks 6, 7, 12 can run in parallel (independent classes/tests)
- Tasks 13-17 depend on Task 13 (base method)
- Tasks 20-21 can run in parallel (independent tests)
- Tasks 22-27 depend on Tasks 13-19 (service must exist)
- Tasks 28-35 depend on Tasks 22-26 (API must exist)
- Tasks 42-51 depend on all previous tasks (full integration)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [x] Phase 3: Tasks generated (/tasks command) ✅
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented ✅ (None required)

**Artifacts Generated**:
- [x] research.md - Technical decisions and architecture research
- [x] data-model.md - Data structures and validation rules
- [x] contracts/import-api.yaml - OpenAPI specification for import endpoints
- [x] quickstart.md - End-to-end testing scenarios
- [x] .cursor/rules/specify-rules.mdc - Updated agent context
- [x] tasks.md - 76 implementation tasks with dependencies and parallel execution

**Next Step**: Begin implementation starting with T001-T004 (export verification)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
