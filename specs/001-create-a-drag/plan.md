# Implementation Plan: Drag-and-Drop Timetable Scheduler

**Branch**: `001-create-a-drag` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-create-a-drag/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Feature spec found and analyzed
2. Fill Technical Context ✓
   → Project Type: Web application (React frontend + Flask backend)
   → Structure Decision: Option 2 (frontend/ + backend/ + shared database)
3. Fill Constitution Check section ✓
4. Evaluate Constitution Check section ✓
   → No violations detected - all principles aligned
   → Progress: Initial Constitution Check PASS
5. Execute Phase 0 → research.md ✓
   → No NEEDS CLARIFICATION remain (all resolved in spec)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✓
7. Re-evaluate Constitution Check section ✓
   → No new violations - design validated
   → Progress: Post-Design Constitution Check PASS
8. Plan Phase 2 → Task generation approach described ✓
9. STOP - Ready for /tasks command ✓
```

## Summary
Create a desktop-optimized web application for Queensland primary schools that enables administrators to visually assign teacher aides to classroom tasks and playground duties using drag-and-drop interface. The system operates completely offline using local SQLite database, supports recurring tasks with iCal RRULE patterns, handles multi-administrator concurrent editing, and provides real-time conflict detection with automatic resolution. All timetable modifications must be achievable through drag-and-drop, with comprehensive testing coverage for collision detection, absence handling, and multi-slot task assignment.

## Technical Context
**Language/Version**: Python 3.12+ (backend), TypeScript 5+ in strict mode (frontend)  
**Primary Dependencies**: Flask 3.x, SQLAlchemy 2.x, React 18+, Vite, Material-UI v5, Zustand, @hello-pangea/dnd  
**Storage**: SQLite (single local file for offline operation)  
**Testing**: pytest + pytest-flask (backend), Vitest + React Testing Library (frontend), Cypress (E2E)  
**Target Platform**: Desktop browsers (Chrome, Firefox, Edge, Safari), offline-capable  
**Project Type**: Web application (React SPA + Flask REST API)  
**Performance Goals**: <150ms API response time, smooth 60fps drag operations, <500 assignments/week dataset  
**Constraints**: Fully offline operation, no network dependencies, single SQLite file, WCAG AA compliance, 10-level undo buffer  
**Scale/Scope**: 10-50 teacher aides, 200-500 weekly assignments, 100+ recurring tasks, 2-5 concurrent administrators

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance
- ✅ **I. Local-First Architecture**: SQLite database, offline operation, single HTML bundle deployment
- ✅ **II. REST API Contract**: Clean Flask REST API with JSON responses, standard HTTP codes, independent testability
- ✅ **III. Comprehensive Testing**: pytest (backend), Vitest+RTL (frontend), Cypress (E2E), integration tests for all critical flows
- ✅ **IV. Drag-and-Drop First**: All timetable modifications via D&D (FR-013 through FR-019), forms are supplementary
- ✅ **V. Accessibility**: WCAG AA standards, keyboard nav, ARIA labels, tooltips, color-blind palette
- ✅ **VI. Data Integrity**: DB constraints, collision detection, atomic operations, undo capability

### Technology Standards Compliance
- ✅ **Stack Decisions**: Using constitution-approved stack (Flask, React 18+, SQLAlchemy, Material-UI v5, Zustand)
- ✅ **Version Consistency**: Locked to major versions per constitution
- ✅ **Dependency Stability**: All choices align with existing stack

### Development Workflow Compliance
- ✅ **Code Quality Gates**: TypeScript strict mode, comprehensive test coverage, API validation, component isolation
- ✅ **Implementation Standards**: Zustand for state, Axios for API, iCal RRULE for recurrence, Alembic for migrations
- ✅ **Drag-and-Drop UX**: Immediate visual feedback, conflict warnings, accessible interactions

### Operational Constraints Compliance  
- ✅ **MVP Requirements**: Single SQLite file, local filesystem, AEST/24-hour/ISO weeks, desktop-optimized, no auth

### Scope & Roadmap Compliance
- ✅ **MVP Core Features**: All features align with MVP scope (drag-drop, recurrence, absence management, conflict resolution, status tracking, teacher requests)
- ✅ **Post-MVP Deferred**: Auth/authorization, notifications, reporting, mobile support marked for future

**Result**: ✅ **PASS** - No constitution violations, all principles satisfied

## Project Structure

### Documentation (this feature)
```
specs/001-create-a-drag/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── api-spec.yaml    # OpenAPI 3.0 specification
│   └── rrule-spec.md    # iCal RRULE recurrence patterns
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
backend/
├── api/
│   ├── models/          # SQLAlchemy models (TeacherAide, Task, Assignment, Absence, etc.)
│   ├── routes/          # Flask route handlers (aides, tasks, assignments, absences, classrooms)
│   ├── services/        # Business logic (collision detection, recurrence engine, conflict resolution)
│   ├── recurrence.py    # iCal RRULE parsing and occurrence generation
│   ├── scheduler.py     # Background scheduler for horizon extension
│   └── __init__.py
├── migrations/          # Alembic database migrations
├── tests/
│   ├── conftest.py      # pytest fixtures
│   ├── test_models.py   # Model unit tests
│   ├── test_routes.py   # API endpoint tests
│   ├── test_recurrence.py  # Recurrence engine tests
│   └── test_integration.py # Integration tests
├── app.py               # Flask application entry point
├── seed.py              # Database seeding script
└── requirements.txt     # Python dependencies

