# Data Model: CHARLOTTE Timetable Scheduler

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
     │          │
     │          └── (∞) RecurringSeries
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
| details | TEXT | | Staff details or notes |
| colour_hex | VARCHAR(7) | NOT NULL | Visual identifier (e.g., "#FF5733") |
| created_at | TIMESTAMP | DEFAULT UTC_NOW | Record creation time |
| updated_at | TIMESTAMP | DEFAULT UTC_NOW, ON UPDATE UTC_NOW | Last modification time |

**Relationships**:
- One-to-Many with `Availability` (weekly schedule)
- One-to-Many with `Assignment` (assigned tasks)
- One-to-Many with `Absence` (absence records)
- One-to-Many with `RecurringSeries` (recurring assignment patterns)

**Validation**:
- `name`: Required, 1-100 characters
- `colour_hex`: Valid hex color format (#RRGGBB)

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
| start_time | TIME | NOT NULL | Start time (HH:MM:SS format) |
| end_time | TIME | NOT NULL | End time (HH:MM:SS format) |

**Relationships**:
- Many-to-One with `TeacherAide`

**Validation**:
- `weekday`: Must be one of [MO, TU, WE, TH, FR]
- `start_time` / `end_time`: Must be in **5-minute increments** (e.g., 08:50, 09:05)
- `end_time` > `start_time`

**Constraints**:
- UNIQUE (aide_id, weekday, start_time) - prevent duplicate availability slots

**Indexes**:
- Primary key: `id`
- Composite index: `(aide_id, weekday)` for weekly queries

---

### 3. Task

Represents a support duty template (tasks can have multiple recurring series).

**Table**: `tasks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| title | VARCHAR(200) | NOT NULL | Task title |
| category | VARCHAR(20) | NOT NULL | Task category enum |
| start_time | TIME | NOT NULL | Start time (HH:MM:SS format) |
| end_time | TIME | NOT NULL | End time (HH:MM:SS format) |
| classroom_id | INTEGER | FK → classrooms(id) ON DELETE SET NULL | Optional classroom reference |
| notes | TEXT | | Additional notes |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'UNASSIGNED' | Task status enum |
| created_at | TIMESTAMP | DEFAULT UTC_NOW | Record creation time |
| updated_at | TIMESTAMP | DEFAULT UTC_NOW, ON UPDATE UTC_NOW | Last modification time |

**Category Enum**: `PLAYGROUND`, `CLASS_SUPPORT`, `GROUP_SUPPORT`, `INDIVIDUAL_SUPPORT`

**Status Enum**: `UNASSIGNED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETE`

**Relationships**:
- Many-to-One with `Classroom` (optional)
- One-to-Many with `Assignment` (task occurrences)
- One-to-Many with `RecurringSeries`

**Validation**:
- `title`: Required, 1-200 characters
- `category`: Must be one of defined categories
- `start_time` / `end_time`: Must be in **5-minute increments**
- `end_time` > `start_time`

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
| original_aide_id | INTEGER | FK → teacher_aides(id) ON DELETE SET NULL | Preserved aide ID for Relief Pool restoration |
| recurring_series_id | INTEGER | FK → recurring_series(id) ON DELETE CASCADE | Reference to recurring series |
| date | DATE | NOT NULL | Assignment date |
| start_time | TIME | NOT NULL | Start time (HH:MM:SS format) |
| end_time | TIME | NOT NULL | End time (HH:MM:SS format) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'UNASSIGNED' | Assignment status enum |
| version | INTEGER | NOT NULL, DEFAULT 1 | Optimistic locking version |
| created_at | TIMESTAMP | DEFAULT UTC_NOW | Record creation time |
| updated_at | TIMESTAMP | DEFAULT UTC_NOW, ON UPDATE UTC_NOW | Last modification time |

**Status Enum**: `UNASSIGNED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETE`, `RELIEF_POOL`

**Relationships**:
- Many-to-One with `Task`
- Many-to-One with `TeacherAide` (nullable)
- Many-to-One with `TeacherAide` (original_aide, nullable)
- Many-to-One with `RecurringSeries` (nullable)

**Validation**:
- `date`: Required, valid date
- `start_time` / `end_time`: Must be in **5-minute increments**
- `end_time` > `start_time`
- `status`: UNASSIGNED if aide_id is NULL (unless RELIEF_POOL), else ASSIGNED/IN_PROGRESS/COMPLETE

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
- Index on `original_aide_id` for relief restoration
- Index on `status, date, start_time` for unassigned/relief queries

---

### 5. RecurringSeries

Represents an independent recurring assignment series for a specific task/aide combination.

**Table**: `recurring_series`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| task_id | INTEGER | NOT NULL, FK → tasks(id) ON DELETE CASCADE | Task template reference |
| aide_id | INTEGER | FK → teacher_aides(id) ON DELETE SET NULL | Aide reference |
| recurrence_rule | TEXT | NOT NULL | iCal RRULE string |
| expires_on | DATE | NOT NULL | Expiration date |
| start_time | TIME | NOT NULL | Start time |
| end_time | TIME | NOT NULL | End time |
| base_date | DATE | NOT NULL | Original date made recurring |
| created_at | TIMESTAMP | DEFAULT UTC_NOW | Record creation time |
| updated_at | TIMESTAMP | DEFAULT UTC_NOW, ON UPDATE UTC_NOW | Last modification time |

**Relationships**:
- Many-to-One with `Task`
- Many-to-One with `TeacherAide`
- One-to-Many with `Assignment`

---

### 6. Absence

Represents a teacher aide being unavailable on a specific date.

**Table**: `absences`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| aide_id | INTEGER | NOT NULL, FK → teacher_aides(id) ON DELETE CASCADE | Teacher aide reference |
| date | DATE | NOT NULL | Absence date |
| reason | TEXT | | Optional reason for absence |
| created_at | TIMESTAMP | DEFAULT UTC_NOW | Record creation time |

**Relationships**:
- Many-to-One with `TeacherAide`

**Validation**:
- `aide_id`: Required, valid aide reference
- `date`: Required, valid date

**Constraints**:
- **UNIQUE (aide_id, date)** - prevent duplicate absences for same aide/date

**Cascade Behavior**:
On absence creation:
1. Find all `ASSIGNED` and `IN_PROGRESS` assignments for aide on date
2. Set `original_aide_id = aide_id`
3. Set `aide_id = NULL`
4. Set `status = 'RELIEF_POOL'`

On absence deletion:
1. Find all `RELIEF_POOL` assignments where `original_aide_id` matches aide
2. Attempt to restore assignments (set `aide_id = original_aide_id`, `status = 'ASSIGNED'`) if slots still available
3. If collision exists, assignment remains in `RELIEF_POOL`

**Indexes**:
- Primary key: `id`
- Composite unique index: `(aide_id, date)`
- Index on `date` for weekly filtering

---

### 7. Classroom

Represents a physical learning space with assigned teacher and room details.

**Table**: `classrooms`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Classroom name (e.g., "3A") |
| room_number | VARCHAR(20) | NOT NULL | Physical room number |
| teacher | VARCHAR(100) | NOT NULL | Primary teacher name |
| year_level | VARCHAR(50) | | e.g., "Prep", "1", "2" |
| is_composite | BOOLEAN | DEFAULT FALSE | If classroom has multiple year levels |
| composite_year_levels | VARCHAR(50) | | Comma-separated list of year levels |
| colour_hex | VARCHAR(7) | NOT NULL | Visual identifier |
| capacity | INTEGER | | Student capacity (optional) |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMP | DEFAULT UTC_NOW | Record creation time |

**Relationships**:
- One-to-Many with `Task`
- One-to-Many with `Request`

**Validation**:
- `name`, `room_number`, `teacher`: Required
- `colour_hex`: Valid hex format

**Indexes**:
- Primary key: `id`
- Unique index: `name`

---

### 8. Request

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
| created_at | TIMESTAMP | DEFAULT UTC_NOW | Record creation time |

**Status Enum**: `PENDING`, `APPROVED`, `REJECTED`

**Relationships**:
- Many-to-One with `Classroom` (optional)

**Validation**:
- `requesting_teacher`, `task_title`, `task_category`: Required
- `preferred_time`: Required, valid time in **5-minute increments**

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

**Relief Pool Transition**:
- Absence created → `ASSIGNED`/`IN_PROGRESS` → `RELIEF_POOL` (`aide_id = NULL`, `original_aide_id` preserved)
- Relief assignment → `RELIEF_POOL` → `ASSIGNED` (new `aide_id` set, `original_aide_id` cleared)

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
| FK CASCADE | assignments | task_id → tasks(id) | Delete assignments with task |
| FK CASCADE | assignments | recurring_series_id → recurring_series(id) | Delete instances with series |

---

## Data Integrity Rules

### Application-Level Validation
1. **Time Slot Validation**: All times must be in **5-minute increments** (e.g., 08:55, 09:00).
2. **Relief Pool Restriction**: Relief Pool tasks can only be reassigned to the original absence date.
3. **RRULE Validation**: Parse RRULE before saving to `RecurringSeries`.
4. **Collision Prevention**: Check overlaps for `ASSIGNED`/`IN_PROGRESS` status before commit.
5. **Optimistic Locking**: Compare `version` Integer on update to prevent concurrent overwrites.

### Database-Level Enforcement
1. **Unique Constraints**: Prevent duplicate absences, availability.
2. **Foreign Keys**: Maintain referential integrity with CASCADE/SET NULL.
3. **Check Constraints**: Enforce time logic (end > start).
4. **NOT NULL**: Required fields enforced at DB level.

---

This data model supports all feature requirements:
- ✅ **5-Minute Increments**: Full support for school bell times across all entities.
- ✅ **Relief Pool**: Robust tracking of orphaned tasks during aide absences.
- ✅ **Recurring Series**: Flexible management of recurring assignment patterns.
- ✅ **Optimistic Locking**: Integer-based versioning for reliable concurrent edits.
- ✅ **Classroom Management**: Enhanced details for rooms and teachers.
