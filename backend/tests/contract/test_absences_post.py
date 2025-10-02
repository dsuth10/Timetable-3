"""
T019: Contract test for POST /api/absences
Tests absence creation and automatic task reassignment
"""
import pytest
from datetime import date, timedelta


def test_create_absence_success(client, sample_aide):
    """Test POST /api/absences creates absence successfully"""
    tomorrow = date.today() + timedelta(days=1)
    
    payload = {
        "aide_id": sample_aide.id,
        "date": tomorrow.isoformat(),
        "reason": "Medical appointment"
    }
    
    response = client.post('/api/absences', json=payload)
    
    assert response.status_code == 201
    assert response.json['aide_id'] == sample_aide.id
    assert response.json['date'] == tomorrow.isoformat()
    assert response.json['reason'] == "Medical appointment"


def test_create_absence_releases_assignments(client, sample_aide, sample_assignment):
    """Test POST /api/absences automatically releases aide's assignments for that day"""
    absence_date = date(2025, 10, 6)  # Same as sample_assignment
    
    payload = {
        "aide_id": sample_aide.id,
        "date": absence_date.isoformat(),
        "reason": "Sick leave"
    }
    
    response = client.post('/api/absences', json=payload)
    
    assert response.status_code == 201
    assert 'released_assignments' in response.json
    assert len(response.json['released_assignments']) == 1
    assert response.json['released_assignments'][0]['id'] == sample_assignment.id


def test_create_absence_duplicate_date(client, sample_aide):
    """Test POST /api/absences returns 409 for duplicate absence on same date"""
    tomorrow = date.today() + timedelta(days=1)
    
    payload = {
        "aide_id": sample_aide.id,
        "date": tomorrow.isoformat(),
        "reason": "Appointment"
    }
    
    # Create first absence
    client.post('/api/absences', json=payload)
    
    # Try to create duplicate
    response = client.post('/api/absences', json=payload)
    
    assert response.status_code == 409
    assert 'error' in response.json
    assert 'already' in response.json['error'].lower() or 'duplicate' in response.json['error'].lower()


def test_create_absence_missing_aide_id(client):
    """Test POST /api/absences returns 400 when aide_id is missing"""
    payload = {
        "date": date.today().isoformat(),
        "reason": "Test"
    }
    
    response = client.post('/api/absences', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_absence_missing_date(client, sample_aide):
    """Test POST /api/absences returns 400 when date is missing"""
    payload = {
        "aide_id": sample_aide.id,
        "reason": "Test"
    }
    
    response = client.post('/api/absences', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_absence_invalid_aide(client):
    """Test POST /api/absences returns 404 for non-existent aide"""
    payload = {
        "aide_id": 99999,
        "date": date.today().isoformat(),
        "reason": "Test"
    }
    
    response = client.post('/api/absences', json=payload)
    
    assert response.status_code == 404
    assert 'error' in response.json


def test_get_absences_by_aide(client, sample_aide):
    """Test GET /api/aides/{id}/absences returns all absences for aide"""
    from api.models.absence import Absence
    from api.models import db
    
    # Create some absences
    absence1 = Absence(
        aide_id=sample_aide.id,
        date=date(2025, 10, 10),
        reason="Sick"
    )
    absence2 = Absence(
        aide_id=sample_aide.id,
        date=date(2025, 10, 15),
        reason="Personal"
    )
    db.session.add_all([absence1, absence2])
    db.session.commit()
    
    response = client.get(f'/api/aides/{sample_aide.id}/absences')
    
    assert response.status_code == 200
    assert len(response.json) == 2



