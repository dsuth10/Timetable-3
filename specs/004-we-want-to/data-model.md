# Data Model: Relief Pool

**Feature**: Relief Pool - Absent Aide Task Reassignment  
**Date**: 2025-12-03

## Overview

This document defines the data model changes required to implement the Relief Pool feature. The changes are minimal and extend the existing Assignment model rather than introducing new entities.

---

## Entity Changes

### Assignment (Modified)

The Assignment model is extended with a new status value and a column to track the original aide.

#### Schema Changes

```sql
-- Existing columns (unchanged)
id              INTEGER PRIMARY KEY
task_id         INTEGER NOT NULL REFERENCES tasks(id)
aide_id         INTEGER REFERENCES teacher_aides(id)  -- Nullable
recurring_series_id INTEGER REFERENCES recurring_series(id)
date            DATE NOT NULL
start_time      TIME NOT NULL
end_time        TIME NOT NULL
status          VARCHAR(20) NOT NULL  -- Values: UNASSIGNED, ASSIGNED, IN_PROGRESS, COMPLETE, RELIEF_POOL (NEW)
version         INTEGER NOT NULL DEFAULT 1
created_at      DATETIME NOT NULL
updated_at      DATETIME NOT NULL

-- NEW column
original_aide_id INTEGER REFERENCES teacher_aides(id)  -- Nullable, stores aide before absence
```

#### Status Enum Extension

```python
# Before
ASSIGNMENT_STATUSES = {'UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETE'}

# After
ASSIGNMENT_STATUSES = {'UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETE', 'RELIEF_POOL'}
```

#### New Column Definition

```python
original_aide_id = Column(
    Integer,
    ForeignKey('teacher_aides.id', ondelete='SET NULL'),
    nullable=True,
    index=True,
    comment='Stores the original aide ID when task enters Relief Pool'
)
```

#### New Index

```python
# Add to __table_args__
Index('idx_assignments_relief_pool', 'status', 'date', 
      postgresql_where=text("status = 'RELIEF_POOL'"))
```

#### State Transitions

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐
│  UNASSIGNED  │──▶│   ASSIGNED   │──▶│ IN_PROGRESS  │──▶│  COMPLETE  │
└──────────────┘   └──────────────┘   └──────────────┘   └────────────┘
       ▲                  │                   │
       │                  │ Absence           │ Absence
       │                  ▼ Created           ▼ Created
       │           ┌──────────────┐           │
       │           │ RELIEF_POOL  │◀──────────┘
       │           └──────────────┘
       │                  │
       │                  │ Reassigned to new aide
       │                  ▼
       │           ┌──────────────┐
       └───────────│   ASSIGNED   │ (new aide)
                   └──────────────┘
```

#### Validation Rules

1. **RELIEF_POOL status requires original_aide_id**: When status is RELIEF_POOL, original_aide_id MUST be set
2. **aide_id is NULL in RELIEF_POOL**: When entering Relief Pool, aide_id is set to NULL
3. **Clearing original_aide_id on reassignment**: When task leaves Relief Pool, original_aide_id is cleared

```python
@validates('status')
def validate_status(self, key, value):
    if value == 'RELIEF_POOL':
        if not self.original_aide_id:
            raise ValueError("original_aide_id required for RELIEF_POOL status")
        if self.aide_id is not None:
            raise ValueError("aide_id must be NULL for RELIEF_POOL status")
    return value
```

---

### Absence (Behavior Change Only)

No schema changes to the Absence model. Only the cascade behavior changes.

#### Modified Cascade Behavior

**Before** (current behavior):
```python
# On absence creation
UPDATE assignments
SET aide_id = NULL, status = 'UNASSIGNED'
WHERE aide_id = :aide_id AND date = :date
```

**After** (new behavior):
```python
# On absence creation
UPDATE assignments
SET original_aide_id = aide_id,
    aide_id = NULL,
    status = 'RELIEF_POOL'
WHERE aide_id = :aide_id 
  AND date = :date
  AND status IN ('ASSIGNED', 'IN_PROGRESS')
```

---

## New Index Requirements

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_assignments_relief_pool` | `(status, date)` | Efficient Relief Pool queries |
| `idx_assignments_original_aide` | `(original_aide_id)` | Efficient restoration queries |

---

## Migration Script

