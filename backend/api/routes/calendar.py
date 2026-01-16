"""
Calendar Routes
Endpoints for exporting calendar data.
"""
from flask import Blueprint, request, Response, make_response
from datetime import datetime, date
from sqlalchemy import and_

from api.models import db
from api.models.assignment import Assignment
from api.models.task import Task
from api.models.teacher_aide import TeacherAide
from api.models.classroom import Classroom
from api.services.calendar_service import CalendarService

calendar_bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')

@calendar_bp.route('/export', methods=['GET'])
def export_calendar():
    """
    Export assignments as an iCal (.ics) file.
    
    Query Parameters:
    - aide_id: Optional filter by aide ID
    - classroom_id: Optional filter by classroom ID
    - start_date: Optional start date (YYYY-MM-DD)
    - end_date: Optional end date (YYYY-MM-DD)
    """
    try:
        # Parse parameters
        aide_id = request.args.get('aide_id', type=int)
        classroom_id = request.args.get('classroom_id', type=int)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Build query
        query = Assignment.query.options(
            db.joinedload(Assignment.task).joinedload(Task.classroom),
            db.joinedload(Assignment.aide)
        )
        
        filters = []
        
        if aide_id:
            filters.append(Assignment.aide_id == aide_id)
        
        # Filter by classroom through task relationship
        if classroom_id:
            query = query.join(Assignment.task)
            filters.append(Task.classroom_id == classroom_id)
            
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                filters.append(Assignment.date >= start_date)
            except ValueError:
                pass # Ignore invalid dates
                
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                filters.append(Assignment.date <= end_date)
            except ValueError:
                pass # Ignore invalid dates
        
        if filters:
            query = query.filter(and_(*filters))
            
        assignments = query.order_by(Assignment.date, Assignment.start_time).all()
        
        # Determine filename and calendar name
        filename = "timetable.ics"
        calendar_name = "Timetable"
        
        if aide_id:
            aide = db.session.get(TeacherAide, aide_id)
            if aide:
                filename = f"timetable-{aide.name.replace(' ', '_')}.ics"
                calendar_name = f"{aide.name}'s Timetable"
        elif classroom_id:
            classroom = db.session.get(Classroom, classroom_id)
            if classroom:
                filename = f"timetable-{classroom.name.replace(' ', '_')}.ics"
                calendar_name = f"{classroom.name}'s Timetable"
        
        # Generate ICS
        ics_content = CalendarService.generate_ics(assignments, calendar_name)
        
        # Create response
        response = make_response(ics_content)
        response.headers['Content-Type'] = 'text/calendar; charset=utf-8'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}'
        
        return response
        
    except Exception as e:
        return {"error": str(e)}, 500

