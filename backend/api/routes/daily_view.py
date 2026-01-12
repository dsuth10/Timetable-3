from flask import Blueprint, jsonify, request
from datetime import datetime
from ..services.daily_view_service import DailyViewService

daily_view_bp = Blueprint('daily_view', __name__)
daily_view_service = DailyViewService()

@daily_view_bp.route('/<date_str>', methods=['GET'])
def get_daily_view(date_str):
    """
    GET /api/daily-view/{date}
    Returns all data for the daily display.
    """
    try:
        view_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        data = daily_view_service.get_daily_data(view_date)
        return jsonify(data), 200
    except ValueError:
        return jsonify({"error": "Bad request", "message": "Invalid date format. Use YYYY-MM-DD"}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@daily_view_bp.route('/assign', methods=['POST'])
def assign_task():
    """
    POST /api/daily-view/assign
    Handles drag-and-drop assignment from Task Bank or Relief Pool.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Bad request", "message": "Missing request body"}), 400
    
    # Required fields validation
    required = ['type', 'id', 'date', 'aide_id', 'start_time', 'end_time']
    missing = [field for field in required if field not in data]
    if missing:
        return jsonify({"error": "Bad request", "message": f"Missing required fields: {', '.join(missing)}"}), 400
    
    try:
        result = daily_view_service.assign_task(data)
        if "error" in result:
            return jsonify({"error": "Conflict", "message": result["error"]}), 409
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"error": "Bad request", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