```python
"""Add Relief Pool support to Assignment model

Revision ID: add_relief_pool_support
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add original_aide_id column
    op.add_column('assignments', sa.Column(
        'original_aide_id',
        sa.Integer(),
        sa.ForeignKey('teacher_aides.id', ondelete='SET NULL'),
        nullable=True
    ))
    
    # Add index for Relief Pool queries
    op.create_index(
        'idx_assignments_relief_pool',
        'assignments',
        ['status', 'date']
    )
    
    # Add index for restoration queries
    op.create_index(
        'idx_assignments_original_aide',
        'assignments',
        ['original_aide_id']
    )

def downgrade():
    op.drop_index('idx_assignments_original_aide', 'assignments')
    op.drop_index('idx_assignments_relief_pool', 'assignments')
    op.drop_column('assignments', 'original_aide_id')
```

---

## TypeScript Types (Frontend)

```typescript
// Existing Assignment type extended
interface Assignment {
  id: number;
  task_id: number;
  aide_id: number | null;
  recurring_series_id: number | null;
  date: string;  // ISO date
  start_time: string;  // HH:MM:SS
  end_time: string;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETE' | 'RELIEF_POOL';
  version: number;
  created_at: string;
  updated_at: string;
  
  // NEW
  original_aide_id: number | null;
  
  // Relationships (when included)
  task?: Task;
  aide?: TeacherAide;
  original_aide?: TeacherAide;  // NEW
}

// Relief Pool specific type for UI
interface ReliefPoolTask {
  assignment: Assignment;
  task: Task;
  originalAide: TeacherAide;
  classroom?: Classroom;
  canReassign: boolean;  // Based on current time vs task time
}

// Grouped by date for UI display
interface ReliefPoolByDate {
  [date: string]: ReliefPoolTask[];
}
```

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  TeacherAide    │       │     Task        │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ title           │
│ email           │       │ category        │
│ ...             │       │ classroom_id    │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ 1:N                     │ 1:N
         │                         │
         │    ┌────────────────────┘
         │    │
         ▼    ▼
┌─────────────────────────────────────────┐
│            Assignment                    │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ task_id (FK) ─────────────────────────► │
│ aide_id (FK, nullable) ───────────────► │
│ original_aide_id (FK, nullable) [NEW] ► │
│ date                                    │
│ start_time                              │
│ end_time                                │
│ status (includes RELIEF_POOL) [MOD]     │
│ version                                 │
└─────────────────────────────────────────┘
         │
         │ N:1
         ▼
┌─────────────────┐
│    Absence      │
├─────────────────┤
│ id (PK)         │
│ aide_id (FK)    │
│ date            │
│ reason          │
└─────────────────┘

Legend:
[NEW] = New field
[MOD] = Modified field
```

---

## Data Integrity Rules

1. **Unique constraint**: Only one assignment per aide per time slot (existing, unchanged)
2. **Relief Pool exclusivity**: A task in RELIEF_POOL has no current aide (aide_id = NULL)
3. **Original aide preservation**: original_aide_id is only set when status = RELIEF_POOL
4. **Cascade on aide delete**: original_aide_id SET NULL if referenced aide is deleted
5. **No orphaned Relief Pool**: If original_aide is deleted, task stays in Relief Pool until cleanup

---

## Query Patterns

### Get all Relief Pool tasks
```sql
SELECT a.*, t.*, ta.name as original_aide_name
FROM assignments a
JOIN tasks t ON a.task_id = t.id
LEFT JOIN teacher_aides ta ON a.original_aide_id = ta.id
WHERE a.status = 'RELIEF_POOL'
ORDER BY a.date, a.start_time
```

### Get Relief Pool count (for badge)
```sql
SELECT COUNT(*) 
FROM assignments 
WHERE status = 'RELIEF_POOL'
```

### Get Relief Pool for specific date
```sql
SELECT a.*, t.*, ta.name as original_aide_name
FROM assignments a
JOIN tasks t ON a.task_id = t.id
LEFT JOIN teacher_aides ta ON a.original_aide_id = ta.id
WHERE a.status = 'RELIEF_POOL' AND a.date = :date
ORDER BY a.start_time
```

### Find tasks to restore for an aide
```sql
SELECT * FROM assignments
WHERE status = 'RELIEF_POOL'
  AND original_aide_id = :aide_id
  AND date = :date
```

---

*Data model complete. Ready for API contract definition.*
















