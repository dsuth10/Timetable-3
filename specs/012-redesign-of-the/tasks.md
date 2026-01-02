# Tasks: Redesign PDF Export for Timetables

**Input**: Design documents from `/specs/012-redesign-of-the/`
**Prerequisites**: plan.md (required), research.md, data-model.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack (React, TypeScript), libraries (jspdf, html2canvas), structure (frontend/backend)
2. Load optional design documents:
   → data-model.md: Extract transient entities (ExportConfig, TimetableSnapshot)
   → research.md: Extract scaling algorithm and theme forcing decisions
3. Generate tasks by category:
   → Setup: frontend dependencies
   → Tests: unit tests for scaling logic, integration tests for export flow
   → Core: PDF export service, custom hook, hidden export view component
   → Integration: Button trigger in main views
   → Polish: cleanup legacy backend code
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [X] T001 Install frontend dependencies (`jspdf`, `html2canvas`, `@types/jspdf`) in `frontend/package.json`
- [X] T002 [P] Define `ExportConfig` and `TimetableSnapshot` types in `frontend/src/types/export.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [X] T003 [P] Unit test for PDF scaling logic in `frontend/src/services/pdfExportService.test.ts`
- [X] T004 [P] Unit test for light-theme forcing logic in `frontend/src/components/TimetableExportView.test.tsx`
- [X] T005 [P] Integration test for full export flow in `frontend/src/tests/integration/timetableExport.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [X] T006 [P] Implement `pdfExportService.ts` with continuous scaling algorithm in `frontend/src/services/pdfExportService.ts`
- [X] T007 [P] Create `TimetableExportView` component (hidden, forces light theme, includes FR-010 minimal header with Staff Name and Date Range) in `frontend/src/components/TimetableExportView.tsx`
- [X] T008 [P] Create `useTimetableExport` hook to orchestrate the snapshot and export process in `frontend/src/hooks/useTimetableExport.ts`
- [X] T009 Add `.hide-for-export` CSS class and apply it to interactive elements (Add/Delete buttons) in existing timetable components

## Phase 3.4: Integration
- [X] T010 [P] Add "Export PDF" button to `TeacherAideTimetable` view in `frontend/src/pages/AideTimetable.tsx`
- [X] T011 [P] Add "Export PDF" button to `ClassroomTimetable` view in `frontend/src/pages/ClassroomTimetable.tsx`
- [X] T012 Connect "Export PDF" button to `useTimetableExport` hook

## Phase 3.5: Cleanup & Polish
- [X] T013 [P] Remove deprecated `backend/api/services/pdf_service.py`
- [X] T014 [P] Remove deprecated `/api/calendar/export-pdf` route from `backend/api/routes/calendar.py`
- [X] T015 Run `quickstart.md` verification steps
- [X] T016 Final documentation update in `specs/012-redesign-of-the/plan.md`

## Dependencies
- T001 blocks T003-T012
- T002 blocks T003, T006, T008
- T003-T005 (Tests) before implementation (T006-T012)
- T006, T007 block T008
- T008 blocks T010-T012

## Parallel Example
```
# Launch T003-T005 together:
Task: "Unit test for PDF scaling logic in frontend/src/services/pdfExportService.test.ts"
Task: "Unit test for light-theme forcing logic in frontend/src/components/TimetableExportView.test.tsx"
Task: "Integration test for full export flow in frontend/src/tests/integration/timetableExport.test.ts"

# Launch T006-T007 together:
Task: "Implement pdfExportService.ts in frontend/src/services/pdfExportService.ts"
Task: "Create TimetableExportView component in frontend/src/components/TimetableExportView.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Commit after each task is completed and verified by its test
- Ensure all scaling is done using points (72 DPI) for `jsPDF` to match A4 landscape (841.89pt x 595.28pt)

