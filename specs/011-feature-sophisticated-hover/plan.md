# Implementation Plan: Sophisticated Hover Tooltip

**Branch**: `011-feature-sophisticated-hover` | **Date**: 2025-12-30 | **Spec**: `/specs/011-feature-sophisticated-hover/spec.md`
**Input**: Feature specification from `/specs/011-feature-sophisticated-hover/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Success
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Success (Web Project)
3. Fill the Constitution Check section based on the content of the constitution document.
   → Success
4. Evaluate Constitution Check section below
   → Pass
5. Execute Phase 0 → research.md
   → Success
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, AGENTS.md
   → Success
7. Re-evaluate Constitution Check section
   → Pass
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → Success
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
The goal is to provide a "Sophisticated Hover Tooltip" for assigned tasks in the timetable grid. When a user hovers over an assignment for 1 second (or long-presses on mobile), a detailed tooltip will appear showing the task title, category, classroom info, scheduled times, all assigned aides, upcoming recurrence dates, and notes. This will be implemented using a new backend endpoint for aggregated tooltip data and a lazy-loading React component on the frontend integrated with MUI's Tooltip.

## Technical Context
**Language/Version**: Python 3.12+, TypeScript 5.x  
**Primary Dependencies**: Flask, SQLAlchemy (Backend); React 18, MUI v5, @hello-pangea/dnd (Frontend)  
**Storage**: SQLite  
**Testing**: pytest (Backend), Vitest + React Testing Library (Frontend)  
**Target Platform**: Desktop (Chrome/Edge/Firefox) & Mobile (Long-press)  
**Project Type**: Web Application  
**Performance Goals**: < 200ms tooltip data fetch latency  
**Constraints**: Local-first architecture; must respect 1s delay requirement  
**Scale/Scope**: Displays details for individual assignments; recurrence info capped at 10 dates.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Local-First**: The feature operates entirely on the local backend and frontend without external dependencies.
- [x] **REST API Contract**: Tooltip data will be served via a dedicated REST endpoint.
- [x] **Comprehensive Testing**: Plans include unit tests for the new backend service and route, and component tests for the new frontend tooltip.
- [x] **Accessibility**: Tooltips are a core part of the accessibility strategy; will use semantic HTML and correct ARIA attributes.
- [x] **Data Integrity**: Tooltip is read-only; no impact on data integrity.

## Project Structure

### Documentation (this feature)
```
specs/011-feature-sophisticated-hover/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)
```
backend/
├── api/
│   ├── routes/
│   │   └── assignments.py  # New GET /tooltip endpoint
│   ├── services/
│   │   └── assignment_service.py # Tooltip data logic
│   └── models/
│       └── assignment.py   # Existing model
└── tests/
    └── contract/
        └── test_tooltip_get.py # New contract tests

frontend/
├── src/
│   ├── components/
│   │   ├── TimetableGrid/
│   │   │   ├── TaskCard.tsx       # Integration with Tooltip
│   │   │   └── TaskTooltip.tsx    # New Tooltip component
│   │   └── common/
│   │       └── TooltipDataFetcher.tsx # Helper for lazy loading
│   └── types/
│       └── index.ts               # New TooltipData type
└── tests/
    └── components/
        └── TaskTooltip.test.tsx    # New component tests
```

**Structure Decision**: Web application structure with separated frontend and backend.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - [x] Recurrence logic: Query `assignments` filtered by `recurring_series_id` and `date >= today`.
   - [x] Multi-aide support: Assignments with same task/date/time.
   - [x] Hover delay: MUI `Tooltip` `enterDelay` prop.

2. **Consolidate findings** in `research.md`:
   - Decision: Add `GET /api/assignments/{id}/tooltip` to fetch aggregated data.
   - Rationale: Keeps the main `daily-view` response lean and allows for detailed fetching only when needed.
   - Alternatives considered: Including all data in `daily-view`. Rejected because notes and recurrence lists are heavy and rarely viewed for all cards at once.

**Output**: research.md with all unknowns resolved.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - `TooltipData`: Virtual entity for aggregation.
   - Fields: `task_title`, `category`, `classroom` (object), `start_time`, `end_time`, `assigned_aides` (list), `recurrence` (object with list of dates and `has_more`), `notes`.

2. **Generate API contracts** from functional requirements:
   - `GET /api/assignments/{assignment_id}/tooltip`
   - Output to `/contracts/tooltip_api.json`.

3. **Generate contract tests** from contracts:
   - `backend/tests/contract/test_tooltip_get.py`
   - Asserts the structure of the tooltip data.

4. **Extract test scenarios** from user stories:
   - Hover 1s -> Show data.
   - Move away -> Hide immediately.
   - Recurring task -> Show next 10 dates + ellipsis.
   - No notes -> Show placeholder.
   - No aides -> Show "None".

5. **Update agent file incrementally**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor`

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, AGENTS.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Create backend service methods to aggregate tooltip data.
- Implement the REST endpoint.
- Create the frontend `TaskTooltip` component with lazy-loading state.
- Integrate `TaskTooltip` into `TaskCard`.
- Implement position "flipping" using MUI's built-in Popper logic.
- Add comprehensive tests for both layers.

**Estimated Output**: 15-20 tasks.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [x] Phase 2: Task planning complete (strategy defined)
- [x] Phase 3: Tasks generated (/tasks command)
- [x] Phase 4: Implementation complete
- [x] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented
