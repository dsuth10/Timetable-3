# Backend Tests

Comprehensive test suite for CHARLOTTE backend API.

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures (app, client, db_session, sample data)
├── contract/                # API contract tests (T010-T020)
│   ├── test_aides_get.py           # GET /api/aides
│   ├── test_aides_post.py          # POST /api/aides
│   ├── test_availability.py        # POST /api/aides/{id}/availability
│   ├── test_tasks_get.py           # GET /api/tasks
│   ├── test_recurring_tasks.py     # POST /api/recurring-tasks
│   ├── test_weekly_matrix.py       # GET /api/assignments/weekly-matrix
│   ├── test_assignments_post.py    # POST /api/assignments
│   ├── test_batch_assign.py        # POST /api/assignments/batch
│   ├── test_assignments_update.py  # PUT /api/assignments/{id}
│   ├── test_absences_post.py       # POST /api/absences
│   └── test_absences_delete.py     # DELETE /api/absences/{id}
└── integration/             # Integration tests (T021-T025)
    ├── test_drag_drop_flow.py      # Complete drag-and-drop workflows
    ├── test_conflict_detection.py  # Time overlap collision detection
    ├── test_partial_overlap.py     # Auto-shorten on partial overlaps
    ├── test_absence_cascade.py     # Absence creation releases assignments
    └── test_recurring_multiday.py  # Multi-day recurring task assignment
```

## Running Tests

### All Tests
```bash
cd backend
pytest
```

### With Coverage
```bash
pytest --cov=api --cov-report=html
```

### Specific Test File
```bash
pytest tests/contract/test_aides_get.py
pytest tests/integration/test_drag_drop_flow.py
```

### Specific Test Function
```bash
pytest tests/contract/test_aides_get.py::test_get_aides_empty
```

### Verbose Output
```bash
pytest -v
```

### Stop on First Failure
```bash
pytest -x
```

## Test Coverage Goals

- **Contract Tests**: Validate API compliance with OpenAPI spec
  - Request/response formats
  - Status codes (200, 201, 400, 404, 409)
  - Input validation
  - Error handling

- **Integration Tests**: Validate business workflows
  - Drag-and-drop assignment flow
  - Conflict detection and resolution
  - Partial overlap auto-shortening
  - Absence cascade (automatic assignment release)
  - Recurring task multi-day selection

## Fixtures (conftest.py)

### Core Fixtures
- `app` - Flask application instance (session-scoped)
- `client` - Test client for making API requests
- `db_session` - Database session with transaction rollback

### Sample Data Fixtures
- `sample_aide` - TeacherAide (John Smith)
- `sample_classroom` - Classroom (Room 101)
- `sample_task` - Task (Reading Support)
- `sample_assignment` - Assignment (linked to aide and task)
- `sample_availability` - Availability (Monday 08:00-16:00)

## Expected Behavior (TDD)

⚠️ **These tests will FAIL initially** - this is expected!

Tests are written BEFORE implementation (Test-Driven Development). They define:
1. Expected API contracts
2. Required business logic
3. Error handling requirements
4. Data validation rules

Implementation (T030-T053) will make these tests pass.

## Test Principles

### Contract Tests
- Test ONE endpoint per file
- Cover happy path + edge cases
- Validate request/response schemas
- Test error conditions (400, 404, 409)

### Integration Tests
- Test complete user workflows
- Follow scenarios from `quickstart.md`
- Use realistic data
- Validate end-to-end behavior

## Next Steps

1. **Run tests** → They should all fail (models/routes don't exist yet)
2. **Implement models** (T030-T036)
3. **Implement services** (T037-T041)
4. **Implement API routes** (T042-T051)
5. **Run tests again** → They should pass ✅

## Constitution Compliance

These tests ensure compliance with:
- ✅ REST API Contract (Core Principle II)
- ✅ Comprehensive Testing (Core Principle III)
- ✅ Data Integrity & Conflict Prevention (Core Principle VI)
- ✅ Drag-and-Drop First Interface (Core Principle IV)



