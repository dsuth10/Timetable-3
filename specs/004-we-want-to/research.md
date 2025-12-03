# Research: Relief Pool Implementation

**Feature**: Relief Pool - Absent Aide Task Reassignment  
**Date**: 2025-12-03  
**Status**: Complete

## Executive Summary

This document captures research decisions for implementing the Relief Pool feature. The Relief Pool is a specialized holding area for task assignments that become "orphaned" when their assigned aide is marked absent. Unlike the current behavior (which unassigns tasks entirely), the Relief Pool preserves all scheduling context for quick reassignment.

---

## Research Question 1: How to Track Relief Pool Assignments?

### Decision
Add `RELIEF_POOL` to the existing `ASSIGNMENT_STATUSES` enum in the Assignment model.

### Rationale
- **Minimal change**: Leverages existing assignment infrastructure without new tables
- **Query efficiency**: Single query can fetch all Relief Pool items using status filter
- **Consistent patterns**: Follows existing status-based workflow (UNASSIGNED → ASSIGNED → IN_PROGRESS → COMPLETE)
- **Easy migration**: Simple Alembic migration to add enum value

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| New `ReliefPoolTask` table | Clean separation | Data duplication, sync complexity, more migrations | Overcomplicated for the use case |
| Boolean `is_relief_pool` flag | Simple addition | Less explicit, harder to query mixed states | Status enum is cleaner and more extensible |
| Soft-delete with restore | Preserves history | Complex restore logic, audit overhead | We don't need history for MVP |

### Implementation Notes
```python
# Current
ASSIGNMENT_STATUSES = {'UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETE'}

# After change
ASSIGNMENT_STATUSES = {'UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETE', 'RELIEF_POOL'}
```

---

## Research Question 2: How to Preserve Original Aide Reference?

### Decision
Add `original_aide_id` column to the Assignment model as a nullable foreign key to TeacherAide.

### Rationale
- **Restoration support**: When absence is cancelled, we know which aide to restore to
- **UI display**: Can show "Originally: John Smith" in Relief Pool cards
- **Minimal overhead**: Only populated for RELIEF_POOL status assignments
- **No data loss**: Preserves the assignment history without a full audit table

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Separate audit/history table | Full history | Overcomplicated, query joins | MVP doesn't need full history |
| JSON metadata column | Flexible | Harder to query, no FK integrity | Less type-safe |
| Store in `reason` field | No schema change | Hacky, loses type safety | Poor design |

### Implementation Notes
```python
# New column in Assignment model
original_aide_id = Column(
    Integer, 
    ForeignKey('teacher_aides.id', ondelete='SET NULL'), 
    nullable=True,
    index=True
)
```

---

## Research Question 3: How to Implement Date-Restricted Reassignment?

### Decision
Dual validation: Frontend provides immediate UX feedback, backend enforces rule on assignment update.

### Rationale
- **Immediate feedback**: Users see invalid drop zones highlighted correctly
- **Security**: Backend prevents any bypass via API manipulation
- **Consistent with existing**: Follows same pattern as conflict detection
- **Clear error messages**: Both layers can provide specific feedback

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Frontend-only validation | Simple | Security risk, API could bypass | Must have backend enforcement |
| Backend-only validation | Secure | Poor UX, late error feedback | Users need immediate visual feedback |

### Implementation Notes

**Frontend (drag-drop validation)**:
```typescript
// In useDragDrop hook or TimetableSlot
const canDrop = (dragItem: DragItem, targetDate: string) => {
  if (dragItem.source === 'relief-pool') {
    return dragItem.originalDate === targetDate;
  }
  return true; // Normal tasks can go anywhere
};
```

**Backend (assignment update)**:
```python
# In assignment route or relief_pool_service
def reassign_relief_pool_task(assignment_id: int, new_aide_id: int, target_date: date):
    assignment = Assignment.query.get(assignment_id)
    if assignment.status != 'RELIEF_POOL':
        raise ValueError("Not a Relief Pool task")
    if assignment.date != target_date:
        raise ValueError(f"Relief Pool tasks can only be assigned on their original date ({assignment.date})")
    # ... proceed with assignment
```

---

## Research Question 4: How to Implement Auto-Cleanup?

