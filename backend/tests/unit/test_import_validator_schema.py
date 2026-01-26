import pytest
from api.services.import_validator import ImportValidator
from api.models.validation import ValidationStage

@pytest.fixture
def validator():
    return ImportValidator()

def test_validate_schema_complete(validator):
    """Test schema validation with all required tables."""
    data = {
        'teacher_aides': [],
        'tasks': [],
        'assignments': [],
        'classrooms': [],
        'absences': [],
        'availability': [],
        'requests': [],
        'recurring_series': [],
        'metadata': {'schema_version': '123'}
    }
    result = validator.validate_schema(data)
    assert result.is_valid is True
    assert result.stage == ValidationStage.SCHEMA

def test_validate_schema_missing_table(validator):
    """Test schema validation with missing table."""
    data = {
        'teacher_aides': [],
        # 'tasks' is missing
        'assignments': []
    }
    result = validator.validate_schema(data)
    assert result.is_valid is False
    assert "tasks" in result.errors[0]

def test_validate_schema_version_mismatch(validator):
    """Test schema validation with version mismatch (should be a warning)."""
    data = {
        'teacher_aides': [],
        'tasks': [],
        'assignments': [],
        'classrooms': [],
        'absences': [],
        'availability': [],
        'requests': [],
        'recurring_series': [],
        'metadata': {'schema_version': 'old_version'}
    }
    # Assuming validator knows current version
    result = validator.validate_schema(data)
    assert result.is_valid is True
    assert any("version" in w.lower() for w in result.warnings)
