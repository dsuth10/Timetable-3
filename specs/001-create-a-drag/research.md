# Research: Drag-and-Drop Timetable Scheduler

**Feature**: 001-create-a-drag  
**Date**: 2025-10-01

## Technology Decisions

### 1. Backend Framework: Flask 3.x + SQLAlchemy 2.x

**Decision**: Use Flask 3.x with SQLAlchemy 2.x ORM for REST API

**Rationale**:
- Lightweight framework ideal for local REST API without network overhead
- SQLAlchemy 2.x provides modern ORM with excellent SQLite support
- Flask-CORS enables seamless frontend-backend communication
- Alembic migration system maintains schema evolution
- Proven stack in constitution, already approved

**Best Practices**:
- Use Flask Blueprints for route organization (aides, tasks, assignments, absences)
- Implement request validation with marshmallow or pydantic
- Use SQLAlchemy sessions with proper transaction handling
- Enable Flask error handlers for consistent JSON error responses

**Alternatives Considered**:
- ❌ FastAPI: Async features unnecessary for offline SQLite app, adds complexity
- ❌ Django: Too heavyweight, includes ORM/admin/auth we don't need for MVP

### 2. Frontend Stack: React 18 + TypeScript + Vite

**Decision**: React 18+ with TypeScript strict mode, built with Vite

**Rationale**:
- Component-based architecture maps naturally to timetable grid structure
- TypeScript strict mode catches drag-drop logic errors at compile time
- Vite provides instant HMR and optimized production builds
- Material-UI v5 offers WCAG AA compliant components out-of-box
- Constitution-mandated stack with proven track record

**Best Practices**:
- Use React.memo for grid cells to prevent unnecessary re-renders
- Implement virtualization if aide count exceeds 20 (react-window)
- Leverage React Query or SWR for server state management
- Use Error Boundaries for graceful failure handling

**Alternatives Considered**:
- ❌ Vue 3: Smaller drag-drop ecosystem, less TypeScript integration
- ❌ Angular: Steep learning curve, excessive boilerplate for this use case

### 3. Drag-and-Drop Library: @hello-pangea/dnd

**Decision**: Use @hello-pangea/dnd (maintained fork of react-beautiful-dnd)

**Rationale**:
- Built-in accessibility: keyboard navigation, screen reader announcements
- Smooth animations with GPU acceleration for 60fps performance
- Flexible API supports complex drop zones (multi-slot tasks, conflict zones)
- Active maintenance (original library deprecated)
- TypeScript definitions included

**Implementation Patterns**:
- Wrap app in `<DragDropContext onDragEnd={handleDrop}>`
- Unassigned panel as `<Droppable droppableId="unassigned">`
- Each aide column as `<Droppable droppableId="{aide_id}_{day}_{time}">`
- Task cards as `<Draggable draggableId="task-{id}">`
- Use `isDragDisabled` for read-only views (teacher aide interface)

**Alternatives Considered**:
- ❌ react-dnd: Lower-level primitives, more code for same result
- ❌ dnd-kit: Newer library, less battle-tested, smaller community
- ❌ Native HTML5 D&D: Poor accessibility, browser inconsistencies

### 4. State Management: Zustand

**Decision**: Zustand with localStorage persistence

**Rationale**:
- Minimal boilerplate (~10 lines per store vs 50+ for Redux)
- Built-in persistence middleware for offline-first requirement
- Cross-store subscriptions enable reactive updates (absence → assignments)
- DevTools support for debugging complex state changes
- Constitution-approved, aligns with simplicity principle

**Store Structure**:
- `aidesStore`: Teacher aide list, CRUD operations
- `tasksStore`: Task definitions, recurring patterns
- `assignmentsStore`: Weekly matrix data, collision state
- `absencesStore`: Absence records with weekly filtering
- `undoStore`: 10-action rolling buffer with redo support
- `uiStore`: Selected week, active filters, modals

