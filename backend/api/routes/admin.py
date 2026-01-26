from flask import Blueprint, jsonify, current_app
from api.models import db
import time
from sqlalchemy import text as sa_text

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@bp.route('/reset-db', methods=['POST'])
def reset_db():
    """
    Resets the database to a clean slate.
    This drops all tables and recreates them.
    """
    try:
        # Import all models to ensure they are registered with SQLAlchemy
        from api.models import (
            TeacherAide, Availability, Classroom, Task, 
            RecurringSeries, Assignment, Absence, Request, TermWeek
        )
        
        # Close any existing sessions
        db.session.remove()
        
        # Disable foreign key checks for the drop operation
        db.session.execute(sa_text("PRAGMA foreign_keys = OFF"))
        
        # Drop all tables
        db.drop_all()
        
        # Create all tables
        db.create_all()
        
        # Re-enable foreign key checks
        db.session.execute(sa_text("PRAGMA foreign_keys = ON"))
        db.session.commit()
        
        return jsonify({
            "message": "Database reset successfully", 
            "status": "success",
            "timestamp": time.time()
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error resetting database: {str(e)}")
        return jsonify({"error": "Failed to reset database", "details": str(e)}), 500
