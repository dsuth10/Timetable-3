import pytest
from api.services.import_validator import ImportValidator
from api.models.validation import ValidationStage

@pytest.fixture
def validator():
    return ImportValidator()

def test_validate_relationships_valid(validator):
    """Test referential integrity with valid references."""
    data = {
        'teacher_aides': [{'id': 1, 'name': 'Aide 1'}],
        'tasks': [{'id': 1, 'title': 'Task 1'}],
        'assignments': [{'id': 1, 'task_id': 1, 'aide_id': 1}]
    }
    result = validator.validate_relationships(data)
    assert result.is_valid is True
    assert result.stage == ValidationStage.RELATIONSHIPS

def test_validate_relationships_broken_fk(validator):
    """Test referential integrity with broken foreign key."""
    data = {
        'teacher_aides': [{'id': 1, 'name': 'Aide 1'}],
        'tasks': [{'id': 1, 'title': 'Task 1'}],
        'assignments': [{'id': 1, 'task_id': 99, 'aide_id': 1}] # Task 99 doesn't exist
    }
    result = validator.validate_relationships(data)
    assert result.is_valid is False
    assert "task_id" in result.errors[0]

def test_validate_relationships_orphan_absence(validator):
    """Test referential integrity with orphan absence."""
    data = {
        'teacher_aides': [{'id': 1, 'name': 'Aide 1'}],
        'absences': [{'id': 1, 'aide_id': 99, 'date': '2026-01-26'}] # Aide 99 doesn't exist
    }
    result = validator.validate_relationships(data)
    assert result.is_valid is False
    assert "aide_id" in result.errors[0]