**Best Practices**:
- Use immer middleware for immutable updates
- Implement selectors for derived state (unassigned count, conflicts)
- Separate actions from state for better testability

**Alternatives Considered**:
- ❌ Redux Toolkit: Excessive boilerplate, overkill for this feature set
- ❌ Jotai: Atomic state less suited for grid-based data structure
- ❌ Context API: Performance issues with frequent drag-drop updates

### 5. Recurrence Engine: python-dateutil RRULE

**Decision**: Use python-dateutil for iCal RRULE parsing and occurrence generation

**Rationale**:
- Industry-standard iCal RRULE format (RFC 5545 compliant)
- Handles complex patterns: `FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20251231`
- Eager generation strategy: create 4-10 weeks of assignments upfront
- Mature library with 15+ years of production use

**Implementation Strategy**:
1. Task creation: Store RRULE string + expires_on date
2. Assignment generation: Parse RRULE → generate dates → create assignment shells
3. Horizon extension: Background scheduler runs weekly to extend 4-week window
4. Task modification: Regenerate future assignments (delete + recreate)

**Configuration**:
- Default horizon: 4 weeks (configurable up to 10 weeks = school term)
- Scheduler runs: Saturday midnight (weekly extension)
- Max occurrences per task: 200 (safety limit)

**Alternatives Considered**:
- ❌ Custom recurrence logic: Reinventing wheel, prone to edge case bugs
- ❌ Frontend generation (rrule.js): Server-side generation ensures data consistency

### 6. Conflict Detection: Optimistic Locking

**Decision**: Optimistic locking with version timestamps for concurrent editing

**Rationale**:
- Multi-administrator requirement (FR-048): Need concurrent editing support
- Optimistic approach: Assume no conflicts, detect on commit
- Version field: Timestamp updated on every assignment change
- User-friendly: No locks blocking others, conflicts resolved interactively

**Conflict Detection Algorithm**:
```python
def update_assignment(assignment_id, new_data, client_version):
    assignment = Assignment.query.get(assignment_id)
    
    # Version mismatch = concurrent edit
    if assignment.version != client_version:
        return 409, {
            "error": "Conflict detected",
            "current_state": assignment.to_dict(),
            "your_changes": new_data
        }
    
    # Check time collision with other assignments
    collision = check_time_collision(assignment.aide_id, assignment.date, new_data.start_time, new_data.end_time)
    if collision:
        return 409, {"error": "Time conflict", "conflicting_assignment": collision}
    
    # Update with new version
    assignment.update(new_data)
    assignment.version = datetime.utcnow()
    db.session.commit()
    return 200, assignment.to_dict()
```

**Conflict Resolution Strategies**:
1. **Full Overlap**: Show modal → Replace (unassign first task) or Cancel
2. **Partial Overlap**: Auto-shorten first task to end when second begins
3. **Concurrent Edit**: Show diff → Keep theirs or Apply mine
4. **Undo Conflict**: Detect version mismatch → Warn user → Proceed or Cancel

**Alternatives Considered**:
- ❌ Pessimistic locking: Poor UX (locks block users), unnecessary for offline app
- ❌ CRDT: Overkill complexity, merge semantics unclear for scheduling conflicts

### 7. Undo/Redo System: Command Pattern

**Decision**: Command pattern with 10-action rolling FIFO buffer per session

**Rationale**:
- Encapsulates each action as reversible command object
- Rolling buffer: Fixed 10-action limit, oldest removed when full
- Per-session storage: In-memory (not persisted across refresh)
- Conflict-aware: Check version before undo to detect concurrent changes

**Command Structure**:
```typescript
interface Command {
  type: 'ASSIGN' | 'UNASSIGN' | 'UPDATE' | 'DELETE';
  execute: () => Promise<void>;
  undo: () => Promise<void>;
  timestamp: number;
  affectedEntities: { type: string; id: number; version: number }[];
}
```

