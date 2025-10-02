"""
T010: Contract test for GET /api/aides
Tests API compliance with OpenAPI spec
"""
import pytest


def test_get_aides_empty(client):
    """Test GET /api/aides returns empty list when no aides exist"""
    response = client.get('/api/aides')
    
    assert response.status_code == 200
    assert response.json == []
    assert response.content_type == 'application/json'


def test_get_aides_returns_list(client, sample_aide):
    """Test GET /api/aides returns list of aides"""
    response = client.get('/api/aides')
    
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 1
    
    aide = response.json[0]
    assert aide['id'] == sample_aide.id
    assert aide['name'] == "John Smith"
    assert aide['qualifications'] == "Special Education"
    assert aide['colour_hex'] == "#FF5733"
    assert 'created_at' in aide


def test_get_aide_by_id(client, sample_aide):
    """Test GET /api/aides/{id} returns specific aide"""
    response = client.get(f'/api/aides/{sample_aide.id}')
    
    assert response.status_code == 200
    assert response.json['id'] == sample_aide.id
    assert response.json['name'] == "John Smith"


def test_get_aide_not_found(client):
    """Test GET /api/aides/{id} returns 404 for non-existent aide"""
    response = client.get('/api/aides/99999')
    
    assert response.status_code == 404
    assert 'error' in response.json


def test_get_aides_includes_availability(client, sample_aide, sample_availability):
    """Test GET /api/aides includes availability when requested"""
    response = client.get('/api/aides?include=availability')
    
    assert response.status_code == 200
    aide = response.json[0]
    assert 'availability' in aide
    assert isinstance(aide['availability'], list)
    assert len(aide['availability']) == 1
    assert aide['availability'][0]['weekday'] == 'MO'



