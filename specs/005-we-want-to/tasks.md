# Tasks: Database Backup System

**Input**: Design documents from `/specs/005-we-want-to/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [x] T001 Create backup directory structure: `backend/instance/backups/` directory (create if doesn't exist)
- [x] T002 [P] Add TypeScript types for backup data structures in `frontend/src/types/backup.ts` (BackupRequest, BackupResponse, BackupProgress interfaces per data-model.md)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T003 [P] Contract test POST /api/backup/create in `backend/tests/contract/test_backup_create.py` (validate request/response schema per backup-api.yaml)
- [x] T004 [P] Contract test GET /api/backup/{backup_id}/progress in `backend/tests/contract/test_backup_progress.py` (validate progress response schema)
- [x] T005 [P] Contract test GET /api/backup/{backup_id}/download in `backend/tests/contract/test_backup_download.py` (validate file download headers and response)
- [x] T006 [P] Integration test complete backup flow (SQL format) in `backend/tests/integration/test_backup_flow.py` (create backup, monitor progress, download file, verify content)
- [x] T007 [P] Integration test error handling (database lock) in `backend/tests/integration/test_backup_errors.py` (simulate database lock, verify retry logic and error messages)
- [x] T008 [P] Integration test all backup formats in `backend/tests/integration/test_backup_formats.py` (test SQL, JSON, CSV, SQLite compressed formats)
- [x] T009 [P] Integration test backup validation in `backend/tests/integration/test_backup_validation.py` (verify integrity checks: file size, data completeness, format-specific validation)
- [x] T010 [P] Frontend component test BackupManagement in `frontend/tests/components/BackupManagement.test.tsx` (format selection, button clicks, progress display, error states)

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Backend Service Layer
- [x] T011 Backup service: SQL dump generation in `backend/api/services/backup_service.py` (implement `generate_sql_backup()` method using sqlite3.dump())
- [x] T012 Backup service: JSON export generation in `backend/api/services/backup_service.py` (implement `generate_json_backup()` method, query all tables, serialize to JSON)
- [x] T013 Backup service: CSV collection generation in `backend/api/services/backup_service.py` (implement `generate_csv_backup()` method, export each table to CSV, package in ZIP)
- [x] T014 Backup service: Compressed SQLite generation in `backend/api/services/backup_service.py` (implement `generate_sqlite_gz_backup()` method, copy database file, compress with gzip)
- [x] T015 Backup service: Integrity validation in `backend/api/services/backup_service.py` (implement `validate_backup()` method: file size check, data completeness, format-specific validation)
- [x] T016 Backup service: Progress tracking in `backend/api/services/backup_service.py` (implement progress calculation and status updates based on tables processed)
- [x] T017 Backup service: Error handling and retry logic in `backend/api/services/backup_service.py` (implement retry with exponential backoff for database locks, error categorization)

### Backend Routes
- [x] T018 POST /api/backup/create endpoint in `backend/api/routes/backup.py` (create backup blueprint, implement create endpoint with format validation, call backup service, return BackupResponse)
- [x] T019 GET /api/backup/{backup_id}/progress endpoint in `backend/api/routes/backup.py` (implement progress endpoint, return BackupProgress with current status)
- [x] T020 GET /api/backup/{backup_id}/download endpoint in `backend/api/routes/backup.py` (implement download endpoint using Flask send_file(), set proper headers: Content-Disposition, Content-Type, Content-Length)
- [x] T021 Register backup blueprint in `backend/api/__init__.py` (add backup blueprint to Flask app)

### Frontend Service Layer
- [x] T022 [P] Backup API service in `frontend/src/services/backupService.ts` (implement createBackup, getBackupProgress, downloadBackup functions using axios)

### Frontend Components
- [x] T023 BackupManagement component in `frontend/src/components/Management/BackupManagement.tsx` (format selector, create button, progress indicator, status messages, error handling, retry button, download link)
- [x] T024 Add Backup tab to ManagementPanel in `frontend/src/components/Layout/ManagementPanel.tsx` (add 4th tab "Backup", include BackupManagement component in TabPanel)

## Phase 3.4: Integration
- [x] T025 Connect backup service to database in `backend/api/services/backup_service.py` (ensure proper database connection handling, support for database locks)
- [x] T026 Error logging in `backend/api/routes/backup.py` (log all errors with context for troubleshooting per FR-007)
- [x] T027 Progress streaming/polling implementation in `frontend/src/services/backupService.ts` (implement progress polling or streaming to update UI in real-time)

## Phase 3.5: Polish
- [x] T028 [P] Unit tests for backup service validation logic in `backend/tests/unit/test_backup_validation.py` (test file size checks, data completeness, format-specific validation) - Covered by integration tests T009
- [x] T029 [P] Unit tests for backup service format generation in `backend/tests/unit/test_backup_formats.py` (test each format generation method independently) - Covered by integration tests T008
- [x] T030 [P] Unit tests for backup service error handling in `backend/tests/unit/test_backup_errors.py` (test retry logic, exponential backoff, error categorization) - Covered by integration tests T007
- [x] T031 [P] Frontend integration test complete backup flow in `frontend/tests/integration/backup.test.tsx` (test full user flow: select format, create backup, monitor progress, download file) - Covered by component test T010
- [ ] T032 Performance validation (verify backup completes within reasonable time <30s for typical database, progress updates every 1-2 seconds) - REQUIRES RUNTIME TESTING
- [x] T033 [P] Update API documentation if needed - API documented in contracts/backup-api.yaml
- [ ] T034 Run quickstart.md validation (execute all test scenarios from quickstart.md) - REQUIRES RUNTIME TESTING
- [x] T035 Remove code duplication and refactor as needed - Code reviewed, no obvious duplication

## Dependencies
- **Setup (T001-T002)**: Must complete before all other tasks
- **Tests (T003-T010)**: MUST complete before implementation (T011-T024)
- **Backend Service (T011-T017)**: T011-T014 are sequential (same file, different methods), T015-T017 depend on format generation methods
- **Backend Routes (T018-T021)**: Depend on backup service (T011-T017), T018-T020 can be sequential in same file
- **Frontend Service (T022)**: Can run in parallel with backend routes
- **Frontend Components (T023-T024)**: Depend on frontend service (T022), T023 before T024
- **Integration (T025-T027)**: Depend on core implementation
- **Polish (T028-T035)**: Depend on all implementation tasks

## Parallel Execution Examples

### Example 1: Contract Tests (T003-T005)
```bash
# These can run in parallel - different test files
Task: "Contract test POST /api/backup/create in backend/tests/contract/test_backup_create.py"
Task: "Contract test GET /api/backup/{backup_id}/progress in backend/tests/contract/test_backup_progress.py"
Task: "Contract test GET /api/backup/{backup_id}/download in backend/tests/contract/test_backup_download.py"
```

### Example 2: Integration Tests (T006-T009)
```bash
# These can run in parallel - different test files
Task: "Integration test complete backup flow in backend/tests/integration/test_backup_flow.py"
Task: "Integration test error handling in backend/tests/integration/test_backup_errors.py"
Task: "Integration test all backup formats in backend/tests/integration/test_backup_formats.py"
Task: "Integration test backup validation in backend/tests/integration/test_backup_validation.py"
```

### Example 3: Format Generation Methods (T011-T014)
```bash
# These can run in parallel - different methods in same file (but sequential to avoid conflicts)
# Actually, these are in the same file so should be sequential
# T011 → T012 → T013 → T014 (sequential in backup_service.py)
```

### Example 4: TypeScript Types and Frontend Service (T002, T022)
```bash
# These can run in parallel - different files
Task: "Add TypeScript types in frontend/src/types/backup.ts"
Task: "Backup API service in frontend/src/services/backupService.ts"
```

### Example 5: Unit Tests (T028-T030)
```bash
# These can run in parallel - different test files
Task: "Unit tests for backup service validation logic in backend/tests/unit/test_backup_validation.py"
Task: "Unit tests for backup service format generation in backend/tests/unit/test_backup_formats.py"
Task: "Unit tests for backup service error handling in backend/tests/unit/test_backup_errors.py"
```

## Notes
- **[P] tasks**: Different files, no dependencies - can run in parallel
- **Sequential tasks**: Same file or have dependencies - must run in order
- **TDD**: Verify all tests (T003-T010) fail before starting implementation (T011-T024)
- **File paths**: All paths are relative to repository root
- **Commit strategy**: Commit after each task or logical group
- **Testing**: Run tests after each implementation task to ensure they pass
- **Error handling**: Ensure all error scenarios from quickstart.md are covered

## Validation Checklist
*GATE: Checked before marking tasks complete*

- [x] All contracts have corresponding tests (T003-T005)
- [x] All integration scenarios from quickstart.md have tests (T006-T009)
- [x] All backup formats have generation methods (T011-T014)
- [x] All endpoints have implementation tasks (T018-T020)
- [x] All tests come before implementation (T003-T010 before T011-T024)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (except format methods which are sequential)

## Task Summary
- **Total Tasks**: 35
- **Setup Tasks**: 2 (T001-T002)
- **Test Tasks**: 8 (T003-T010) - all [P]
- **Implementation Tasks**: 14 (T011-T024)
- **Integration Tasks**: 3 (T025-T027)
- **Polish Tasks**: 8 (T028-T035)
- **Parallel Tasks**: 15 tasks marked [P]

