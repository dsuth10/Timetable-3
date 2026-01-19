from flask import Blueprint, jsonify, current_app
from api.models import db
import time

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@bp.route('/reset-db', methods=['POST'])
def reset_db():
    """
    Resets the database to a clean slate.
    This drops all tables and recreates them.
    """
    try:
        # Close any existing connections (optional but good practice)
        db.session.remove()
        
        # Drop all tables
        db.drop_all()
        
        # Create all tables
        db.create_all()
        
        return jsonify({
            "message": "Database reset successfully", 
            "status": "success",
            "timestamp": time.time()
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error resetting database: {str(e)}")
        return jsonify({"error": "Failed to reset database", "details": str(e)}), 500