frontend/
├── src/
│   ├── components/      # React components
│   │   ├── TaskModals/  # Task creation/editing modals
│   │   ├── TimetableGrid/  # Timetable grid and slots
│   │   ├── DragDropContext.tsx  # Drag-and-drop provider
│   │   ├── UnassignedPanel.tsx  # Unassigned tasks list
│   │   └── ConflictModal.tsx    # Conflict resolution dialog
│   ├── pages/
│   │   ├── Schedule.tsx        # Main scheduling interface
│   │   ├── Aides.tsx           # Aide management
│   │   ├── Tasks.tsx           # Task management
│   │   └── Requests.tsx        # Teacher requests
│   ├── store/
│   │   └── stores/
│   │       ├── aidesStore.ts
│   │       ├── tasksStore.ts
│   │       ├── assignmentsStore.ts
│   │       ├── absencesStore.ts
│   │       ├── undoStore.ts    # 10-level undo/redo
│   │       └── uiStore.ts
│   ├── services/
│   │   ├── api.ts       # Axios API client
│   │   ├── aidesApi.ts  # Aides endpoints
│   │   ├── tasksApi.ts  # Tasks endpoints
│   │   ├── assignmentsApi.ts  # Assignments endpoints
│   │   └── absencesApi.ts     # Absences endpoints
│   ├── hooks/           # Custom React hooks
│   │   ├── useDragDrop.ts
│   │   ├── useConflictResolution.ts
│   │   └── useUndo.ts
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── test-utils.tsx   # Test utilities with Router context
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── components/      # Component tests
│   ├── integration/     # Integration tests
│   └── setup.ts         # Test setup
├── cypress/
│   ├── e2e/
│   │   ├── drag-drop.cy.ts
│   │   ├── conflict-resolution.cy.ts
│   │   └── absence-handling.cy.ts
│   └── support/
│       └── commands.ts  # Custom Cypress commands
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts

instance/
└── timetable.db         # SQLite database file

