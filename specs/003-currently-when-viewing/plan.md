
# Implementation Plan: Interactive Task Selection on Aide Assignment

**Branch**: `003-currently-when-viewing` | **Date**: 2025-12-02 | **Spec**: [specs/003-currently-when-viewing/spec.md](specs/003-currently-when-viewing/spec.md)
**Input**: Feature specification from `specs/003-currently-when-viewing/spec.md`

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
The system will introduce a "Select Task" modal when dragging an aide to a class slot, replacing automatic "class support" task creation. This modal allows selecting existing tasks for the class or quick-creating a new one inline (Name + Description).

## Technical Context
**Language/Version**: Python 3.12+ (Backend), TypeScript (Frontend)
**Primary Dependencies**: Flask, SQLAlchemy (Backend); React 18, Material-UI v5, @hello-pangea/dnd (Frontend)
**Storage**: SQLite (Local-first)
**Testing**: pytest (Backend), Vitest + React Testing Library (Frontend)
**Target Platform**: Local browser-based web app
**Project Type**: web (frontend + backend)
**Performance Goals**: Instant modal feedback (<100ms), standard local API latency
**Constraints**: Offline-capable, drag-and-drop centric
**Scale/Scope**: Modal logic for existing drag-and-drop flow

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Local-First**: Uses existing SQLite and local state.
- [x] **REST API**: Uses existing endpoints or adds compliant new ones.
- [x] **Testing**: Includes plans for backend and frontend tests.
- [x] **Drag-and-Drop**: Enhances the core drag-and-drop flow (Constitution IV).
- [x] **Accessibility**: Modal will be accessible (Constitution V).
- [x] **Data Integrity**: Prevents duplicate tasks (Constitution VI).

## Project Structure

### Documentation (this feature)
```
specs/003-currently-when-viewing/
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
│   ├── routes/          # Task and Assignment routes
│   └── services/        # Logic for Task fetching/creation
└── tests/
    ├── contract/
    └── integration/

frontend/
├── src/
│   ├── components/
│   │   ├── DragDrop/    # Assignment logic
│   │   └── Modals/      # New TaskSelectionModal
│   ├── services/        # API calls
│   └── types/
└── tests/
```

**Structure Decision**: Web application (frontend + backend)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - None identified. Tech stack is established.
   
2. **Generate and dispatch research agents**:
   - *Skipped as core patterns are established.*

3. **Consolidate findings** in `research.md`:
   - Decision: Use MUI Dialog for the modal.
   - Rationale: Consistent with existing UI.
   - Decision: Reuse `POST /tasks` and `POST /assignments` endpoints vs creating a composite endpoint.
   - Rationale: Keeps API granular; frontend orchestrates the "create and assign" flow.

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - **Task**: Existing entity.
   - **Assignment**: Existing entity.
   - No schema changes expected, just usage patterns.

2. **Generate API contracts** from functional requirements:
   - `GET /api/classrooms/{id}/tasks`: Fetch tasks for a class (for the list).
   - `POST /api/tasks`: Create new task (for quick-create).
   - `POST /api/assignments`: Assign aide to task.
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Test fetching tasks by classroom.
   - Test task creation.
   - Test assignment creation.

4. **Extract test scenarios** from user stories:
   - Story 1: Drag aide -> Modal appears.
   - Story 2: Select existing task -> Assigned.
   - Story 3: Create new task -> Created & Assigned.
   - Story 4: Cancel -> No change.

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor`
   - Update with new feature context.

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs
- Backend: Add/Verify `GET /classrooms/{id}/tasks` endpoint [P]
- Backend: Verify `POST` endpoints ready for this flow [P]
- Frontend: Create `TaskSelectionModal` component [P]
- Frontend: Integrate Modal into Drag-and-Drop `onDrop` handler
- Frontend: Implement "Select Existing" logic
- Frontend: Implement "Quick Create" form and logic
- Integration: Verify full flow (Drag -> Select/Create -> Assign)

**Ordering Strategy**:
- Backend endpoints first (if new needed)
- Frontend Component (Modal) independent
- Integration last

**Estimated Output**: 10-15 tasks in tasks.md

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | | |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
