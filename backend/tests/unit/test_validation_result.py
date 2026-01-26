import pytest
from api.models.validation import ValidationResult, ValidationStage

def test_validation_stage_enum():
    """Test ValidationStage enum values."""
    assert ValidationStage.FORMAT.value == "format"
    assert ValidationStage.SCHEMA.value == "schema"
    assert ValidationStage.DATA_TYPES.value == "data_types"
    assert ValidationStage.RELATIONSHIPS.value == "relationships"

def test_validation_result_initialization():
    """Test ValidationResult dataclass initialization."""
    result = ValidationResult(
        stage=ValidationStage.FORMAT,
        is_valid=True,
        errors=[],
        warnings=["Some warning"],
        details={"key": "value"}
    )
    assert result.stage == ValidationStage.FORMAT
    assert result.is_valid is True
    assert result.errors == []
    assert result.warnings == ["Some warning"]
    assert result.details == {"key": "value"}

def test_validation_result_serialization():
    """Test ValidationResult serialization (if needed for API)."""
    # This depends on how we implement serialization, e.g., to_dict()
    result = ValidationResult(
        stage=ValidationStage.FORMAT,
        is_valid=False,
        errors=["Error 1"],
        warnings=[],
        details={}
    )
    if hasattr(result, 'to_dict'):
        data = result.to_dict()
        assert data['stage'] == "format"
        assert data['is_valid'] is False
        assert data['errors'] == ["Error 1"]