.specify/
├── memory/
│   └── constitution.md  # Project constitution (v1.0.0)
├── scripts/
│   └── powershell/      # Workflow automation scripts
└── templates/           # Spec-kit templates
```

**Structure Decision**: Web application structure (Option 2) selected because:
- Feature requires both UI (drag-and-drop interface) and API (data persistence, conflict detection)
- Clear separation between presentation (React) and business logic (Flask)
- Constitution mandates REST API for all backend functionality
- Offline operation requires coordinated frontend + backend with local database
- Testing strategy requires separate test suites for frontend, backend, and integration

## Phase 0: Outline & Research

### Research Tasks Completed
All technical decisions were pre-clarified in the specification phase. No NEEDS CLARIFICATION markers remain.

### Technology Research

#### 1. Flask + SQLAlchemy Stack
**Decision**: Flask 3.x with SQLAlchemy 2.x ORM  
**Rationale**:
- Lightweight framework suitable for local REST API
- SQLAlchemy provides ORM with SQLite support
- Flask-CORS enables frontend-backend communication
- Alembic for database migrations
- Constitution-approved stack

**Alternatives Considered**:
- FastAPI: More features than needed for offline app, async not required
- Django: Too heavyweight for simple REST API with SQLite

#### 2. React + TypeScript Frontend
**Decision**: React 18+ with TypeScript strict mode, Vite build tool  
**Rationale**:
- Component-based architecture suits timetable grid UI
- TypeScript provides type safety for complex drag-drop logic
- Vite offers fast dev server and build performance
- Material-UI v5 provides WCAG AA compliant components
- Constitution-mandated stack

**Alternatives Considered**:
- Vue: Less ecosystem support for drag-drop libraries
- Angular: Steeper learning curve, more boilerplate

#### 3. Drag-and-Drop Implementation
**Decision**: @hello-pangea/dnd (maintained fork of react-beautiful-dnd)  
**Rationale**:
- Accessible drag-drop with keyboard navigation
- Smooth animations and visual feedback
- Supports complex drop zones and constraints
- Active maintenance and TypeScript support
- Proven in production applications

**Alternatives Considered**:
- react-dnd: Lower-level API, more complex implementation
- dnd-kit: Newer library, less mature ecosystem
- Native HTML5 D&D: Accessibility challenges, browser inconsistencies

#### 4. State Management
**Decision**: Zustand with local storage persistence  
**Rationale**:
- Lightweight (~1KB), minimal boilerplate
- Built-in persistence middleware
- DevTools support for debugging
- Cross-store subscriptions for reactive updates
- Constitution-approved stack

**Alternatives Considered**:
- Redux Toolkit: More boilerplate, unnecessary complexity
- Jotai: Atomic state less suited for timetable grid
- Context API: Performance issues with frequent updates

#### 5. Recurrence Engine
**Decision**: python-dateutil for iCal RRULE parsing  
**Rationale**:
- Standard iCal RRULE format compatibility
- Handles complex recurrence patterns (BYDAY, FREQ, UNTIL)
- Eager generation strategy (4-10 week horizon)
- Mature library with comprehensive testing

**Alternatives Considered**:
- Custom recurrence logic: Reinventing wheel, error-prone
- rrule.js (frontend): Server-side generation preferred for data consistency

#### 6. Conflict Detection Strategy
**Decision**: Optimistic locking with version timestamps  
**Rationale**:
- Multi-administrator concurrent editing required (FR-048)
- Detect conflicts on assignment update
- Last-write-wins with user notification
- Undo conflict detection via version comparison

**Alternatives Considered**:
- Pessimistic locking: Poor UX for offline collaboration
- CRDT: Overkill for assignment scheduling, complex merge logic

#### 7. Undo/Redo Implementation
**Decision**: Command pattern with 10-action rolling buffer per session  
**Rationale**:
- Encapsulates each action (assign, unassign, edit, delete)
- Rolling buffer (FIFO queue) maintains fixed size
- Per-session storage (not persistent across page refresh)
- Conflict detection on undo via timestamp comparison

**Alternatives Considered**:
- Event sourcing: Too complex for MVP, storage overhead
- Persistent undo history: Not required by constitution

**Output**: All research complete - ready for Phase 1 design

## Phase 1: Design & Contracts

### 1. Data Model (data-model.md generated)

#### Entities & Relationships

**TeacherAide**
- Fields: `id` (PK), `name`, `qualifications`, `colour_hex`
- Relationships: 
  - One-to-Many with `Availability` (weekly schedule patterns)
  - One-to-Many with `Assignment` (assigned tasks)
  - One-to-Many with `Absence` (absence records)
- Validation: Name required, colour_hex must be valid hex, qualifications optional text

**Availability**
- Fields: `id` (PK), `aide_id` (FK), `weekday` (enum: MO-FR), `start_time`, `end_time`
- Relationships: Many-to-One with `TeacherAide`
- Validation: end_time > start_time, weekday in [MO,TU,WE,TH,FR], times in 30-min increments
- Constraints: Unique (aide_id, weekday, start_time)

**Task**
- Fields: `id` (PK), `title`, `category` (enum), `start_time`, `end_time`, `recurrence_rule` (RRULE string), `expires_on` (date), `classroom_id` (FK, nullable), `notes`, `status` (enum)
- Categories: PLAYGROUND, CLASS_SUPPORT, GROUP_SUPPORT, INDIVIDUAL_SUPPORT
- Status: UNASSIGNED, ASSIGNED, IN_PROGRESS, COMPLETE
- Relationships:
  - Many-to-One with `Classroom` (optional)
  - One-to-Many with `Assignment` (occurrences)
- Validation: Title required, times in 30-min increments, end_time > start_time, recurrence_rule valid iCal RRULE format

**Assignment**
- Fields: `id` (PK), `task_id` (FK), `aide_id` (FK, nullable), `date`, `start_time`, `end_time`, `status` (enum), `version` (timestamp for optimistic locking)
- Status: UNASSIGNED, ASSIGNED, IN_PROGRESS, COMPLETE
- Relationships:
  - Many-to-One with `Task`
  - Many-to-One with `TeacherAide` (nullable - unassigned if null)
- Validation: Date required, times in 30-min increments, end_time > start_time
- Constraints: Collision detection via query (aide_id + date + time overlap check)

**Absence**
- Fields: `id` (PK), `aide_id` (FK), `date`, `reason` (optional text), `created_at` (timestamp)
- Relationships: Many-to-One with `TeacherAide`
- Validation: Date required, aide_id required
- Constraints: **Unique (aide_id, date)** to prevent duplicate absences

**Classroom**
- Fields: `id` (PK), `name`, `capacity` (int), `notes` (text)
- Relationships: One-to-Many with `Task`
- Validation: Name required, capacity positive integer

**Request** (Teacher submission)
- Fields: `id` (PK), `requesting_teacher`, `task_title`, `task_category`, `preferred_date`, `preferred_time`, `classroom_id` (FK, nullable), `notes`, `status` (enum: PENDING, APPROVED, REJECTED), `created_at` (timestamp)
- Relationships: Many-to-One with `Classroom` (optional)
- Validation: Required fields: requesting_teacher, task_title, task_category, preferred_date

#### State Transitions

**Assignment Status Flow**:
```
UNASSIGNED → ASSIGNED (via drag-drop)
         ↓
   IN_PROGRESS (aide starts task)
         ↓
     COMPLETE (aide finishes)
