"""
T011: Contract test for POST /api/aides
Tests aide creation validation and response format
"""
import pytest


def test_create_aide_success(client):
    """Test POST /api/aides creates aide successfully"""
    payload = {
        "name": "Mary Johnson",
        "qualifications": "Reading Specialist",
        "colour_hex": "#33C1FF"
    }
    
    response = client.post('/api/aides', json=payload)
    
    assert response.status_code == 201
    assert response.json['name'] == "Mary Johnson"
    assert response.json['qualifications'] == "Reading Specialist"
    assert response.json['colour_hex'] == "#33C1FF"
    assert 'id' in response.json
    assert 'created_at' in response.json


def test_create_aide_minimal_fields(client):
    """Test POST /api/aides with only required fields"""
    payload = {
        "name": "Bob Williams",
        "colour_hex": "#FF0000"
    }
    
    response = client.post('/api/aides', json=payload)
    
    assert response.status_code == 201
    assert response.json['name'] == "Bob Williams"
    assert response.json['qualifications'] is None or response.json['qualifications'] == ""


def test_create_aide_missing_name(client):
    """Test POST /api/aides returns 400 when name is missing"""
    payload = {
        "colour_hex": "#FF0000"
    }
    
    response = client.post('/api/aides', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'name' in response.json['error'].lower()


def test_create_aide_missing_colour(client):
    """Test POST /api/aides returns 400 when colour_hex is missing"""
    payload = {
        "name": "Test Aide"
    }
    
    response = client.post('/api/aides', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'colour' in response.json['error'].lower()


def test_create_aide_invalid_colour_format(client):
    """Test POST /api/aides returns 400 for invalid colour format"""
    payload = {
        "name": "Test Aide",
        "colour_hex": "FF0000"  # Missing #
    }
    
    response = client.post('/api/aides', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_aide_empty_name(client):
    """Test POST /api/aides returns 400 for empty name"""
    payload = {
        "name": "",
        "colour_hex": "#FF0000"
    }
    
    response = client.post('/api/aides', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json


def test_create_aide_name_too_long(client):
    """Test POST /api/aides returns 400 for name exceeding 100 chars"""
    payload = {
        "name": "A" * 101,
        "colour_hex": "#FF0000"
    }
    
    response = client.post('/api/aides', json=payload)
    
    assert response.status_code == 400
    assert 'error' in response.json