**Undo Flow**:
1. Pop command from undo stack
2. Check versions of affected entities (conflict detection)
3. If versions match: Execute undo() → Push to redo stack
4. If versions mismatch: Show conflict dialog → User decides

**Edge Cases**:
- Buffer full: Remove oldest command (FIFO)
- Page refresh: Lose undo history (session-only)
- Concurrent edit: Detect via version mismatch, warn user
- Cascading undo: If A depends on B, undo B warns "This will also undo A"

**Alternatives Considered**:
- ❌ Event sourcing: Persistent history overkill, storage overhead
- ❌ Persistent undo: Not required by spec, adds complexity

## Performance Considerations

### Frontend Optimizations
1. **Grid Rendering**: React.memo for slot components, re-render only on data change
2. **Virtualization**: Implement if >20 aides (react-window for columns)
3. **Debouncing**: 150ms debounce on drag hover for conflict checks
4. **Lazy Loading**: Code-split routes, defer non-critical components

### Backend Optimizations
1. **Indexing**: Add indexes on (aide_id, date, start_time) for collision queries
2. **Eager Loading**: SQLAlchemy joinedload() for assignment → task → classroom
3. **Query Optimization**: Use EXISTS subquery for availability checks
4. **Caching**: Cache weekly matrix for 30s (refresh on assignment change)

### Database Schema
1. **Constraints**: Unique index on (aide_id, date) for absences
2. **Cascades**: ON DELETE CASCADE for aide → assignments → absences
3. **Triggers**: Update assignment.version on every UPDATE automatically

## Testing Strategy

### Backend Tests (pytest)
- **Unit**: Model validation, RRULE parsing, collision detection logic
- **Integration**: API endpoints with test database
- **Contract**: OpenAPI spec validation

### Frontend Tests (Vitest + RTL)
- **Unit**: Store actions, utility functions, hooks
- **Component**: Isolated rendering with mock data
- **Integration**: Drag-drop flows with test harness

### E2E Tests (Cypress)
- **Critical Paths**: Assign task, handle conflict, mark absence, undo action
- **Accessibility**: Keyboard navigation, screen reader announcements
- **Cross-browser**: Chrome, Firefox, Safari

## Security Considerations

### Input Validation
- Sanitize task titles/notes to prevent XSS (escape HTML)
- Validate time formats (HH:MM 30-min increments)
- Enforce date ranges (within school year bounds)
- Limit RRULE complexity (max 200 occurrences)

### Data Integrity
- Foreign key constraints prevent orphaned records
- Unique constraints prevent duplicate absences
- Transaction isolation prevents race conditions
- Version checks prevent concurrent edit conflicts

### Offline Security
- No authentication in MVP (single-user trusted environment per constitution)
- SQLite file permissions: Read/write for app user only
- Input validation prevents SQL injection (ORM parameterized queries)

## Deployment Considerations

### MVP Deployment
- **Package**: Single HTML bundle + SQLite file
- **Distribution**: Zip archive or installer (Electron wrapper optional)
- **Updates**: Manual download + replace (no auto-update in MVP)

### Production Readiness (Post-MVP)
- Add authentication (Flask-Login + JWT)
- Implement backup strategy (automated SQLite snapshots)
- Add logging/monitoring (structured JSON logs)
- Performance profiling (SQLAlchemy query timing)

## Conclusion

All technical decisions align with constitution requirements:
- ✅ Local-first: SQLite + offline operation
- ✅ REST API: Flask with clean endpoint design
- ✅ Comprehensive testing: pytest + Vitest + Cypress
- ✅ Drag-drop first: @hello-pangea/dnd with accessibility
- ✅ Accessibility: WCAG AA via Material-UI + keyboard nav
- ✅ Data integrity: Optimistic locking + constraints

No unresolved technical unknowns remain. Ready for Phase 1 design.



