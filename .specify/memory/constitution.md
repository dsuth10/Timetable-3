# Teacher Aide Scheduler Constitution

## Core Principles

### I. Local-First Architecture
The system MUST operate completely offline using local resources. Every feature must function without network connectivity, using SQLite for data persistence and a single HTML bundle for the interface. Cloud features or external dependencies are prohibited in the core application.

### II. REST API Contract
All backend functionality MUST be exposed via a clean REST API. Endpoints must:
- Return JSON responses with standard HTTP status codes
- Follow RESTful resource naming conventions
- Provide consistent error responses (e.g., 409 for conflicts with detailed context)
- Be independently testable and documented

### III. Comprehensive Testing (NON-NEGOTIABLE)
All features MUST have comprehensive test coverage before being considered complete:
- **Backend**: pytest with comprehensive coverage for all API endpoints
- **Frontend**: Vitest + React Testing Library with proper component isolation
- All business logic must have corresponding test cases
- Integration tests required for: collision detection, recurrence engine, absence handling, drag-and-drop workflows
- Tests must validate both happy paths and edge cases
- Test coverage is mandatory; tests don't need to be written before implementation but must exist before feature completion

### IV. Drag-and-Drop First Interface
All timetable modifications MUST be achievable through drag-and-drop interactions:
- Task assignment via drag from unassigned list to timetable slots
- Task reassignment via drag between aides or time slots
- Visual feedback during drag operations (hover states, drop zones, collision warnings)
- Conflict resolution presented inline during drag operations
- Alternative input methods (forms, dialogs) are supplementary only

### V. Accessibility & Inclusive Design
User interfaces MUST meet WCAG AA standards:
- Color-blind safe palette with sufficient contrast ratios
- Keyboard navigation for all interactive elements
- ARIA labels and semantic HTML throughout
- Tooltips and visual feedback for all actions
- Screen reader compatibility

### VI. Data Integrity & Conflict Prevention
The system MUST prevent data conflicts proactively:
- Unique constraints enforced at database level (e.g., one absence per aide per date)
- Real-time collision detection before assignment commits
- Atomic operations for complex updates (e.g., absence creation + assignment release)
- Explicit conflict resolution flows with user confirmation
- Undo capabilities where feasible

## Technology Standards

### Stack Decisions
Technology choices are flexible during initial development, but once a decision is made and implementation begins, the team MUST commit to that choice:
- **No mid-stream rewrites**: Changing frameworks or core libraries requires documented architectural justification
- **Version consistency**: Once a major version is chosen (e.g., React 18, Flask 3), the project stays on that version family
- **Dependency stability**: New dependencies must be evaluated against existing choices to avoid conflicts or redundancy

### Current Stack (Initial Decisions)
- **Backend**: Python 3.12+, Flask, SQLAlchemy, SQLite
- **Frontend**: React 18+, TypeScript (strict mode), Vite, Material-UI v5
- **State Management**: Zustand (lightweight, persistent stores)
- **API Communication**: Axios with centralized error handling
- **Drag & Drop**: @hello-pangea/dnd
- **Testing**: pytest (backend), Vitest + RTL (frontend), Cypress (E2E)

*Note: These choices are locked for the current implementation phase. Future major versions may reconsider.*

## Development Workflow

### Code Quality Gates
1. **Test Coverage**: All features require comprehensive test coverage before completion
2. **Type Safety**: TypeScript strict mode with no `any` types in production code
3. **API Validation**: All endpoints must validate inputs and return structured errors
4. **Component Isolation**: Frontend components must be testable with proper Router/Provider context
5. **Drag-and-Drop Validation**: All timetable modification features must be testable via drag-and-drop

### Implementation Standards
- **State Management**: Use Zustand stores for global state; local state for component-specific data
- **Error Handling**: Implement error boundaries; use toast notifications for user feedback
- **API Design**: Centralized service layer; consistent request/response patterns
- **Recurrence Logic**: Use iCal RRULE standard; eager generation with configurable horizons
- **Database Migrations**: Alembic for all schema changes; never modify production schema manually
- **Drag-and-Drop UX**: All timetable interactions must provide immediate visual feedback and conflict warnings

## Operational Constraints

### MVP Requirements
- Single SQLite file for all data (portable, backup-friendly)
- Runs from local filesystem (no server deployment required)
- Metric date/time formatting (AEST, 24-hour clock, ISO weeks)
- Desktop-optimized interface (no mobile responsive requirement for MVP)
- No authentication required (single-user, trusted environment)

## Scope & Roadmap

### MVP Core Features
- Visual drag-and-drop timetable interface
- Recurring task engine with RRULE support
- Absence management with automatic task reassignment
- Collision detection and conflict resolution
- Status tracking (Unassigned → Assigned → In Progress → Complete)
- Teacher request submissions

### Post-MVP Enhancements
The following features are explicitly in scope for future development:
- **Authentication & Authorization**: Multi-user support with role-based access control (Flask-Login & JWT)
- **Notifications**: Push notifications (email digest, PWA service workers)
- **Reporting**: Advanced analytics and report generator (CSV & PDF export)
- **Mobile Support**: Mobile-responsive timetable layout (CSS Grid with swipe interactions)
- **Advanced Absence Features**: Half-day absences (AM/PM) using start_time/end_time fields
- **Integrations**: Sync to HR-provided leave calendar via CSV import

*These features must maintain compliance with all core principles (local-first, drag-and-drop, accessibility, testing)*

## Governance

### Constitution Authority
- This constitution supersedes all other development practices and decisions
- Technical choices must align with these principles; deviations require documented justification
- Feature requests that violate core principles must be rejected or deferred

### Amendment Process
- Constitution changes require documentation of rationale and impact assessment
- Breaking changes to core principles need migration plan for existing features
- All PRs must verify compliance with constitution during code review

### Compliance Verification
- PR reviews must confirm: test coverage, accessibility standards, API consistency, drag-and-drop functionality
- Feature complexity must be justified against YAGNI principles
- Use this constitution as the source of truth for architectural decisions

**Version**: 1.0.0 | **Ratified**: 2025-10-01 | **Last Amended**: 2025-10-01