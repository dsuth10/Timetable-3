"""
T012: Contract test for PUT /api/aides/{id}
Tests aide update validation and response format
"""
import pytest


def test_update_aide_success(client):
    """Test PUT /api/aides/{id} updates aide successfully"""
    # First create an aide
    create_payload = {
        "name": "Original Name",
        "details": "Original Details",
        "colour_hex": "#FF0000"
    }
    create_response = client.post('/api/aides', json=create_payload)
    aide_id = create_response.json['id']
    
    # Update the aide
    update_payload = {
        "name": "Updated Name",
        "details": "Updated Details",
        "colour_hex": "#00FF00"
    }
    
    response = client.put(f'/api/aides/{aide_id}', json=update_payload)
    
    assert response.status_code == 200
    assert response.json['name'] == "Updated Name"
    assert response.json['details'] == "Updated Details"
    assert response.json['colour_hex'] == "#00FF00"
    assert response.json['id'] == aide_id
    assert 'updated_at' in response.json


def test_update_aide_partial_fields(client):
    """Test PUT /api/aides/{id} with only some fields"""
    # First create an aide
    create_payload = {
        "name": "Original Name",
        "details": "Original Details",
        "colour_hex": "#FF0000"
    }
    create_response = client.post('/api/aides', json=create_payload)
    aide_id = create_response.json['id']
    
    # Update only the name
    update_payload = {
        "name": "Updated Name Only"
    }
    
    response = client.put(f'/api/aides/{aide_id}', json=update_payload)
    
    assert response.status_code == 200
    assert response.json['name'] == "Updated Name Only"
    assert response.json['details'] == "Original Details"  # Unchanged
    assert response.json['colour_hex'] == "#FF0000"  # Unchanged


def test_update_aide_clear_details(client):
    """Test PUT /api/aides/{id} can clear details"""
    # First create an aide with details
    create_payload = {
        "name": "Test Aide",
        "details": "Some Details",
        "colour_hex": "#FF0000"
    }
    create_response = client.post('/api/aides', json=create_payload)
    aide_id = create_response.json['id']
    
    # Clear details
    update_payload = {
        "details": None
    }
    
    response = client.put(f'/api/aides/{aide_id}', json=update_payload)
    
    assert response.status_code == 200
    assert response.json['details'] is None


def test_update_aide_not_found(client):
    """Test PUT /api/aides/{id} returns 404 for non-existent aide"""
    update_payload = {
        "name": "Updated Name"
    }
    
    response = client.put('/api/aides/99999', json=update_payload)
    
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'not found' in response.json['error'].lower()


def test_update_aide_invalid_colour_format(client):
    """Test PUT /api/aides/{id} returns 400 for invalid colour format"""
    # First create an aide
    create_payload = {
        "name": "Test Aide",
        "colour_hex": "#FF0000"
    }
    create_response = client.post('/api/aides', json=create_payload)
    aide_id = create_response.json['id']
    
    # Try to update with invalid colour
    update_payload = {
        "colour_hex": "FF0000"  # Missing #
    }
    
    response = client.put(f'/api/aides/{aide_id}', json=update_payload)
    
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'colour' in response.json['error'].lower()


def test_update_aide_empty_name(client):
    """Test PUT /api/aides/{id} returns 400 for empty name"""
    # First create an aide
    create_payload = {
        "name": "Test Aide",
        "colour_hex": "#FF0000"
    }
    create_response = client.post('/api/aides', json=create_payload)
    aide_id = create_response.json['id']
    
    # Try to update with empty name
    update_payload = {
        "name": ""
    }
    
    response = client.put(f'/api/aides/{aide_id}', json=update_payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_update_aide_name_too_long(client):
    """Test PUT /api/aides/{id} returns 400 for name exceeding 100 chars"""
    # First create an aide
    create_payload = {
        "name": "Test Aide",
        "colour_hex": "#FF0000"
    }
    create_response = client.post('/api/aides', json=create_payload)
    aide_id = create_response.json['id']
    
    # Try to update with name too long
    update_payload = {
        "name": "A" * 101
    }
    
    response = client.put(f'/api/aides/{aide_id}', json=update_payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_update_aide_updated_at_changes(client):
    """Test PUT /api/aides/{id} updates the updated_at timestamp"""
    # First create an aide
    create_payload = {
        "name": "Test Aide",
        "colour_hex": "#FF0000"
    }
    create_response = client.post('/api/aides', json=create_payload)
    aide_id = create_response.json['id']
    original_updated_at = create_response.json['updated_at']
    
    # Wait a moment to ensure timestamp difference
    import time
    time.sleep(0.1)
    
    # Update the aide
    update_payload = {
        "name": "Updated Name"
    }
    
    response = client.put(f'/api/aides/{aide_id}', json=update_payload)
    
    assert response.status_code == 200
    assert response.json['updated_at'] != original_updated_at
    assert response.json['updated_at'] > original_updated_at
