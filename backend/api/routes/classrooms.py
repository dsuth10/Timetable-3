"""
Classrooms routes: minimal create/list
"""
from flask import Blueprint, request
from api.models import db
from api.models.classroom import Classroom

bp = Blueprint('classrooms', __name__, url_prefix='/api/classrooms')


@bp.post('')
def create_classroom():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    capacity = data.get('capacity')
    notes = data.get('notes')

    if not name:
        return {'error': 'name is required'}, 400

    c = Classroom(name=name, capacity=capacity, notes=notes)
    db.session.add(c)
    db.session.commit()
    return c.to_dict(), 201


@bp.get('')
def list_classrooms():
    items = Classroom.query.order_by(Classroom.id).all()
    return [c.to_dict() for c in items], 200


