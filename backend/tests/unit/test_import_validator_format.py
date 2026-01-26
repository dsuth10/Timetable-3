import pytest
import os
import tempfile
from api.services.import_validator import ImportValidator
from api.models.validation import ValidationStage

@pytest.fixture
def validator():
    return ImportValidator()

def test_validate_format_sql(validator):
    """Test SQL format validation."""
    with tempfile.NamedTemporaryFile(suffix='.sql', delete=False, mode='w') as tmp:
        tmp.write("-- SQL Dump\nCREATE TABLE test (id INT);")
        tmp_path = tmp.name
    
    try:
        result = validator.validate_format(tmp_path, 'sql')
        assert result.is_valid is True
        assert result.stage == ValidationStage.FORMAT
    finally:
        os.unlink(tmp_path)

def test_validate_format_invalid_extension(validator):
    """Test invalid file extension."""
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False, mode='w') as tmp:
        tmp.write("some data")
        tmp_path = tmp.name
    
    try:
        result = validator.validate_format(tmp_path, 'sql')
        assert result.is_valid is False
        assert "extension" in result.errors[0].lower()
    finally:
        os.unlink(tmp_path)

def test_validate_format_corrupted_json(validator):
    """Test corrupted JSON file."""
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False, mode='w') as tmp:
        tmp.write("{ invalid json")
        tmp_path = tmp.name
    
    try:
        result = validator.validate_format(tmp_path, 'json')
        assert result.is_valid is False
        assert "json" in result.errors[0].lower()
    finally:
        os.unlink(tmp_path)