### Decision
Extend the existing APScheduler background job (in `scheduler.py`) to include Relief Pool cleanup logic.

### Rationale
- **Reuses infrastructure**: Existing scheduler handles horizon extension; adding cleanup is trivial
- **Configurable timing**: Can schedule based on latest task end time
- **No external dependencies**: Stays within offline-first architecture
- **Atomic cleanup**: Can use database transaction for bulk delete

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Database trigger | Automatic | SQLite trigger limitations, harder to debug | Limited trigger support |
| External cron job | Flexible | External dependency, deployment complexity | Violates local-first principle |
| On-demand (lazy) cleanup | Simple | Stale data visible until next action | Poor UX |

### Implementation Notes
```python
# In scheduler.py
def cleanup_expired_relief_pool():
    """Remove Relief Pool assignments past their date's latest task end time."""
    from datetime import datetime, date
    from api.models.assignment import Assignment
    from api.models import db
    
    today = date.today()
    now = datetime.now().time()
    
    # Find Relief Pool tasks from past dates (always expired)
    past_date_tasks = Assignment.query.filter(
        Assignment.status == 'RELIEF_POOL',
        Assignment.date < today
    ).all()
    
    # Find today's Relief Pool tasks past their end time
    # (Dynamic: check if current time > max(end_time) for today)
    today_tasks = Assignment.query.filter(
        Assignment.status == 'RELIEF_POOL',
        Assignment.date == today,
        Assignment.end_time < now
    ).all()
    
    for task in past_date_tasks + today_tasks:
        db.session.delete(task)
    
    db.session.commit()
```

---

## Research Question 5: How to Handle Absence Restoration?

### Decision
On absence DELETE, automatically attempt to restore RELIEF_POOL assignments to their original aide if time slots are still available.

### Rationale
- **Seamless UX**: Accidental absence marks can be easily undone
- **Conflict-aware**: Uses existing collision detection to avoid overwrites
- **Partial success OK**: Some tasks may restore, others may have conflicts
- **Explicit feedback**: Return list of restored vs. conflicting tasks

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Manual-only restoration | Simple | Poor UX for accidental marks | Too many clicks |
| Force restore (overwrite conflicts) | Always succeeds | Data loss risk | Could overwrite intentional assignments |
| No restoration | Simplest | Tasks lost forever | Very poor UX |

### Implementation Notes
```python
# In absences.py DELETE endpoint
def delete_absence(absence_id: int):
    absence = db.session.get(Absence, absence_id)
    
    # Find Relief Pool tasks for this aide/date
    relief_tasks = Assignment.query.filter(
        Assignment.status == 'RELIEF_POOL',
        Assignment.original_aide_id == absence.aide_id,
        Assignment.date == absence.date
    ).all()
    
    restored = []
    conflicts = []
    
    for task in relief_tasks:
        # Check if slot is available using collision_service
        if not has_collision(absence.aide_id, task.date, task.start_time, task.end_time):
            task.aide_id = task.original_aide_id
            task.original_aide_id = None
            task.status = 'ASSIGNED'
            restored.append(task.id)
        else:
            conflicts.append(task.id)
    
    db.session.delete(absence)
    db.session.commit()
    
    return {'restored': restored, 'conflicts': conflicts}
```

---

## Technology Decisions Summary

| Decision | Choice | Key Reason |
|----------|--------|------------|
| Relief Pool tracking | Assignment status enum | Minimal schema change |
| Original aide storage | `original_aide_id` column | Enables restoration |
| Date restriction | Frontend + Backend | UX + Security |
| Auto-cleanup | APScheduler job | Reuses existing infrastructure |
| Absence restoration | Auto-restore with conflict check | Best UX |

---

## Dependencies Identified

1. **Existing collision_service.py**: Reuse for conflict detection during restoration
2. **Existing scheduler.py**: Extend with cleanup job
3. **Existing drag-drop infrastructure**: Extend validation logic
4. **Alembic migrations**: For schema changes

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cleanup job runs while user is working | Medium | Run cleanup only after all tasks end (dynamic timing) |
| Schema migration on production data | Low | Test migration on copy of production DB |
| Performance with many Relief Pool tasks | Low | Add index on `(status, date)` |

---

*Research complete. Ready for Phase 1 design.*

