"""
PDF Service
Handles generation of PDF schedule files from assignments.
"""
from io import BytesIO
from datetime import datetime, timedelta, time, date
from typing import List, Optional, Dict, Tuple
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from api.models.assignment import Assignment
from api.models.teacher_aide import TeacherAide

class PdfService:
    """
    Service for generating PDF schedules.
    """
    
    @staticmethod
    def generate_weekly_pdf(
        assignments: List[Assignment], 
        start_date: date,
        end_date: date,
        aide: Optional[TeacherAide] = None
    ) -> bytes:
        """
        Generate a PDF file content for a weekly schedule.
        
        Args:
            assignments: List of Assignment objects
            start_date: Start date of the week
            end_date: End date of the week
            aide: Optional TeacherAide object if filtered
            
        Returns:
            bytes: The generated PDF file content
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=landscape(A4),
            rightMargin=30, leftMargin=30, 
            topMargin=30, bottomMargin=30
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_text = f"Weekly Schedule: {start_date.strftime('%b %d, %Y')} - {end_date.strftime('%b %d, %Y')}"
        if aide:
            title_text = f"{aide.name} - {title_text}"
            
        elements.append(Paragraph(title_text, styles['Heading1']))
        elements.append(Spacer(1, 12))
        
        # Prepare grid data
        # Columns: Time + 5 Days
        # Rows: Time slots (e.g. 30 mins)
        
        days = []
        current = start_date
        while current <= end_date:
            days.append(current)
            current += timedelta(days=1)
            
        # Header row
        headers = ["Time"] + [day.strftime("%A\n%d/%m") for day in days]
        data = [headers]
        
        # Generate time slots (08:00 to 16:00, 30 min intervals)
        start_hour = 8
        end_hour = 16
        time_slots = []
        
        current_time = time(start_hour, 0)
        while current_time < time(end_hour, 0):
            time_slots.append(current_time)
            # Add 30 mins
            dt = datetime.combine(date.today(), current_time) + timedelta(minutes=30)
            current_time = dt.time()
            
        # Fill matrix
        # Map (date, rounded_time) -> List[Assignment]
        assignment_map: Dict[Tuple[date, time], List[Assignment]] = {}
        for a in assignments:
            t = a.start_time
            # Round down to nearest 30 mins for bucket key
            # e.g. 09:15 -> 09:00, 09:45 -> 09:30
            total_minutes = t.hour * 60 + t.minute
            rounded_minutes = (total_minutes // 30) * 30
            
            rounded_hour = rounded_minutes // 60
            rounded_minute = rounded_minutes % 60
            
            bucket_time = time(rounded_hour, rounded_minute)
            
            key = (a.date, bucket_time)
            if key not in assignment_map:
                assignment_map[key] = []
            assignment_map[key].append(a)
            
        # Sort assignments within each bucket by actual start time
        for key in assignment_map:
            assignment_map[key].sort(key=lambda x: x.start_time)
            
        for slot_time in time_slots:
            row = [slot_time.strftime("%H:%M")]
            for day in days:
                # Find assignments bucketed to this time slot
                slot_assignments = assignment_map.get((day, slot_time), [])
                cell_content_parts = []
                
                for assignment in slot_assignments:
                    parts = []
                    
                    # Always show actual time range for clarity
                    time_range = f"{assignment.start_time.strftime('%H:%M')} - {assignment.end_time.strftime('%H:%M')}"
                    parts.append(f"<font size=6 color='grey'>{time_range}</font>")
                    
                    if assignment.task:
                        parts.append(f"<b>{assignment.task.title}</b>")
                        if assignment.task.classroom:
                            parts.append(f"<i>{assignment.task.classroom.name}</i>")
                    
                    if not aide and assignment.aide:
                         parts.append(f"({assignment.aide.name})")
                    
                    # Add spacing between multiple assignments in same slot
                    if cell_content_parts:
                         cell_content_parts.append("<br/><br/>")
                         
                    cell_content_parts.append("<br/>".join(parts))
                    
                cell_text = "".join(cell_content_parts)
                row.append(Paragraph(cell_text, styles['Normal']))
            data.append(row)
            
        # Create Table
        # Col widths: Time is narrow, days are equal
        avail_width = landscape(A4)[0] - 60
        time_col_width = 50
        day_col_width = (avail_width - time_col_width) / len(days)
        col_widths = [time_col_width] + [day_col_width] * len(days)
        
        table = Table(data, colWidths=col_widths, repeatRows=1)
        
        # Style
        ts = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ])
        
        # Add alternating colors or specific assignment styling if needed
        # For now, just grid
        
        table.setStyle(ts)
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
