
# Implementation Plan: Quick-Click Task Creation

**Branch**: `main` | **Date**: 2025-01-27 | **Spec**: `specs/main/spec.md`
**Input**: Feature specification from `specs/main/spec.md`

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

The Quick-Click Task Creation feature enables teachers to instantly create and assign tasks directly from the Teacher Aide schedule view by clicking a subtle "+" button in any time slot. This feature creates both a task template (added to the Task Bank) and an assignment (scheduled for the clicked slot) in a single atomic operation via a new dedicated API endpoint. The implementation requires: (1) a new backend endpoint `POST /api/quick-create-task` that atomically creates task and assignment, (2) frontend UI additions to TimetableGrid for the "+" button and modal dialog, (3) backend validation updates to accept 5-minute time increments for quick-click assignments, and (4) collision detection to prevent overlapping assignments.

## Technical Context
**Language/Version**: Python 3.12+, TypeScript (strict mode)  
**Primary Dependencies**: Flask 3.x, SQLAlchemy 2.x, React 18+, Material-UI v5, Zustand  
**Storage**: SQLite (via SQLAlchemy ORM)  
**Testing**: pytest (backend), Vitest + React Testing Library (frontend)  
**Target Platform**: Web application (desktop-optimized, local-first)  
**Project Type**: Web application (backend/ + frontend/)  
**Performance Goals**: <500ms API response time, instant UI feedback, modal opens <100ms  
**Constraints**: Local-first architecture (offline-capable), atomic transaction for task+assignment creation, 5-minute time increment validation for quick-click  
**Scale/Scope**: Single-user MVP, ~10-50 teacher aides, ~100-500 tasks per week

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Local-First Architecture ✅
- Feature operates entirely offline using local SQLite database
- No external dependencies or cloud services required
- Single HTML bundle compatibility maintained

### II. REST API Contract ✅
- New endpoint follows RESTful conventions: `POST /api/quick-create-task`
- Returns JSON with standard HTTP status codes (201 success, 400 validation, 409 conflict)
- Consistent error response format maintained

### III. Comprehensive Testing ✅
- Contract tests required for new endpoint
- Integration tests for quick-click workflow
- Frontend component tests for modal and button interactions
- Test coverage mandatory before feature completion

### IV. Drag-and-Drop First Interface ✅
- Quick-click is supplementary to drag-and-drop (does not replace it)
- Created tasks remain draggable from Task Bank
- Feature enhances workflow without violating drag-first principle

### V. Accessibility & Inclusive Design ✅
- "+" button must have ARIA labels and keyboard navigation
- Modal dialog must be keyboard accessible and screen-reader compatible
- Color contrast and visual feedback required

### VI. Data Integrity & Conflict Prevention ✅
- Atomic transaction ensures no orphaned tasks or assignments
- Collision detection prevents overlapping assignments
- Validation at API boundary prevents invalid data

**Status**: ✅ All constitutional requirements satisfied. No violations detected.

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
│   ├── models/          # SQLAlchemy models (Task, Assignment - no changes needed)
│   ├── routes/          # Flask route handlers
│   │   └── tasks.py     # Add new POST /api/quick-create-task endpoint
│   ├── services/        # Business logic
│   │   └── collision_service.py  # Reuse existing collision detection
│   └── middleware/
│       └── validation.py  # Update validate_time_30min to support 5-min increments
├── tests/
│   ├── contract/
│   │   └── test_quick_create_task.py  # New contract test
│   └── integration/
│       └── test_quick_click_flow.py  # Integration test
└── app.py

frontend/
├── src/
│   ├── components/
│   │   ├── TimetableGrid/
│   │   │   ├── TimetableGrid.tsx  # Add "+" button to time slots
│   │   │   ├── TimeSlottedColumn.tsx  # Add click handler
│   │   │   └── QuickCreateTaskModal.tsx  # New modal component
│   │   └── common/
│   ├── services/
│   │   └── tasksApi.ts  # Add quickCreateTask function
│   ├── store/
│   │   └── stores/
│   │       ├── tasks.ts  # Update to handle quick-create response
│   │       └── assignments.ts  # Update to handle new assignment
│   └── types/
│       └── index.ts  # Type definitions (no changes needed)
└── tests/
    └── components/
        └── QuickCreateTaskModal.test.tsx  # Component test
```

**Structure Decision**: Web application structure (backend/ + frontend/) confirmed. Feature adds minimal new files: one new backend route, one new frontend modal component, and updates to existing TimetableGrid components.

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
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs:
  - **Contract Test**: `test_quick_create_task.py` - Verify API endpoint request/response schema [P]
  - **Backend Route**: Add `POST /api/quick-create-task` endpoint to `backend/api/routes/tasks.py`
  - **Backend Service**: Reuse existing `CollisionService` for conflict detection (no new service needed)
  - **Integration Test**: `test_quick_click_flow.py` - Full workflow from API to UI updates
  - **Frontend API Service**: Add `quickCreateTask` function to `frontend/src/services/tasksApi.ts` [P]
  - **Frontend Modal Component**: Create `QuickCreateTaskModal.tsx` component [P]
  - **Frontend Grid Update**: Add "+" button to `TimetableGrid`/`TimeSlottedColumn` components
  - **Frontend State Updates**: Update Zustand stores (`tasks.ts`, `assignments.ts`) for optimistic updates
  - **Component Test**: `QuickCreateTaskModal.test.tsx` - Modal form validation and submission [P]
- Each user story → integration test scenario validation

**Ordering Strategy**:
- TDD order: Contract test → Backend implementation → Integration test → Frontend implementation
- Dependency order: Backend API → Frontend API service → Frontend components → State management
- Mark [P] for parallel execution (independent files, no dependencies)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md

**Key Implementation Tasks**:
1. Contract test for new endpoint (fails initially)
2. Backend route implementation (makes contract test pass)
3. Frontend API service function
4. Frontend modal component
5. Frontend grid button integration
6. Frontend state management updates
7. Integration test (full workflow)
8. Component tests
9. Error handling and edge cases
10. Accessibility verification

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
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
