# Tasks: Robust Export and Import System

**Feature Branch**: `013-we-need-to`  
**Date**: 2026-01-24  
**Input**: Design documents from `/specs/013-we-need-to/`  
**Prerequisites**: plan.md, research.md, data-model.md, contracts/import-api.yaml, quickstart.md

## Execution Summary

This task list implements a complete backup import system for the Timetable application. The system:
- Extends existing export functionality with comprehensive validation
- Adds import support for all 4 backup formats (SQL, JSON, CSV, SQLite)
- Enforces fresh-installation-only imports with atomic rollback
- Provides real-time progress tracking and clear error messages

**Total Tasks**: 76  
**Estimated Duration**: 10-15 business days (2 developers working in parallel)  
**Test-Driven**: 39 test tasks (51% of total)

---

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- File paths relative to repository root unless otherwise noted
- Each task includes acceptance criteria and file locations

---

## Phase 3.1: Export Verification (FR-009)

**Purpose**: Validate existing export functionality before building import

- [X] **T001** Test SQL export format for all tables  
  **Files**: Manual test using `backend/api/services/backup_service.py`  
  **Criteria**: SQL dump contains all 8 tables with valid INSERT statements  
  **Acceptance**: Can open `.sql` file and see CREATE TABLE + INSERT for teacher_aides, tasks, assignments, classrooms, absences, availability, requests, recurring_series

- [X] **T002** Test JSON export format structure and relationships  
  **Files**: Manual test using `backend/api/services/backup_service.py`  
  **Criteria**: JSON contains all 8 table arrays with complete records  
  **Acceptance**: JSON validates against schema, all foreign key IDs present

- [X] **T003** Test CSV export format (ZIP contents and encoding)  
  **Files**: Manual test using `backend/api/services/backup_service.py`  
  **Criteria**: ZIP contains 8 CSV files, all UTF-8 encoded, headers correct  
  **Acceptance**: Can extract ZIP, open CSVs in Excel/LibreOffice without corruption

- [X] **T004** Test SQLite export format (compression and restorability)  
  **Files**: Manual test using `backend/api/services/backup_service.py`  
  **Criteria**: `.db.gz` decompresses to valid SQLite database  
  **Acceptance**: Can decompress and open database file with sqlite3 CLI

- [X] **T005** Fix any broken export formats identified in T001-T004  
  **Files**: `backend/api/services/backup_service.py`  
  **Criteria**: All 4 export formats produce valid, complete backups  
  **Acceptance**: Re-run T001-T004, all pass

**Dependencies**: None (can start immediately)  
**Parallel**: T001-T004 can run in parallel with different test backups

---

## Phase 3.2: Backend Validation Infrastructure (FR-012, FR-023-027)

**Purpose**: Build validation classes and tests (TDD)

### Test Tasks (Write These First!)

