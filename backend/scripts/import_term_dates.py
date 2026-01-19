import os
import sys
import pandas as pd
import re
from datetime import datetime

# Add backend directory to path (parent of this script's directory)
# Script is in backend/scripts, so we want backend/
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from api import create_app, db
from api.models.term_week import TermWeek

def parse_term_week(week_term_str):
    """
    Parses string like "Week 1, Term 1" into (term_number, week_number).
    Returns (None, None) if format doesn't match.
    """
    if not isinstance(week_term_str, str):
        return None, None
    
    # Match "Week X, Term Y"
    match = re.search(r'Week\s+(\d+),\s+Term\s+(\d+)', week_term_str, re.IGNORECASE)
    if match:
        return int(match.group(2)), int(match.group(1))
    
    return None, None

def import_dates(directory):
    app = create_app()
    with app.app_context():
        # Create table if it doesn't exist
        db.create_all()
        
        print(f"Scanning directory: {directory}")
        files = [f for f in os.listdir(directory) if f.endswith('.xlsx')]
        
        total_records = 0
        
        for filename in files:
            filepath = os.path.join(directory, filename)
            print(f"Processing {filename}...")
            
            try:
                df = pd.read_excel(filepath)
                
                # Verify columns
                required_cols = ['Week/Term', 'Date']
                if not all(col in df.columns for col in required_cols):
                    print(f"Skipping {filename}: Missing required columns. Found: {df.columns.tolist()}")
                    continue
                
                for _, row in df.iterrows():
                    date_str = row['Date'] # e.g. 27/01/2026
                    week_term_str = row['Week/Term']
                    
                    try:
                        # Handle potential timestamp objects or strings
                        if isinstance(date_str, datetime):
                            date_obj = date_str.date()
                        else:
                            date_obj = datetime.strptime(str(date_str), '%d/%m/%Y').date()
                            
                        # Parse term info
                        term, week = parse_term_week(week_term_str)
                        
                        # Create or Update
                        record = db.session.get(TermWeek, date_obj)
                        if not record:
                            record = TermWeek(date=date_obj)
                            db.session.add(record)
                        
                        record.term_number = term
                        record.week_number = week
                        record.display_label = str(week_term_str) if pd.notna(week_term_str) else None
                        
                        total_records += 1
                        
                    except Exception as e:
                        print(f"Error processing row {row}: {e}")
                        continue
                        
                db.session.commit()
                print(f"Finished {filename}")
                
            except Exception as e:
                print(f"Failed to process file {filename}: {e}")
                
        print(f"Import complete. Total records processed: {total_records}")

if __name__ == '__main__':
    # Adjust path to where the user said the files are: rough-ideas/Date_Information
    # Assuming script is run from project root or checks relative paths
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(project_root, 'rough-ideas', 'Date_Information')
    
    # If project root calculation is wrong, try the absolute path known from context
    if not os.path.exists(target_dir):
        # Fallback to the known path from user request
        target_dir = r'c:\Users\dsuth\Documents\Code Projects\Timetable-3\rough-ideas\Date_Information'
        
    import_dates(target_dir)
