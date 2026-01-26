import pytest
from api.services.import_validator import ImportValidator
from api.models.validation import ValidationStage

@pytest.fixture
def validator():
    return ImportValidator()

def test_validate_types_valid(validator):
    """Test data type validation with valid data."""
    data = {
        'teacher_aides': [
            {'id': 1, 'name': 'John Doe', 'colour_hex': '#FF0000'}
        ],
        'tasks': [
            {'id': 1, 'title': 'Task 1', 'category': 'PLAYGROUND', 
             'start_time': '09:00:00', 'end_time': '10:00:00'}
        ]
    }
    result = validator.validate_data_types(data)
    assert result.is_valid is True
    assert result.stage == ValidationStage.DATA_TYPES

def test_validate_types_invalid_enum(validator):
    """Test data type validation with invalid enum value."""
    data = {
        'tasks': [
            {'id': 1, 'title': 'Task 1', 'category': 'INVALID_CATEGORY', 
             'start_time': '09:00:00', 'end_time': '10:00:00'}
        ]
    }
    result = validator.validate_data_types(data)
    assert result.is_valid is False
    assert "category" in result.errors[0]

def test_validate_types_malformed_date(validator):
    """Test data type validation with malformed date."""
    data = {
        'assignments': [
            {'id': 1, 'task_id': 1, 'date': 'invalid-date', 
             'start_time': '09:00:00', 'end_time': '10:00:00'}
        ]
    }
    result = validator.validate_data_types(data)
    assert result.is_valid is False
    assert "date" in result.errors[0]
