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
        
        # Generate time slots (08:00 to 16:00, 15 min intervals)
        start_hour = 8
        end_hour = 16
        time_slots = []
        
        current_time = time(start_hour, 0)
        while current_time < time(end_hour, 0):
            time_slots.append(current_time)
            # Add 15 mins
            dt = datetime.combine(date.today(), current_time) + timedelta(minutes=15)
            current_time = dt.time()
            
        # Fill matrix
        # Map (date, bucket_time) -> List[Assignment]
        assignment_map: Dict[Tuple[date, time], List[Assignment]] = {}
        for a in assignments:
            t_start = a.start_time
            t_end = a.end_time
            
            start_minutes = t_start.hour * 60 + t_start.minute
            end_minutes = t_end.hour * 60 + t_end.minute
            
            # Round start down to nearest 15
            current_minutes = (start_minutes // 15) * 15
            
            # Iterate 15 mins at a time until end time
            while current_minutes < end_minutes:
                h = current_minutes // 60
                m = current_minutes % 60
                
                if h >= 24: break
                
                bucket_time = time(h, m)
                key = (a.date, bucket_time)
                
                if key not in assignment_map:
                    assignment_map[key] = []
                
                if a not in assignment_map[key]:
                    assignment_map[key].append(a)
                    
                current_minutes += 15
            
        # Sort assignments within each bucket by actual start time
        for key in assignment_map:
            assignment_map[key].sort(key=lambda x: x.start_time)
            
        # Track spans
        spans = []
        # State: day_idx -> {'assignments': [Assignment], 'start_row': int}
        col_state = {}
        
        for i, slot_time in enumerate(time_slots):
            # row index in data (0 is header)
            row_idx = i + 1
            row = [slot_time.strftime("%H:%M")]
            
            for day_idx, day in enumerate(days):
                # Find assignments bucketed to this time slot
                slot_assignments = assignment_map.get((day, slot_time), [])
                
                # Content generation
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
                
                # Span detection
                should_span = False
                if day_idx in col_state:
                    prev = col_state[day_idx]
                    # Compare assignments by ID
                    prev_ids = [x.id for x in prev['assignments']]
                    curr_ids = [x.id for x in slot_assignments]
                    
                    if slot_assignments and prev_ids == curr_ids:
                        should_span = True
                
                if should_span:
                    # Continue span
                    row.append(Paragraph("", styles['Normal']))
                else:
                    # New block or empty
                    # Close previous span if it existed
                    if day_idx in col_state:
                        prev = col_state[day_idx]
                        if row_idx - 1 > prev['start_row']:
                            # Col in table = day_idx + 1 (0 is Time)
                            c = day_idx + 1
                            spans.append(('SPAN', (c, prev['start_row']), (c, row_idx - 1)))
                    
                    # Start new state if not empty
                    if slot_assignments:
                        col_state[day_idx] = {'assignments': slot_assignments, 'start_row': row_idx}
                    else:
                        if day_idx in col_state:
                            del col_state[day_idx]
                            
                    row.append(Paragraph(cell_text, styles['Normal']))
            
            data.append(row)
            
        # Close any open spans at the end
        final_row_idx = len(data) - 1
        for day_idx in col_state:
            prev = col_state[day_idx]
            if final_row_idx > prev['start_row']:
                c = day_idx + 1
                spans.append(('SPAN', (c, prev['start_row']), (c, final_row_idx)))
            
        # Create Table
        # Col widths: Time is narrow, days are equal
        avail_width = landscape(A4)[0] - 60
        time_col_width = 50
        day_col_width = (avail_width - time_col_width) / len(days)
        col_widths = [time_col_width] + [day_col_width] * len(days)
        
        table = Table(data, colWidths=col_widths, repeatRows=1)
        
        # Style
        style_cmds = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ]
        
        # Add calculated spans
        style_cmds.extend(spans)
        
        ts = TableStyle(style_cmds)
        
        # Add alternating colors or specific assignment styling if needed
        # For now, just grid
        
        table.setStyle(ts)
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
