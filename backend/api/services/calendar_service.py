"""
Calendar Service
Handles generation of iCal (.ics) files from assignments.
"""
from datetime import datetime, date, time
from typing import List, Optional
from icalendar import Calendar, Event, vText, vCalAddress
from api.models.assignment import Assignment

class CalendarService:
    """
    Service for generating iCal files from assignments.
    """
    
    @staticmethod
    def generate_ics(assignments: List[Assignment], calendar_name: str = "Timetable Export") -> bytes:
        """
        Generate an iCal file content from a list of assignments.
        
        Args:
            assignments: List of Assignment objects
            calendar_name: Name of the calendar
            
        Returns:
            bytes: The generated .ics file content
        """
        cal = Calendar()
        cal.add('prodid', '-//Teacher Aide Timetable//mrsutherland.net//EN')
        cal.add('version', '2.0')
        cal.add('x-wr-calname', calendar_name)
        
        for assignment in assignments:
            event = Event()
            
            # Basic event details
            # Task title as summary
            summary = "Assignment"
            if assignment.task:
                summary = assignment.task.title
            
            event.add('summary', summary)
            
            # Dates and times
            # Combine date and time for dtstart and dtend
            if assignment.start_time and assignment.end_time:
                dt_start = datetime.combine(assignment.date, assignment.start_time)
                dt_end = datetime.combine(assignment.date, assignment.end_time)
                event.add('dtstart', dt_start)
                event.add('dtend', dt_end)
            else:
                # Fallback if times are missing (shouldn't happen for valid assignments)
                event.add('dtstart', assignment.date)
            
            # Location
            location_parts = []
            if assignment.task and assignment.task.classroom:
                location_parts.append(assignment.task.classroom.name)
            
            if location_parts:
                event.add('location', ", ".join(location_parts))
            
            # Description
            description_parts = []
            if assignment.task:
                if assignment.task.category:
                    description_parts.append(f"Category: {assignment.task.category}")
                if assignment.task.notes:
                    description_parts.append(f"Notes: {assignment.task.notes}")
            
            if assignment.aide:
                description_parts.append(f"Assigned to: {assignment.aide.name}")
            
            if description_parts:
                event.add('description', "\n".join(description_parts))
            
            # Unique ID
            event.add('uid', f'assignment-{assignment.id}@timetable.mrsutherland.net')
            event.add('dtstamp', datetime.now())
            
            cal.add_component(event)
            
        return cal.to_ical()






























