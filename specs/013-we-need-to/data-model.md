# Data Model: Import System

**Feature**: Robust Export and Import System  
**Date**: 2026-01-24  
**Status**: Design Complete

## Overview

The import system extends the existing backup system without introducing new database entities. All data entities already exist in the application schema. This document describes the data structures used during the import process and validation.

---

## Existing Database Entities (No Changes Required)

The import system operates on these 8 existing tables. No schema changes are needed.

### TeacherAide
**Table**: `teacher_aides`  
**Purpose**: Staff members who can be assigned to tasks

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Full name |
| colour_hex | VARCHAR(7) | NOT NULL | Format: #RRGGBB |
| details | TEXT | NULL | Additional information |

### Task
**Table**: `tasks`  
**Purpose**: Reusable task templates

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| title | VARCHAR(200) | NOT NULL | Task name |
| category | ENUM | NOT NULL | PLAYGROUND, CLASS_SUPPORT, GROUP_SUPPORT, INDIVIDUAL_SUPPORT |
| start_time | TIME | NOT NULL | Template start time (5-min increments) |
| end_time | TIME | NOT NULL | Template end time (5-min increments) |
| classroom_id | INTEGER | NULL, FK → classrooms.id | Optional classroom assignment |
| notes | TEXT | NULL | Additional details |
| status | ENUM | DEFAULT 'UNASSIGNED' | Task status |

### Assignment
**Table**: `assignments`  
**Purpose**: Specific task occurrences scheduled for dates

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| task_id | INTEGER | NOT NULL, FK → tasks.id | Parent task |
| aide_id | INTEGER | NULL, FK → teacher_aides.id | Assigned aide (NULL = unassigned) |
| date | DATE | NOT NULL | Assignment date (YYYY-MM-DD) |
| start_time | TIME | NOT NULL | Actual start (30-min increments) |
| end_time | TIME | NOT NULL | Actual end (30-min increments) |
| status | ENUM | NOT NULL | UNASSIGNED, ASSIGNED, IN_PROGRESS, COMPLETE, RELIEF_POOL |
| version | INTEGER | DEFAULT 1 | Optimistic locking version |
| original_aide_id | INTEGER | NULL, FK → teacher_aides.id | Original aide before absence |
| recurring_series_id | INTEGER | NULL, FK → recurring_series.id | Parent series if recurring |

### Classroom
**Table**: `classrooms`  
**Purpose**: Physical learning spaces

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Classroom identifier |
| teacher | VARCHAR(100) | NULL | Teacher name |
| room_number | VARCHAR(50) | NULL | Room identifier |

### Absence
**Table**: `absences`  
**Purpose**: Record when aides are unavailable

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| aide_id | INTEGER | NOT NULL, FK → teacher_aides.id | Absent aide |
| date | DATE | NOT NULL | Absence date (YYYY-MM-DD) |
| reason | TEXT | NULL | Optional reason |
| **UNIQUE** | (aide_id, date) | | One absence per aide per date |

**Trigger**: On INSERT, automatically updates assignments:
- Sets `aide_id = NULL`
- Sets `status = 'RELIEF_POOL'`
- Stores original aide in `original_aide_id`

### Availability
**Table**: `availability`  
**Purpose**: Weekly availability patterns for aides

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| aide_id | INTEGER | NOT NULL, FK → teacher_aides.id | Associated aide |
| day_of_week | INTEGER | NOT NULL | 0=Monday, 6=Sunday |
| start_time | TIME | NOT NULL | Availability start |
| end_time | TIME | NOT NULL | Availability end |
| is_available | BOOLEAN | DEFAULT TRUE | Availability flag |

### Request
**Table**: `requests`  
**Purpose**: Teacher requests for aide support

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| classroom_id | INTEGER | NOT NULL, FK → classrooms.id | Requesting classroom |
| date | DATE | NOT NULL | Requested date |
| start_time | TIME | NOT NULL | Requested start |
| end_time | TIME | NOT NULL | Requested end |
| description | TEXT | NOT NULL | Request details |
| status | ENUM | DEFAULT 'PENDING' | PENDING, APPROVED, REJECTED |
| created_at | TIMESTAMP | DEFAULT NOW | Creation timestamp |

### RecurringSeries
**Table**: `recurring_series`  
**Purpose**: Metadata for recurring task patterns

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| aide_id | INTEGER | NOT NULL, FK → teacher_aides.id | Assigned aide |
| task_id | INTEGER | NOT NULL, FK → tasks.id | Template task |
| rrule | TEXT | NOT NULL | iCal RRULE string |
| start_date | DATE | NOT NULL | Series start date |
| end_date | DATE | NULL | Series end date (NULL = indefinite) |
| generated_until | DATE | NULL | Last generated assignment date |

---

## Import-Specific Data Structures

These are runtime structures used during import validation and processing. They are not persisted to the database.

### ImportJob (In-Memory)

**Purpose**: Track progress and state of import operation

