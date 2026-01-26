from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ValidationStage(Enum):
    """Validation stages for backup import."""
    FORMAT = "format"              # File format check
    SCHEMA = "schema"              # Schema structure check
    DATA_TYPES = "data_types"      # Data type validation
    RELATIONSHIPS = "relationships" # Foreign key validation

# All tables that must be included in backup
REQUIRED_TABLES = [
    'teacher_aides',
    'tasks',
    'assignments',
    'classrooms',
    'absences',
    'availability',
    'requests',
    'recurring_series'
]

@dataclass
class ValidationResult:
    """Result of a validation stage."""
    stage: ValidationStage
    is_valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert validation result to dictionary for API response."""
        return {
            "stage": self.stage.value,
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "details": self.details
        }