```

**Absence Creation Flow**:
```
Absence Created
    ↓
Find all Assignments (aide_id + date)
    ↓
Set aide_id = NULL, status = UNASSIGNED
    ↓
Return affected assignments to unassigned panel
```

**Conflict Resolution Flow**:
```
Drag task to occupied slot
    ↓
Detect collision (time overlap check)
    ↓
If partial overlap: Auto-shorten first task
If full overlap: Show replace/cancel modal
    ↓
User confirms → Update assignments
```

### 2. API Contracts (contracts/api-spec.yaml generated)

**OpenAPI 3.0 Specification** (summary - full spec in contracts/api-spec.yaml):

#### Teacher Aides
- `GET /api/aides` - List all aides
- `POST /api/aides` - Create aide {name, qualifications, colour_hex}
- `GET /api/aides/{id}` - Get aide details
- `PUT /api/aides/{id}` - Update aide
- `DELETE /api/aides/{id}` - Delete aide (cascades absences/assignments)

#### Availability
- `GET /api/aides/{id}/availability` - Get aide's weekly availability
- `POST /api/aides/{id}/availability` - Set availability pattern {weekday, start_time, end_time}
- `DELETE /api/availability/{id}` - Remove availability slot

#### Tasks
- `GET /api/tasks` - List tasks (filter: status, category, date)
- `POST /api/tasks` - Create one-off task
- `POST /api/recurring-tasks` - Create recurring task with RRULE
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task (regenerates future assignments if recurring)
- `DELETE /api/tasks/{id}` - Delete task (future occurrences only)

#### Assignments
- `GET /api/assignments` - List assignments (filter: week, aide_id, status)
- `GET /api/assignments/weekly-matrix?week=YYYY-WW` - Structured weekly grid for UI
- `POST /api/assignments` - Create single assignment
- `POST /api/assignments/batch` - Batch create (recurring task multi-day selection)
- `POST /api/assignments/check` - Collision detection (dry-run)
- `PUT /api/assignments/{id}` - Update assignment (returns 409 on conflict with details)
- `DELETE /api/assignments/{id}` - Delete assignment

**Conflict Response (409)**:
```json
{
  "error": "Assignment conflict",
  "conflicting_assignment": {
    "id": 123,
    "task_title": "Existing Task",
    "start_time": "09:00",
    "end_time": "10:00",
    "aide_name": "John Smith"
  },
  "suggestion": "replace"  // or "shorten_first" for partial overlap
}
```

#### Absences
- `GET /api/absences?week=YYYY-WW` - List absences for week (timetable overlay)
- `POST /api/absences` - Mark absent {aide_id, date, reason}
  - Response includes `affected_assignments[]` array
- `DELETE /api/absences/{id}` - Remove absence (restore assignments if possible)

#### Recurrence Engine
- `POST /api/assignments/extend-horizon` - Extend recurring task horizon
- `POST /api/scheduler/extend-horizon` - Manual horizon extension {weeks: N}
- `GET /api/scheduler/status` - Scheduler status
- `POST /api/scheduler/control` - Start/stop scheduler {action: "start" | "stop"}

#### Teacher Requests
- `GET /api/requests` - List requests (filter: status)
- `POST /api/requests` - Submit request {requesting_teacher, task_title, category, preferred_date, preferred_time, classroom_id, notes}
- `PUT /api/requests/{id}` - Update status {status: APPROVED | REJECTED}
  - On APPROVED: creates Task → Assignment (UNASSIGNED)

### 3. Contract Tests (tests/test_contracts.py generated)

Contract tests verify API specification compliance:
- Schema validation (request/response structure)
- HTTP status code correctness
- Error response format consistency
- Required/optional field enforcement

Tests written to **fail initially** (no implementation yet).

### 4. Quickstart Test Scenarios (quickstart.md generated)

Primary user journey translated to executable test:
1. Setup: Seed database with aides, classrooms, tasks
2. GET /api/assignments/weekly-matrix?week=2025-W01 → verify grid structure
3. Drag simulation: POST /api/assignments {task_id, aide_id, date, start_time, end_time}
4. Verify: GET /api/assignments → task shows in aide's timetable
5. Absence: POST /api/absences {aide_id, date} → verify affected_assignments returned
6. Verify: GET /api/assignments → tasks back in unassigned (aide_id=null)
7. Teardown: Clean database

### 5. Agent Context Update (CLAUDE.md generated)

**Output**: All Phase 1 artifacts generated successfully:
- ✅ `data-model.md`: Complete entity definitions with relationships, constraints, state transitions
- ✅ `contracts/api-spec.yaml`: OpenAPI 3.0 specification with all 40+ endpoints
- ✅ `contracts/rrule-spec.md`: iCal RRULE recurrence patterns specification
- ✅ `quickstart.md`: Integration test scenario validating user journey
- ✅ Agent context file ready for update

## Phase 2: Task Planning Approach

**Task Generation Strategy**:
The `/tasks` command will generate a comprehensive task breakdown from Phase 1 deliverables:

### Task Categories

**1. Database & Models** (6-8 tasks)
- Task 1: Create Alembic migration for initial schema [P]
- Task 2: Implement TeacherAide + Availability models [P]
- Task 3: Implement Task model with RRULE validation [P]
- Task 4: Implement Assignment model with optimistic locking [P]
- Task 5: Implement Absence model with cascade logic [P]
- Task 6: Implement Classroom + Request models [P]
- Task 7: Add database indexes for collision queries
- Task 8: Create seed script with test data [P]

**2. Backend API - Core Endpoints** (8-10 tasks)
- Task 9: Implement `/api/aides` CRUD endpoints [P]
- Task 10: Implement `/api/aides/{id}/availability` endpoints [P]
- Task 11: Implement `/api/tasks` CRUD with recurrence [P]
- Task 12: Implement `/api/assignments` CRUD with collision detection [P]
- Task 13: Implement `/api/assignments/weekly-matrix` endpoint
- Task 14: Implement `/api/assignments/batch` for multi-day assignment
- Task 15: Implement `/api/absences` with cascade reassignment [P]
- Task 16: Implement `/api/requests` endpoints [P]

**3. Recurrence Engine & Business Logic** (4-6 tasks)
- Task 17: Implement RRULE parser with python-dateutil
- Task 18: Implement assignment generation algorithm (4-week horizon)
- Task 19: Implement collision detection service
- Task 20: Implement conflict resolution (replace/shorten/cancel)
- Task 21: Implement absence cascade logic (unassign + restore)
- Task 22: Implement background scheduler for horizon extension

**4. Frontend - State Management** (5-7 tasks)
- Task 23: Implement Zustand stores (aides, tasks, assignments, absences, undo, ui) [P]
- Task 24: Implement API service layer with Axios [P]
- Task 25: Implement undo/redo store (10-level rolling buffer)
- Task 26: Implement cross-store subscriptions for reactive updates
- Task 27: Add localStorage persistence middleware

**5. Frontend - UI Components** (10-12 tasks)
- Task 28: Implement TimetableGrid with Material-UI [P]
- Task 29: Implement UnassignedTasksPanel with filtering [P]
- Task 30: Implement drag-drop context (@hello-pangea/dnd)
- Task 31: Implement conflict resolution modal [P]
- Task 32: Implement multi-day selection dialog (recurring tasks) [P]
- Task 33: Implement absence management UI [P]
- Task 34: Implement task creation/edit modals [P]
- Task 35: Implement aide management UI [P]
- Task 36: Implement teacher request form [P]
- Task 37: Implement week navigation controls
- Task 38: Add accessibility (ARIA labels, keyboard nav, tooltips)

**6. Testing** (8-10 tasks)
- Task 39: Write backend model unit tests [P]
- Task 40: Write API endpoint integration tests [P]
- Task 41: Write recurrence engine tests [P]
- Task 42: Write collision detection tests [P]
- Task 43: Write frontend component tests (Vitest+RTL) [P]
- Task 44: Write drag-drop integration tests [P]
- Task 45: Write E2E tests with Cypress (critical paths) [P]
- Task 46: Write accessibility tests (keyboard nav, screen readers) [P]

**7. Integration & Polish** (4-6 tasks)
- Task 47: Implement error boundaries and toast notifications
- Task 48: Add loading states and optimistic updates
- Task 49: Performance optimization (memoization, lazy loading)
- Task 50: WCAG AA compliance audit and fixes
- Task 51: Integration testing (frontend + backend)
- Task 52: Documentation and deployment guide

### Task Ordering Strategy

**Dependencies**:
1. Database models must exist before API endpoints
2. API endpoints must exist before frontend integration
3. Tests written alongside implementation (not strict TDD, but comprehensive coverage)
4. Core features before polish (error handling, optimizations come later)

**Parallel Execution** [P]:
- Model creation (TeacherAide, Task, Assignment, etc.) can be done in parallel
- CRUD endpoints for different resources can be done in parallel
- Frontend stores can be built in parallel
- Component development can be parallelized
- Test suites can be written in parallel once implementation exists

**Estimated Output**: 50-55 numbered tasks in `tasks.md`

**IMPORTANT**: This phase is executed by the `/tasks` command, NOT by `/plan`

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach described (/plan command)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented: NONE

**Deliverables Generated**:
- [x] `plan.md` - This file
- [x] `research.md` - Technology research and decisions
- [x] `data-model.md` - Entity definitions and relationships
- [x] `contracts/api-spec.yaml` - OpenAPI 3.0 specification
- [x] `contracts/rrule-spec.md` - Recurrence pattern specification
- [x] `quickstart.md` - Integration test scenario
- [x] `tasks.md` - 104 detailed implementation tasks
- [x] `.cursor/rules/specify-rules.mdc` - Agent context file

---

## Next Steps

1. **Run `/tasks` command** to generate detailed task breakdown from this plan
2. **Review tasks.md** for completeness and ordering
3. **Begin implementation** following tasks.md sequence
4. **Run quickstart.md** tests to validate integration
5. **Execute E2E tests** with Cypress for drag-drop flows

---

*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