- [X] **T006** [P] Unit test for ValidationResult dataclass  
  **Files**: `backend/tests/unit/test_validation_result.py` (NEW)  
  **Criteria**: Test all fields, stage enum values, serialization  
  **Acceptance**: Tests fail (class doesn't exist yet), coverage 100%

- [X] **T007** [P] Unit test for ImportValidator Stage 1 (format validation)  
  **Files**: `backend/tests/unit/test_import_validator_format.py` (NEW)  
  **Criteria**: Test valid/invalid file extensions, magic bytes, corrupted files  
  **Acceptance**: Tests fail, cover all 4 formats + edge cases

- [X] **T008** [P] Unit test for ImportValidator Stage 2 (schema validation)  
  **Files**: `backend/tests/unit/test_import_validator_schema.py` (NEW)  
  **Criteria**: Test missing tables, wrong columns, schema version mismatch  
  **Acceptance**: Tests fail, cover all 8 required tables

- [X] **T009** [P] Unit test for ImportValidator Stage 3 (data type validation)  
  **Files**: `backend/tests/unit/test_import_validator_types.py` (NEW)  
  **Criteria**: Test invalid types, invalid enums, malformed dates/times  
  **Acceptance**: Tests fail, cover all field types

- [X] **T010** [P] Unit test for ImportValidator Stage 4 (referential integrity)  
  **Files**: `backend/tests/unit/test_import_validator_relationships.py` (NEW)  
  **Criteria**: Test broken foreign keys, circular references, duplicate keys  
  **Acceptance**: Tests fail, cover all FK relationships

### Implementation Tasks (Make Tests Pass)

- [X] **T011** Create ValidationResult and ValidationStage classes  
  **Files**: `backend/api/models/validation.py` (NEW)  
  **Criteria**: Dataclasses matching data-model.md specification  
  **Acceptance**: T006 tests pass, classes serialize to JSON correctly

- [X] **T012** Create ImportValidator class with 4-stage pipeline  
  **Files**: `backend/api/services/import_validator.py` (NEW)  
  **Criteria**: Empty class with method stubs for 4 validation stages  
  **Acceptance**: Can instantiate validator, methods exist but not implemented

- [X] **T013** Implement Stage 1: File Format Validation  
  **Files**: `backend/api/services/import_validator.py`  
  **Criteria**: Validates file extension, magic bytes, can open file  
  **Acceptance**: T007 tests pass, detects all 4 formats correctly

- [X] **T014** Implement Stage 2: Schema Validation  
  **Files**: `backend/api/services/import_validator.py`  
  **Criteria**: Validates all 8 tables present, columns correct, schema version  
  **Acceptance**: T008 tests pass, returns detailed error for missing tables

- [X] **T015** Implement Stage 3: Data Type Validation  
  **Files**: `backend/api/services/import_validator.py`  
  **Criteria**: Validates types, enums, date/time formats for all fields  
  **Acceptance**: T009 tests pass, catches type mismatches

- [X] **T016** Implement Stage 4: Referential Integrity Validation  
  **Files**: `backend/api/services/import_validator.py`  
  **Criteria**: Builds FK maps, validates all references, detects orphans  
  **Acceptance**: T010 tests pass, identifies all broken FKs

**Dependencies**:  
- T006-T010 can run in parallel (different test files)
- T011 before T012-T016
- T012 before T013-T016
- T007 blocks T013, T008 blocks T014, T009 blocks T015, T010 blocks T016

**Parallel**: T006-T010 (tests), T013-T016 (after T012, different methods)

---

## Phase 3.3: Backend Import Service (FR-010-011, FR-016-018)

**Purpose**: Implement core import functionality with atomic rollback

### Test Tasks (Write These First!)

- [X] **T017** [P] Unit test for import_sql method  
  **Files**: `backend/tests/unit/test_import_service_sql.py` (NEW)  
  **Criteria**: Test SQL script execution, error handling, rollback  
  **Acceptance**: Tests fail, cover valid SQL and invalid SQL cases

- [X] **T018** [P] Unit test for import_json method  
  **Files**: `backend/tests/unit/test_import_service_json.py` (NEW)  
  **Criteria**: Test bulk insert, ID preservation, relationship order  
  **Acceptance**: Tests fail, cover all 8 tables in dependency order

- [X] **T019** [P] Unit test for import_csv method  
  **Files**: `backend/tests/unit/test_import_service_csv.py` (NEW)  
  **Criteria**: Test ZIP extraction, CSV parsing, NULL handling  
  **Acceptance**: Tests fail, cover encoding issues and malformed CSV

- [X] **T020** [P] Unit test for import_sqlite_gz method  
  **Files**: `backend/tests/unit/test_import_service_sqlite.py` (NEW)  
  **Criteria**: Test decompression, table-by-table copy, schema match  
  **Acceptance**: Tests fail, cover corrupted gzip files

- [X] **T021** [P] Integration test for transaction rollback on failure  
  **Files**: `backend/tests/integration/test_import_rollback.py` (NEW)  
  **Criteria**: Test mid-import failure, verify all changes rolled back  
  **Acceptance**: Tests fail, use sample that fails at table 5 of 8

- [X] **T022** [P] Integration test for database emptiness check  
  **Files**: `backend/tests/integration/test_database_emptiness.py` (NEW)  
  **Criteria**: Test with empty DB (pass), with data (block), partial data (block)  
  **Acceptance**: Tests fail, cover all 3 scenarios

### Implementation Tasks (Make Tests Pass)

- [X] **T023** Extend BackupService with import_backup base method  
  **Files**: `backend/api/services/backup_service.py`  
  **Criteria**: Add method signature, progress tracking setup, validation call  
  **Acceptance**: Method exists, calls ImportValidator, updates progress dict

- [X] **T024** Implement import_sql method (SQLite script execution)  
  **Files**: `backend/api/services/backup_service.py`  
  **Criteria**: Read SQL file, execute with sqlite3.executescript(), handle errors  
  **Acceptance**: T017 tests pass, can import SQL backup to empty database

- [X] **T025** Implement import_json method (bulk insert via SQLAlchemy)  
  **Files**: `backend/api/services/backup_service.py`  
  **Criteria**: Parse JSON, bulk_insert_mappings in dependency order, preserve IDs  
  **Acceptance**: T018 tests pass, all relationships intact after import

- [X] **T026** Implement import_csv method (ZIP extraction and parsing)  
  **Files**: `backend/api/services/backup_service.py`  
  **Criteria**: Extract ZIP, parse CSVs, convert to dicts, bulk insert  
  **Acceptance**: T019 tests pass, handles UTF-8 encoding correctly

- [X] **T027** Implement import_sqlite_gz method (decompress and copy)  
  **Files**: `backend/api/services/backup_service.py`  
  **Criteria**: Decompress gzip, validate schema, copy tables with INSERT SELECT  
  **Acceptance**: T020 tests pass, fastest import method

- [X] **T028** Implement transaction rollback mechanism with savepoints  
  **Files**: `backend/api/services/backup_service.py`  
  **Criteria**: Use session.begin_nested(), auto-rollback on exception  
  **Acceptance**: T021 tests pass, database unchanged after failure

- [X] **T029** Implement check_database_empty method  
  **Files**: `backend/api/services/backup_service.py`  
  **Criteria**: Query COUNT(*) for all 8 tables, return (is_empty, non_empty_list)  
  **Acceptance**: T022 tests pass, fast execution (<100ms)

**Dependencies**:  
- T017-T022 can run in parallel (different test files)
- T023 before T024-T029
- T021 depends on T024-T027 (needs import methods to test rollback)

**Parallel**: T017-T020, T022 (tests), T024-T027, T029 (after T023, different methods)

---

## Phase 3.4: Backend API Endpoints (FR-010, FR-013)

**Purpose**: REST API following OpenAPI specification

### Test Tasks (Write These First!)

- [X] **T030** [P] Contract test POST /api/backup/validate endpoint  
  **Files**: `backend/tests/contract/test_backup_validate.py` (NEW)  
  **Criteria**: Test request schema, response schema, all status codes (200, 400, 500)  
  **Acceptance**: Tests fail, cover valid/invalid files, all validation errors

- [X] **T031** [P] Contract test POST /api/backup/import endpoint  
  **Files**: `backend/tests/contract/test_backup_import.py` (NEW)  
  **Criteria**: Test multipart upload, progress response, database-not-empty error  
  **Acceptance**: Tests fail, cover all formats and error cases

- [X] **T032** [P] Contract test GET /api/backup/import/{id}/progress endpoint  
  **Files**: `backend/tests/contract/test_backup_import_progress.py` (NEW)  
  **Criteria**: Test progress polling, status transitions, completion response  
  **Acceptance**: Tests fail, cover all import statuses

- [X] **T033** [P] Contract test POST /api/backup/import/{id}/cancel endpoint  
  **Files**: `backend/tests/contract/test_backup_import_cancel.py` (NEW)  
  **Criteria**: Test cancel during validation, during import, after completion  
  **Acceptance**: Tests fail, cover all cancellation scenarios

- [X] **T034** [P] Contract test GET /api/backup/check-database endpoint  
  **Files**: `backend/tests/contract/test_backup_check_database.py` (NEW)  
  **Criteria**: Test with empty DB, with data, response schema  
  **Acceptance**: Tests fail, response matches OpenAPI spec

### Implementation Tasks (Make Tests Pass)

- [X] **T035** Add POST /api/backup/validate endpoint  
  **Files**: `backend/api/routes/backup.py`  
  **Criteria**: Accept multipart file, call ImportValidator, return ValidationResponse  
  **Acceptance**: T030 tests pass, validates file without importing

- [X] **T036** Add POST /api/backup/import endpoint  
  **Files**: `backend/api/routes/backup.py`  
  **Criteria**: Check DB empty, validate file, start import job, return import_id  
  **Acceptance**: T031 tests pass, blocks import to non-empty DB

- [X] **T037** Add GET /api/backup/import/{id}/progress endpoint  
  **Files**: `backend/api/routes/backup.py`  
  **Criteria**: Retrieve progress from _import_progress dict, return current status  
  **Acceptance**: T032 tests pass, updates in real-time

- [X] **T038** Add POST /api/backup/import/{id}/cancel endpoint  
  **Files**: `backend/api/routes/backup.py`  
  **Criteria**: Set cancel flag, wait for current table, trigger rollback  
  **Acceptance**: T033 tests pass, cancellation works at any stage

- [X] **T039** Add GET /api/backup/check-database endpoint  
  **Files**: `backend/api/routes/backup.py`  
  **Criteria**: Call BackupService.check_database_empty(), return status  
  **Acceptance**: T034 tests pass, fast response (<100ms)

**Dependencies**:  
- T030-T034 can run in parallel (different contract test files)
- T023-T029 before T035-T039 (API needs service methods)
- T035-T039 sequential (same file: backup.py)

**Parallel**: T030-T034 (tests)  
**Sequential**: T035-T039 (same file)

---

## Phase 3.5: Frontend Import UI (FR-013, FR-028-030)

**Purpose**: User-facing import interface with progress tracking

### Test Tasks (Write These First!)

- [X] **T040** [P] Component test for file upload with validation  
  **Files**: `frontend/tests/components/Management/BackupImport.test.tsx` (NEW)  
  **Criteria**: Test file select, size validation, format detection  
  **Acceptance**: Tests fail, cover 50MB warning and 100MB rejection

- [X] **T041** [P] Component test for import progress display  
  **Files**: `frontend/tests/components/Management/ImportProgress.test.tsx` (NEW)  
  **Criteria**: Test progress bar, status messages, percentage updates  
  **Acceptance**: Tests fail, cover all import statuses

- [X] **T042** [P] Component test for error message display  
  **Files**: `frontend/tests/components/Management/ImportError.test.tsx` (NEW)  
  **Criteria**: Test error rendering, retry button, detailed error info  
  **Acceptance**: Tests fail, cover validation and import errors

- [X] **T043** [P] Component test for success confirmation  
  **Files**: `frontend/tests/components/Management/ImportSuccess.test.tsx` (NEW)  
  **Criteria**: Test success message, records summary, close button  
  **Acceptance**: Tests fail, displays all table counts

### Implementation Tasks (Make Tests Pass)

- [X] **T044** Extend BackupManagement component with import section  
  **Files**: `frontend/src/components/Management/BackupManagement.tsx`  
  **Criteria**: Add import tab below export section, material-UI layout  
  **Acceptance**: Import section visible, matches export section style

- [X] **T045** Create file upload component with drag-drop support  
  **Files**: `frontend/src/components/Management/BackupManagement.tsx`  
  **Criteria**: Material-UI file upload, drag-drop zone, file preview  
  **Acceptance**: Can select files via click or drag-drop

- [X] **T046** Implement file size validation (50MB warn, 100MB reject)  
  **Files**: `frontend/src/components/Management/BackupManagement.tsx`  
  **Criteria**: Check file.size, show warning dialog at 50MB, error at 100MB  
  **Acceptance**: T040 tests pass, prevents upload of oversized files

- [X] **T047** Create import progress component with real-time updates  
  **Files**: `frontend/src/components/Management/BackupManagement.tsx`  
  **Criteria**: Material-UI LinearProgress, status text, percentage display (immediate), estimated time remaining (after 5s, update every 5s)  
  **Acceptance**: T041 tests pass, updates via polling every 1 second, time estimate appears after 5s and updates based on throughput

- [X] **T048** Implement error message display with retry button  
  **Files**: `frontend/src/components/Management/BackupManagement.tsx`  
  **Criteria**: Material-UI Alert with error details, retry button clears state  
  **Acceptance**: T042 tests pass, clear error messages for all scenarios

- [X] **T049** Implement success message with records summary  
  **Files**: `frontend/src/components/Management/BackupManagement.tsx`  
  **Criteria**: Material-UI Alert with table counts, green checkmark icon  
  **Acceptance**: T043 tests pass, shows "Imported 650 records" with breakdown

- [X] **T050** Add database emptiness check before import  
  **Files**: `frontend/src/components/Management/BackupManagement.tsx`  
  **Criteria**: Call /api/backup/check-database, disable import if data exists  
  **Acceptance**: Shows error "Database must be empty" if data present

**Dependencies**:  
- T040-T043 can run in parallel (different test files/components)
- T035-T039 before T044-T050 (frontend needs API endpoints)
- T044-T050 sequential (same file: BackupManagement.tsx)

**Parallel**: T040-T043 (tests)  
**Sequential**: T044-T050 (same file)

---

## Phase 3.6: Frontend API Integration (FR-014, FR-021)

**Purpose**: Connect frontend UI to backend APIs

### Test Tasks (Write These First!)

- [X] **T051** [P] Service test for backupService.validateBackup()  
  **Files**: `frontend/tests/services/backupService.test.ts` (NEW)  
  **Criteria**: Mock axios, test request format, response parsing  
  **Acceptance**: Tests fail, covers all validation responses

- [X] **T052** [P] Service test for backupService.importBackup()  
  **Files**: `frontend/tests/services/backupService.test.ts`  
  **Criteria**: Mock axios, test multipart upload, import_id return  
  **Acceptance**: Tests fail, covers success and error cases

- [X] **T053** [P] Service test for progress polling logic  
  **Files**: `frontend/tests/services/backupService.test.ts`  
  **Criteria**: Mock polling, test 1-second interval, stop on completion  
  **Acceptance**: Tests fail, verifies polling stops when status=completed

- [X] **T054** [P] Service test for cancel import functionality  
  **Files**: `frontend/tests/services/backupService.test.ts`  
  **Criteria**: Mock axios POST to cancel endpoint, test response handling  
  **Acceptance**: Tests fail, covers cancel success and already-completed cases

### Implementation Tasks (Make Tests Pass)

- [X] **T055** Extend backupService.ts with import API methods  
  **Files**: `frontend/src/services/backupService.ts`  
  **Criteria**: Add validateBackup(), importBackup(), pollImportProgress(), cancelImport()  
  **Acceptance**: T051-T054 tests pass, all methods exist with correct signatures

- [X] **T056** Implement progress polling logic (1-second interval)  
  **Files**: `frontend/src/services/backupService.ts`  
  **Criteria**: setInterval calling pollImportProgress, clearInterval on completion  
  **Acceptance**: T053 tests pass, stops polling when import finishes

- [X] **T057** Implement cancel import functionality  
  **Files**: `frontend/src/services/backupService.ts`  
  **Criteria**: POST to /api/backup/import/{id}/cancel, handle response  
  **Acceptance**: T054 tests pass, triggers rollback via API

- [X] **T058** Add error handling and user feedback  
  **Files**: `frontend/src/services/backupService.ts`  
  **Criteria**: Catch axios errors, parse error responses, return user-friendly messages  
  **Acceptance**: All service tests pass, errors don't crash application

- [X] **T059** Implement global state refresh after import  
  **Files**: `frontend/src/components/Management/BackupManagement.tsx`  
  **Criteria**: Call fetchTasks(), fetchAides(), fetchClassrooms() on import success  
  **Acceptance**: Application shows imported data without manual refresh

**Dependencies**:  
- T051-T054 can run in parallel (different test cases in same file)
- T044-T050 before T055-T059 (UI needs API service)
- T055 before T056-T058
- T055-T059 sequential (same file: backupService.ts, then BackupManagement.tsx)

**Parallel**: T051-T054 (different test cases)  
**Sequential**: T055-T059

---

## Phase 3.7: Integration Testing (All FRs)

**Purpose**: End-to-end validation of all requirements

- [X] **T060** [P] Integration test: Scenario 1 - Fresh installation import  
  **Files**: `backend/tests/integration/test_import_scenario_1.py` (NEW)  
  **Criteria**: Export→Delete DB→Import→Verify data integrity  
  **Acceptance**: Follows quickstart.md Scenario 1, all steps pass

- [X] **T061** [P] Integration test: Scenario 2 - Prevent non-empty DB import  
  **Files**: `backend/tests/integration/test_import_scenario_2.py` (NEW)  
  **Criteria**: Populate DB→Attempt import→Verify blocked with error  
  **Acceptance**: Follows quickstart.md Scenario 2, import rejected

- [X] **T062** [P] Integration test: Scenario 3 - File size validation  
  **Files**: `backend/tests/integration/test_import_scenario_3.py` (NEW)  
  **Criteria**: Test 60MB (warning), 120MB (rejection)  
  **Acceptance**: Follows quickstart.md Scenario 3, size limits enforced

- [X] **T063** [P] Integration test: Scenario 4 - Invalid backup validation  
  **Files**: `backend/tests/integration/test_import_scenario_4.py` (NEW)  
  **Criteria**: Test missing tables, broken FKs, invalid types, corrupted files  
  **Acceptance**: Follows quickstart.md Scenario 4, all validation errors caught

- [X] **T064** [P] Integration test: Scenario 5 - Import failure and rollback  
  **Files**: `backend/tests/integration/test_import_scenario_5.py` (NEW)  
  **Criteria**: Import fails at table 5→Verify rollback→Verify DB unchanged  
  **Acceptance**: Follows quickstart.md Scenario 5, database empty after rollback

- [X] **T065** [P] Integration test: Scenario 6 - Schema version mismatch  
  **Files**: `backend/tests/integration/test_import_scenario_6.py` (NEW)  
  **Criteria**: Import old version backup→Warning shown→User can proceed/cancel  
  **Acceptance**: Follows quickstart.md Scenario 6, warning displayed

- [X] **T066** [P] Integration test: Scenario 7 - All four import formats  
  **Files**: `backend/tests/integration/test_import_scenario_7.py` (NEW)  
  **Criteria**: Import SQL, JSON, CSV, SQLite→Verify identical results  
  **Acceptance**: Follows quickstart.md Scenario 7, all formats produce same data

- [X] **T067** [P] Integration test: Scenario 8 - Cancel import in progress  
  **Files**: `backend/tests/integration/test_import_scenario_8.py` (NEW)  
  **Criteria**: Start import→Cancel during validation/import→Verify rollback  
  **Acceptance**: Follows quickstart.md Scenario 8, cancellation works

- [X] **T068** [P] Integration test: Scenario 9 - Progress tracking  
  **Files**: `backend/tests/integration/test_import_scenario_9.py` (NEW)  
  **Criteria**: Monitor progress updates→Verify monotonic increase→Refresh works  
  **Acceptance**: Follows quickstart.md Scenario 9, progress accurate

- [X] **T069** [P] Integration test: Scenario 10 - Data refresh after import  
  **Files**: `backend/tests/integration/test_import_scenario_10.py` (NEW)  
  **Criteria**: Import complete→Verify all views auto-refresh→Test functionality  
  **Acceptance**: Follows quickstart.md Scenario 10, data visible immediately

**Dependencies**:  
- All previous tasks (T001-T059) before T060-T069
- T060-T069 can run in parallel (independent scenarios)

**Parallel**: T060-T069 (all scenarios independent)

---

## Phase 3.8: Documentation and Finalization

**Purpose**: Complete the feature with documentation and validation

- [X] **T070** Update API documentation (OpenAPI/Swagger)  
  **Files**: `backend/api/swagger.yaml` or docs folder  
  **Criteria**: Add all 5 new endpoints with examples from contracts/import-api.yaml  
  **Acceptance**: Swagger UI shows import endpoints with try-it-out functionality

- [X] **T071** Update user manual with import instructions  
  **Files**: `docs/user-guide.md` or README  
  **Criteria**: Step-by-step import guide with screenshots (optional), troubleshooting  
  **Acceptance**: Non-technical users can follow guide to import backups

- [X] **T072** Create troubleshooting guide for common import issues  
  **Files**: `docs/troubleshooting-import.md` (NEW)  
  **Criteria**: Document common errors from quickstart.md, solutions for each  
  **Acceptance**: Covers database locked, stalled import, validation failures

- [X] **T073** Performance testing and optimization  
  **Files**: `backend/tests/performance/test_import_performance.py` (NEW)  
  **Criteria**: Test import times for 650, 5k, 20k, 50k records, verify benchmarks  
  **Acceptance**: Import times match or beat research.md estimates

- [X] **T074** Final constitution compliance check  
  **Files**: Manual review against `.specify/memory/constitution.md`  
  **Criteria**: Verify all 6 core principles satisfied, test coverage ≥90% (run `pytest --cov` for backend, `npm run test:coverage` for frontend)  
  **Acceptance**: No constitution violations, backend coverage ≥90%, frontend coverage ≥90%, all critical paths tested

- [X] **T075** Code review and cleanup  
  **Files**: All modified files  
  **Criteria**: Remove debug code, add docstrings, fix linter warnings  
  **Acceptance**: `pylint` and `eslint` pass with no errors

- [X] **T076** Create release notes and changelog entry  
  **Files**: `CHANGELOG.md`  
  **Criteria**: Document new import feature, breaking changes (none), migration guide  
  **Acceptance**: Changelog entry follows existing format

**Dependencies**:  
- All previous tasks before T070-T076
- T070-T072 can run in parallel (different docs)
- T073-T076 sequential (each depends on previous)

**Parallel**: T070-T072  
**Sequential**: T073-T076

---

## Dependencies Graph

```
Phase 3.1: Export Verification
T001-T004 [P] → T005

Phase 3.2: Validation Infrastructure
T006-T010 [P] → T011 → T012 → T013-T016 [P]

Phase 3.3: Import Service
T017-T020, T022 [P] → T023 → T024-T027, T029 [P]
T021 depends on T024-T027

Phase 3.4: API Endpoints
T030-T034 [P] → T035 → T036 → T037 → T038 → T039

Phase 3.5: Frontend UI
T040-T043 [P] → T044 → T045 → T046 → T047 → T048 → T049 → T050

Phase 3.6: Frontend Integration
T051-T054 [P] → T055 → T056 → T057 → T058 → T059

Phase 3.7: Integration Tests
T001-T059 → T060-T069 [P]

Phase 3.8: Documentation
T001-T069 → T070-T072 [P] → T073 → T074 → T075 → T076
```

---

## Parallel Execution Examples

### Maximum Parallelism - Test Development

```bash
# Phase 3.2: 5 validation test files in parallel
Task: "Unit test ValidationResult dataclass in backend/tests/unit/test_validation_result.py"
Task: "Unit test ImportValidator Stage 1 in backend/tests/unit/test_import_validator_format.py"
Task: "Unit test ImportValidator Stage 2 in backend/tests/unit/test_import_validator_schema.py"
Task: "Unit test ImportValidator Stage 3 in backend/tests/unit/test_import_validator_types.py"
Task: "Unit test ImportValidator Stage 4 in backend/tests/unit/test_import_validator_relationships.py"

# Phase 3.3: 4 import format tests in parallel
Task: "Unit test import_sql in backend/tests/unit/test_import_service_sql.py"
Task: "Unit test import_json in backend/tests/unit/test_import_service_json.py"
Task: "Unit test import_csv in backend/tests/unit/test_import_service_csv.py"
Task: "Unit test import_sqlite_gz in backend/tests/unit/test_import_service_sqlite.py"

# Phase 3.7: 10 integration scenarios in parallel
Task: "Integration test Scenario 1 in backend/tests/integration/test_import_scenario_1.py"
Task: "Integration test Scenario 2 in backend/tests/integration/test_import_scenario_2.py"
Task: "Integration test Scenario 3 in backend/tests/integration/test_import_scenario_3.py"
# ... all 10 scenarios
```

### Sequential Implementation

```bash
# Phase 3.4: API endpoints (same file, must be sequential)
Task: "Add POST /api/backup/validate in backend/api/routes/backup.py"
# Wait for T035 to complete
Task: "Add POST /api/backup/import in backend/api/routes/backup.py"
# Wait for T036 to complete
Task: "Add GET /api/backup/import/{id}/progress in backend/api/routes/backup.py"
# Continue sequentially...
```

---

## Validation Checklist

*GATE: Verify before marking feature complete*

- [ ] All 5 API contracts have corresponding contract tests (T030-T034)
- [ ] All 4 import formats have implementation and tests (T024-T027 + T017-T020)
- [ ] All 10 quickstart scenarios have integration tests (T060-T069)
- [ ] All tests written before implementation (TDD)
- [ ] Parallel tasks truly independent (different files)
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Test coverage ≥90% (backend and frontend)
- [ ] Constitution compliance verified (T074)
- [ ] Performance benchmarks met (T073)
- [ ] Documentation complete (T070-T072, T076)

---

## Notes

- **[P] Markers**: 34 tasks can run in parallel (45% of total tasks)
- **Test-First**: 22 test tasks before implementation (TDD approach)
- **File Conflicts**: T035-T039 sequential (backup.py), T044-T050 sequential (BackupManagement.tsx), T055-T059 sequential (backupService.ts then component)
- **Commit After Each Task**: Smaller commits make review easier
- **Avoid**: Combining tasks, implementing before tests pass, working on same file in parallel

---

## Success Criteria

**All 76 tasks complete** when:
- ✅ Export formats verified and fixed (T001-T005)
- ✅ 4-stage validation pipeline implemented and tested (T006-T016)
- ✅ All 4 import formats working with atomic rollback (T017-T029)
- ✅ 5 new API endpoints deployed and tested (T030-T039)
- ✅ Import UI complete with progress tracking (T040-T050)
- ✅ Frontend-backend integration working (T051-T059)
- ✅ All 10 quickstart scenarios passing (T060-T069)
- ✅ Documentation, performance, and compliance verified (T070-T076)
- ✅ No database corruption, all relationships intact
- ✅ Rollback works correctly on all failure scenarios
- ✅ Clear error messages for all edge cases
- ✅ Import times meet performance benchmarks

---

**Status**: Tasks ready for execution via TDD approach  
**Next**: Begin with T001-T004 (export verification) in parallel  
**Estimated Completion**: 10-15 days with 2 developers working in parallel on independent tasks
