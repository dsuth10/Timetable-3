# Implementation Plan: Redesign PDF Export for Timetables

**Branch**: `012-redesign-of-the` | **Date**: 2026-01-02 | **Spec**: `/specs/012-redesign-of-the/spec.md`
**Input**: Feature specification from `/specs/012-redesign-of-the/spec.md`

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
6. Execute Phase 1 → data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
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
The goal is to redesign the PDF export for teacher and aide timetables to provide a single-page, A4 landscape document that exactly mirrors the digital timetable's layout and colors. The implementation will move PDF generation to the frontend using `jsPDF` and `html2canvas` to achieve high fidelity, force a light theme for print efficiency, and apply continuous scaling to fit the content on a single page.

## Technical Context
**Language/Version**: Python 3.12 (Backend), TypeScript 5.0+, React 18+  
**Primary Dependencies**: `jspdf`, `html2canvas`  
**Storage**: N/A (Client-side generation)  
**Testing**: Vitest + RTL (Frontend), pytest (Backend for cleanup)  
**Target Platform**: Desktop Browser  
**Project Type**: web (frontend + backend)  
**Performance Goals**: Export should complete in < 3 seconds.  
**Constraints**: Single A4 landscape page, Force light theme, Continuous scaling.  
**Scale/Scope**: ~10-15 aides, ~100 assignments per week maximum.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Local-First**: Generation occurs entirely on the client. (PASS)
- [x] **II. REST API**: Backend endpoints for data remain RESTful. (PASS)
- [x] **III. Comprehensive Testing**: Frontend tests will verify the snapshot and scaling logic. (PASS)
- [x] **IV. Drag-and-Drop First**: N/A. (PASS)
- [x] **V. Accessibility**: Light theme forcing improves print accessibility. (PASS)
- [x] **VI. Data Integrity**: N/A. (PASS)

## Project Structure

### Documentation (this feature)
```
specs/012-redesign-of-the/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
backend/
├── api/
│   ├── routes/          # Remove /export-pdf
│   └── services/        # Deprecate PdfService
└── tests/

frontend/
├── src/
│   ├── components/      # TimetableExportContainer (hidden view)
│   ├── services/        # pdfExportService.ts
│   └── hooks/           # useTimetableExport.ts
└── tests/
```

**Structure Decision**: Web application structure with emphasis on frontend services for PDF generation.

## Phase 0: Outline & Research
*Completed* - See `research.md`.
- Decision: Use `jsPDF` + `html2canvas` for high-fidelity DOM snapshotting.
- Rationale: Best way to match complex MUI styles and category colors.
- Findings: Scaling can be achieved by calculating the aspect ratio of the captured canvas vs A4 landscape dimensions.

## Phase 1: Design & Contracts
*Completed* - See `data-model.md` and `quickstart.md`.
- Design: A hidden `TimetableExportContainer` will render the full week's timetable in a light theme using a scoped `ThemeProvider`.
- Testing: Integration tests will verify the scale calculations and theme forcing.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- **Environment**: Install `jspdf` and `html2canvas`.
- **Infrastructure**: Create `PDFExportService` with scaling logic.
- **Component**: Create `ExportTimetableWrapper` that handles the "Clean View" (hiding buttons) and "Forced Light Theme".
- **Integration**: Add the export trigger to the main Timetable views.
- **Cleanup**: Remove legacy backend PDF code.
- **Validation**: Write tests for the scaling service and integration flows.

**Ordering Strategy**:
- 1. Setup (dependencies).
- 2. Core Service (PDF logic).
- 3. UI Layer (Hidden render & theme forcing).
- 4. Integration (Button).
- 5. Cleanup (Backend).

## Complexity Tracking
*None identified*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [x] Phase 4: Implementation complete
- [x] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented: N/A

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
