import pytest
from api.services.backup_service import BackupService
from api.models.teacher_aide import TeacherAide

def test_check_database_empty(client, db_session):
    """Test database emptiness check."""
    service = BackupService()
    
    # 1. Check empty database
    is_empty, non_empty = service.check_database_empty()
    assert is_empty is True
    assert len(non_empty) == 0
    
    # 2. Add some data
    aide = TeacherAide(name="Test Aide", colour_hex="#FF0000")
    db_session.add(aide)
    db_session.commit()
    
    # 3. Check again
    is_empty, non_empty = service.check_database_empty()
    assert is_empty is False
    assert "teacher_aides" in str(non_empty)
