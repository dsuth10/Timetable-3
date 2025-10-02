# Data Model: Drag-and-Drop Timetable Scheduler

**Feature**: 001-create-a-drag  
**Database**: SQLite (local file)  
**ORM**: SQLAlchemy 2.x

## Entity Relationship Diagram

```
TeacherAide (1) ──── (∞) Availability
     │
     │ (1)
     │
     ├── (∞) Assignment (∞) ──── (1) Task (∞) ──── (1) Classroom
     │
     │ (1)
     │
     └── (∞) Absence

Request (∞) ──── (1) Classroom [optional]
```

## Entities

### 1. TeacherAide

Represents a staff member who provides classroom and playground support.

**Table**: `teacher_aides`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| name | VARCHAR(100) | NOT NULL | Full name |
| qualifications | TEXT | | Comma-separated or JSON list of qualifications |
| colour_hex | VARCHAR(7) | NOT NULL | Visual identifier (e.g., "#FF5733") |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |
| updated_at | TIMESTAMP | DEFAULT NOW, ON UPDATE NOW | Last modification time |

**Relationships**:
- One-to-Many with `Availability` (weekly schedule)
- One-to-Many with `Assignment` (assigned tasks)
- One-to-Many with `Absence` (absence records)

**Validation**:
- `name`: Required, 1-100 characters
- `colour_hex`: Valid hex color format (#RRGGBB)
- `qualifications`: Optional, text field

**Indexes**:
- Primary key: `id`
- Index on `name` for search

---

### 2. Availability

Represents regular weekly availability pattern for a teacher aide.

**Table**: `availability`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| aide_id | INTEGER | NOT NULL, FK → teacher_aides(id) ON DELETE CASCADE | Teacher aide reference |
| weekday | VARCHAR(2) | NOT NULL | Day of week (MO, TU, WE, TH, FR) |
| start_time | TIME | NOT NULL | Start time (HH:MM format) |
| end_time | TIME | NOT NULL | End time (HH:MM format) |

**Relationships**:
- Many-to-One with `TeacherAide`

**Validation**:
- `weekday`: Must be one of [MO, TU, WE, TH, FR]
- `start_time` / `end_time`: Must be in 30-minute increments (08:00, 08:30, ..., 15:30, 16:00)
- `end_time` > `start_time`

**Constraints**:
- UNIQUE (aide_id, weekday, start_time) - prevent duplicate availability slots

**Indexes**:
- Primary key: `id`
- Composite index: `(aide_id, weekday)` for weekly queries

---

### 3. Task

Represents a support duty or assignment (one-off or recurring).

**Table**: `tasks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| title | VARCHAR(200) | NOT NULL | Task title |
| category | VARCHAR(20) | NOT NULL | Task category enum |
| start_time | TIME | NOT NULL | Start time (HH:MM format) |
| end_time | TIME | NOT NULL | End time (HH:MM format) |
| recurrence_rule | TEXT | | iCal RRULE string (NULL for one-off tasks) |
| expires_on | DATE | | Expiration date for recurring tasks |
| classroom_id | INTEGER | FK → classrooms(id) ON DELETE SET NULL | Optional classroom reference |
| notes | TEXT | | Additional notes |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'UNASSIGNED' | Task status enum |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |
| updated_at | TIMESTAMP | DEFAULT NOW, ON UPDATE NOW | Last modification time |

**Category Enum**: `PLAYGROUND`, `CLASS_SUPPORT`, `GROUP_SUPPORT`, `INDIVIDUAL_SUPPORT`

**Status Enum**: `UNASSIGNED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETE`

**Relationships**:
- Many-to-One with `Classroom` (optional)
- One-to-Many with `Assignment` (task occurrences)

**Validation**:
- `title`: Required, 1-200 characters
- `category`: Must be one of defined categories
- `start_time` / `end_time`: Must be in 30-minute increments
- `end_time` > `start_time`
- `recurrence_rule`: Valid iCal RRULE format if provided (validated via python-dateutil)
- `expires_on`: Required if recurrence_rule is set

**Indexes**:
- Primary key: `id`
- Index on `category` for filtering
- Index on `status` for filtering

---

### 4. Assignment

Represents a specific occurrence of a task assigned to an aide (or unassigned).

**Table**: `assignments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| task_id | INTEGER | NOT NULL, FK → tasks(id) ON DELETE CASCADE | Task reference |
| aide_id | INTEGER | FK → teacher_aides(id) ON DELETE SET NULL | Aide reference (NULL = unassigned) |
| date | DATE | NOT NULL | Assignment date |
| start_time | TIME | NOT NULL | Start time (HH:MM format) |
| end_time | TIME | NOT NULL | End time (HH:MM format) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'UNASSIGNED' | Assignment status enum |
| version | TIMESTAMP | NOT NULL, DEFAULT NOW | Optimistic locking version |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |
| updated_at | TIMESTAMP | DEFAULT NOW, ON UPDATE NOW | Last modification time |

**Status Enum**: `UNASSIGNED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETE`

**Relationships**:
- Many-to-One with `Task`
- Many-to-One with `TeacherAide` (nullable)

**Validation**:
- `date`: Required, valid date
- `start_time` / `end_time`: Must be in 30-minute increments
- `end_time` > `start_time`
- `status`: UNASSIGNED if aide_id is NULL, else ASSIGNED/IN_PROGRESS/COMPLETE

**Collision Detection**:
- Query for overlapping assignments:
  ```sql
  SELECT * FROM assignments
  WHERE aide_id = :aide_id
    AND date = :date
    AND status IN ('ASSIGNED', 'IN_PROGRESS')
    AND (
      (start_time < :new_end_time AND end_time > :new_start_time)
    )
  ```

**Indexes**:
- Primary key: `id`
- Composite index: `(aide_id, date, start_time)` for collision detection
- Index on `task_id` for task queries
- Index on `date` for weekly filtering

---

### 5. Absence

Represents a teacher aide being unavailable on a specific date.

**Table**: `absences`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| aide_id | INTEGER | NOT NULL, FK → teacher_aides(id) ON DELETE CASCADE | Teacher aide reference |
| date | DATE | NOT NULL | Absence date |
| reason | TEXT | | Optional reason for absence |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |

**Relationships**:
- Many-to-One with `TeacherAide`

**Validation**:
- `aide_id`: Required, valid aide reference
- `date`: Required, valid date
- `reason`: Optional, text field

**Constraints**:
- **UNIQUE (aide_id, date)** - prevent duplicate absences for same aide/date

**Cascade Behavior**:
On absence creation:
1. Find all assignments for aide on date
2. Set aide_id = NULL, status = UNASSIGNED
3. Return affected assignment IDs in response

On absence deletion:
1. Attempt to restore assignments if slots still available
2. Update status back to ASSIGNED if successful

**Indexes**:
- Primary key: `id`
- Composite unique index: `(aide_id, date)`
- Index on `date` for weekly filtering

---

### 6. Classroom

Represents a physical or virtual learning space.

**Table**: `classrooms`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Classroom name |
| capacity | INTEGER | | Student capacity |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |

**Relationships**:
- One-to-Many with `Task`

**Validation**:
- `name`: Required, unique, 1-100 characters
- `capacity`: Optional, positive integer if provided

**Indexes**:
- Primary key: `id`
- Unique index: `name`

---

### 7. Request

Represents a teacher's request for aide support.

**Table**: `requests`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| requesting_teacher | VARCHAR(100) | NOT NULL | Teacher name |
| task_title | VARCHAR(200) | NOT NULL | Requested task title |
| task_category | VARCHAR(20) | NOT NULL | Task category enum |
| preferred_date | DATE | NOT NULL | Preferred date |
| preferred_time | TIME | NOT NULL | Preferred start time |
| classroom_id | INTEGER | FK → classrooms(id) ON DELETE SET NULL | Optional classroom reference |
| notes | TEXT | | Additional notes |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | Request status enum |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |

**Status Enum**: `PENDING`, `APPROVED`, `REJECTED`

**Relationships**:
- Many-to-One with `Classroom` (optional)

**Validation**:
- `requesting_teacher`: Required, 1-100 characters
- `task_title`: Required, 1-200 characters
- `task_category`: Must match Task category enum
- `preferred_date`: Required, valid date
- `preferred_time`: Required, valid time in 30-minute increments

**Workflow**:
1. Teacher submits request (status = PENDING)
2. Admin reviews request
3. On APPROVED: Create Task → Create Assignment (UNASSIGNED)
4. On REJECTED: Update status only

**Indexes**:
- Primary key: `id`
- Index on `status` for filtering pending requests
- Index on `created_at` for chronological ordering

---

## State Transitions

### Assignment Status Flow

```
┌─────────────┐
│ UNASSIGNED  │ (aide_id = NULL)
└──────┬──────┘
       │ Drag-drop assign
       ↓
┌─────────────┐
│  ASSIGNED   │ (aide_id set)
└──────┬──────┘
       │ Aide clicks "Start"
       ↓
┌─────────────┐
│ IN_PROGRESS │
└──────┬──────┘
       │ Aide clicks "Complete"
       ↓
┌─────────────┐
│  COMPLETE   │
└─────────────┘
```

**Reverse Transitions**:
- Absence created → ASSIGNED/IN_PROGRESS → UNASSIGNED (aide_id = NULL)
- Admin unassigns → Any status → UNASSIGNED
- Undo action → Revert to previous status (if no conflict)

### Request Status Flow

```
┌─────────┐
│ PENDING │ (Teacher submits)
└────┬────┘
     │
     ├─→ APPROVED → Create Task + Assignment
     │
     └─→ REJECTED → No task created
```

---

## Cascade Behaviors

### ON DELETE CASCADE
- `teacher_aides.id` deleted → Delete all `assignments`, `absences`, `availability`
- `tasks.id` deleted → Delete all `assignments` (future occurrences only)
- `classrooms.id` deleted → Set `tasks.classroom_id` = NULL, `requests.classroom_id` = NULL

### ON DELETE SET NULL
- `teacher_aides.id` deleted → Set `assignments.aide_id` = NULL (preserve historical assignments)
- `classrooms.id` deleted → Set `tasks.classroom_id` = NULL, `requests.classroom_id` = NULL

---

## Database Constraints Summary

| Constraint | Table | Columns | Purpose |
|------------|-------|---------|---------|
| UNIQUE | absences | (aide_id, date) | Prevent duplicate absences |
| UNIQUE | availability | (aide_id, weekday, start_time) | Prevent duplicate availability |
| UNIQUE | classrooms | name | Unique classroom names |
| CHECK | tasks | end_time > start_time | Valid time range |
| CHECK | assignments | end_time > start_time | Valid time range |
| CHECK | availability | end_time > start_time | Valid time range |
| FK CASCADE | assignments | aide_id → teacher_aides(id) | Delete assignments with aide |
| FK CASCADE | absences | aide_id → teacher_aides(id) | Delete absences with aide |
| FK CASCADE | assignments | task_id → tasks(id) | Delete assignments with task |

---

## Indexing Strategy

### High-Traffic Queries

1. **Weekly Matrix Query** (most frequent):
   ```sql
   SELECT * FROM assignments
   WHERE date BETWEEN :start_date AND :end_date
   ORDER BY aide_id, date, start_time
   ```
   **Index**: `(aide_id, date, start_time)`

2. **Collision Detection** (on every drag-drop):
   ```sql
   SELECT * FROM assignments
   WHERE aide_id = :aide_id AND date = :date
     AND start_time < :end_time AND end_time > :start_time
   ```
   **Index**: `(aide_id, date, start_time)`

3. **Absence Impact** (on absence creation):
   ```sql
   SELECT * FROM assignments
   WHERE aide_id = :aide_id AND date = :date
   ```
   **Index**: `(aide_id, date)`

4. **Unassigned Tasks** (filter panel):
   ```sql
   SELECT * FROM assignments
   WHERE status = 'UNASSIGNED' AND date >= :today
   ORDER BY date, start_time
   ```
   **Index**: `(status, date, start_time)`

### Composite Indexes
- `assignments(aide_id, date, start_time)` - Covers collision + weekly queries
- `absences(aide_id, date)` - UNIQUE constraint also serves as index
- `availability(aide_id, weekday)` - Weekly availability checks

---

## Migration Strategy

### Initial Schema (Alembic Migration 001)
1. Create all tables with columns and constraints
2. Add indexes
3. Add foreign key relationships
4. Seed with initial data (optional)

### Future Migrations
- Add `version` column to `assignments` for optimistic locking
- Add `updated_at` triggers for automatic timestamp updates
- Add indexes based on production query patterns

---

## Data Integrity Rules

### Application-Level Validation
1. **Time Slot Validation**: All times must be 30-minute increments (00, 30)
2. **Date Range**: Tasks/assignments within current school year
3. **RRULE Validation**: Parse RRULE before saving, reject invalid patterns
4. **Collision Prevention**: Check overlaps before commit
5. **Version Checking**: Compare client version with DB version on update

### Database-Level Enforcement
1. **Unique Constraints**: Prevent duplicate absences, availability
2. **Foreign Keys**: Maintain referential integrity with CASCADE/SET NULL
3. **Check Constraints**: Enforce time logic (end > start)
4. **NOT NULL**: Required fields enforced at DB level

---

## Sample Data for Testing

```python
# Teacher Aides
aide1 = TeacherAide(name="John Smith", qualifications="Special Education", colour_hex="#FF5733")
aide2 = TeacherAide(name="Mary Johnson", qualifications="Reading Specialist", colour_hex="#33C1FF")

# Classrooms
classroom1 = Classroom(name="Room 101", capacity=25)
classroom2 = Classroom(name="Library", capacity=50)

# Tasks
task1 = Task(
    title="Morning Playground Duty",
    category="PLAYGROUND",
    start_time="10:30",
    end_time="11:00",
    recurrence_rule="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    expires_on="2025-12-31"
)

task2 = Task(
    title="Grade 3A Reading Support",
    category="CLASS_SUPPORT",
    start_time="09:00",
    end_time="10:00",
    classroom_id=classroom1.id
)

# Assignments (generated from tasks)
assignment1 = Assignment(
    task_id=task1.id,
    aide_id=aide1.id,
    date="2025-10-06",  # Monday
    start_time="10:30",
    end_time="11:00",
    status="ASSIGNED"
)
```

---

This data model supports all feature requirements:
- ✅ FR-001 to FR-005: Task management with recurrence
- ✅ FR-013 to FR-019: Drag-drop assignment via aide_id updates
- ✅ FR-020 to FR-025: Collision detection via time overlap queries
- ✅ FR-026 to FR-031: Absence management with cascade unassignment
- ✅ FR-047 to FR-048d: Optimistic locking with version timestamps