```python
@dataclass
class ImportJob:
    """Runtime import job tracking."""
    import_id: str              # UUID for this import
    status: ImportStatus        # Current status
    progress_percent: int       # 0-100
    current_step: str           # Human-readable step description
    format_type: BackupFormat   # sql/json/csv/sqlite_gz
    file_size_bytes: int        # Original file size
    started_at: datetime        # Import start time
    completed_at: datetime | None  # Import completion time
    error: str | None           # Error message if failed
    warnings: List[str]         # Non-fatal warnings (e.g., version mismatch)
    records_imported: Dict[str, int]  # Table name → row count
```

**Status Enum**:
```python
class ImportStatus(Enum):
    VALIDATING = "validating"    # Stage 1-4 validation
    IMPORTING = "importing"      # Database restore in progress
    VERIFYING = "verifying"      # Post-import checks
    COMPLETED = "completed"      # Success
    FAILED = "failed"            # Failed with rollback
    CANCELLED = "cancelled"      # User cancelled
```

**Storage**: Module-level dict `_import_progress: Dict[str, ImportJob]`

### BackupMetadata

**Purpose**: Metadata extracted from backup file for validation

```python
@dataclass
class BackupMetadata:
    """Metadata extracted from backup file."""
    format_type: BackupFormat          # Detected format
    schema_version: str                # Alembic version
    created_at: datetime               # Backup creation time
    tables_present: List[str]          # Tables found in backup
    total_records: int                 # Total row count across all tables
    file_size_bytes: int               # Backup file size
    application_version: str | None    # App version (if available)
```

### ValidationResult

**Purpose**: Result of each validation stage

```python
@dataclass
class ValidationResult:
    """Result of a validation stage."""
    stage: ValidationStage    # Which stage was validated
    is_valid: bool            # Pass/fail
    errors: List[str]         # Validation errors (if invalid)
    warnings: List[str]       # Non-fatal warnings
    details: Dict[str, Any]   # Additional validation details
```

**Validation Stage Enum**:
```python
class ValidationStage(Enum):
    FORMAT = "format"              # File format check
    SCHEMA = "schema"              # Schema structure check
    DATA_TYPES = "data_types"      # Data type validation
    RELATIONSHIPS = "relationships" # Foreign key validation
```

### ForeignKeyMap

**Purpose**: Track foreign key relationships during validation

```python
@dataclass
class ForeignKeyMap:
    """Map of foreign keys found during validation."""
    table_name: str                    # Target table
    referenced_table: str              # Referenced table
    foreign_keys: Dict[int, int]       # local_id → referenced_id
    missing_references: List[int]      # IDs that don't exist in referenced table
    
    def validate(self) -> bool:
        """Check if all foreign keys have valid references."""
        return len(self.missing_references) == 0
```

---

## Data Validation Rules

### Stage 1: Format Validation

**File Extension**:
- `.sql` → SQL dump
- `.json` → JSON export
- `.zip` → CSV collection
- `.db.gz` → Compressed SQLite

**Magic Bytes**:
- SQL: Starts with `--` or `BEGIN TRANSACTION`
- JSON: Starts with `{`
- ZIP: Magic bytes `50 4B 03 04`
- GZIP: Magic bytes `1F 8B`

### Stage 2: Schema Validation

**Required Tables** (all must be present):
- teacher_aides
- tasks
- assignments
- classrooms
- absences
- availability
- requests
- recurring_series

**Column Validation**:
- Each table must have all required columns
- Column names must match exactly (case-sensitive)
- No extra columns that don't exist in schema

**Schema Version**:
- Extract from `alembic_version` table or JSON metadata
- Compare to current version
- Warn if mismatch (but allow import)

### Stage 3: Data Type Validation

**Type Checks**:
- Integers: Must parse as valid integers
- Strings: Must not exceed column length limits
- Dates: Must match YYYY-MM-DD format
- Times: Must match HH:MM:SS format
- Enums: Must be one of valid values

**Enum Values**:

**Task Category**: `PLAYGROUND`, `CLASS_SUPPORT`, `GROUP_SUPPORT`, `INDIVIDUAL_SUPPORT`  
**Task Status**: `UNASSIGNED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETE`  
**Assignment Status**: `UNASSIGNED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETE`, `RELIEF_POOL`  
**Request Status**: `PENDING`, `APPROVED`, `REJECTED`

**Required Field Checks**:
- NOT NULL columns must have values
- Empty strings converted to NULL for nullable fields

### Stage 4: Referential Integrity Validation

**Foreign Key Checks**:

| Table | Foreign Key | References |
|-------|-------------|------------|
| tasks | classroom_id | classrooms.id |
| assignments | task_id | tasks.id |
| assignments | aide_id | teacher_aides.id |
| assignments | original_aide_id | teacher_aides.id |
| assignments | recurring_series_id | recurring_series.id |
| absences | aide_id | teacher_aides.id |
| availability | aide_id | teacher_aides.id |
| requests | classroom_id | classrooms.id |
| recurring_series | aide_id | teacher_aides.id |
| recurring_series | task_id | tasks.id |

**Validation Process**:
1. Build ID sets for each primary table (teacher_aides, tasks, classrooms, recurring_series)
2. For each foreign key, verify referenced ID exists in ID set
3. Collect all missing references per table
4. If any missing references found, fail validation

**Unique Constraint Checks**:
- teacher_aides.name must be unique
- classrooms.name must be unique
- absences (aide_id, date) must be unique

---

## Data Import Order

**Dependency Order** (must import in this sequence):

1. **teacher_aides** (no dependencies)
2. **classrooms** (no dependencies)
3. **tasks** (depends on classrooms)
4. **recurring_series** (depends on teacher_aides, tasks)
5. **assignments** (depends on tasks, teacher_aides, recurring_series)
6. **absences** (depends on teacher_aides)
7. **availability** (depends on teacher_aides)
8. **requests** (depends on classrooms)

**Import Method**: Use SQLAlchemy's `session.bulk_insert_mappings()` for efficient batch inserts while preserving ID values.

---

## Error Codes and Messages

### Validation Errors

| Code | Message | Recovery |
|------|---------|----------|
| E001 | Invalid file format | Check file extension and contents |
| E002 | File exceeds 100MB limit | Use smaller backup or split data |
| E003 | Database not empty | Import only allowed on fresh installation |
| E004 | Missing required table: {table} | Ensure backup is complete |
| E005 | Schema version mismatch | Proceed with caution or update app |
| E006 | Invalid data type in {table}.{column} | Fix data in backup file |
| E007 | Foreign key violation: {table}.{column} → {ref_table} | Ensure all referenced records exist |
| E008 | Duplicate key: {table}.{column} | Remove duplicates from backup |
| E009 | Invalid enum value: {value} not in {valid_values} | Use valid enum values |

### Import Errors

| Code | Message | Recovery |
|------|---------|----------|
| I001 | Database rollback failed | Manual recovery required |
| I002 | Disk space insufficient | Free up disk space |
| I003 | Database locked | Retry import later |
| I004 | Import timeout exceeded | Use smaller backup or increase timeout |
| I005 | Unexpected error during import | Check logs, report bug |

---

## State Transitions

### Import Job Lifecycle

```
START
  ↓
VALIDATING (Stage 1: Format) ──→ FAILED (invalid format)
  ↓
VALIDATING (Stage 2: Schema) ──→ FAILED (schema issues)
  ↓
VALIDATING (Stage 3: Data Types) ──→ FAILED (type errors)
  ↓
VALIDATING (Stage 4: Relationships) ──→ FAILED (FK violations)
  ↓
IMPORTING (Table 1-8) ──→ FAILED (rollback triggered)
  ↓                          ↓
VERIFYING ──→ FAILED      (all changes rolled back)
  ↓           ↓
COMPLETED   FAILED
```

### Database State During Import

```
INITIAL STATE (Empty database)
  ↓
START TRANSACTION (SAVEPOINT created)
  ↓
IMPORTING DATA (multiple inserts)
  ↓
SUCCESS? ──No──→ ROLLBACK TO SAVEPOINT → INITIAL STATE
  ↓ Yes
COMMIT TRANSACTION
  ↓
FINAL STATE (Restored from backup)
```

---

## Performance Characteristics

### Import Speed by Format

| Format | Speed (10k records) | Memory Usage | Notes |
|--------|---------------------|--------------|-------|
| SQL | 5-10 seconds | ~50MB | Fastest, native SQLite |
| JSON | 10-20 seconds | ~100MB | Bulk inserts via SQLAlchemy |
| CSV | 15-30 seconds | ~150MB | Parse + transform overhead |
| SQLite | 5-10 seconds | ~50MB | Decompress + copy |

### Validation Speed

| Stage | Time (100MB file) | Memory Usage |
|-------|-------------------|--------------|
| Format | <1 second | ~10MB |
| Schema | 1-2 seconds | ~100MB |
| Data Types | 2-5 seconds | ~150MB |
| Relationships | 5-10 seconds | ~200MB |

### Scalability Limits

| Metric | Limit | Rationale |
|--------|-------|-----------|
| File Size | 100MB | Memory constraints, user experience |
| Total Records | 100k | ~10k per table, reasonable for single school |
| Import Time | 5 minutes | User patience threshold |
| Validation Time | 2 minutes | Fast failure for user feedback |

---

## Testing Data

### Minimal Valid Backup

**teacher_aides**: 1 record (John Doe)  
**classrooms**: 1 record (Class 1A)  
**tasks**: 1 record (Playground Duty)  
**assignments**: 1 record (John → Playground on 2026-01-24)  
**absences**: 0 records  
**availability**: 1 record (John available Mon 9-3)  
**requests**: 0 records  
**recurring_series**: 0 records

**Total**: 4 non-empty tables, 5 total records

### Comprehensive Test Backup

**teacher_aides**: 10 records  
**classrooms**: 5 records  
**tasks**: 50 records (various categories)  
**assignments**: 500 records (1 month of data)  
**absences**: 20 records  
**availability**: 50 records (10 aides × 5 days)  
**requests**: 10 records  
**recurring_series**: 5 records

**Total**: 650 records with full relationship coverage

---

**Status**: Data model complete, ready for contract generation
