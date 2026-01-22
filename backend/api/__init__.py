"""
API Package - Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS
import os


def create_app(config=None):
    """
    Create and configure the Flask application.
    
    Args:
        config: Optional configuration dictionary for testing
    
    Returns:
        Configured Flask app instance
    """
    # Resolve instance folder (project_root/instance) and ensure it exists
    base_dir = os.path.dirname(os.path.dirname(__file__))
    instance_path = os.path.join(base_dir, 'instance')
    os.makedirs(instance_path, exist_ok=True)

    # Resolve frontend dist folder for production serving
    frontend_dist = os.path.join(os.path.dirname(base_dir), 'frontend', 'dist')

    # Initialize Flask with static folder pointing to frontend build
    app = Flask(__name__,
                static_folder=frontend_dist if os.path.exists(frontend_dist) else None,
                static_url_path='/')

    # Build absolute sqlite path under instance
    default_sqlite_path = os.path.join(instance_path, 'timetable.db')
    default_db_uri = f"sqlite:///{default_sqlite_path}"

    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', default_db_uri)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    # Apply test config if provided
    if config:
        app.config.update(config)
    
    # Initialize extensions
    from api.models import db
    db.init_app(app)
    
    # CORS configuration
    # CORS configuration - Allow all origins for development/testing
    CORS(app, resources={
        r"/api/.*": {
            "origins": r".*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # instance folder already ensured above
    
    # Register blueprints
    from api.routes import aides, availability, tasks, assignments, absences, classrooms, requests, recurring_series, calendar, relief_pool, backup, daily_view
    app.register_blueprint(aides.bp)
    app.register_blueprint(availability.bp)
    app.register_blueprint(tasks.bp)
    app.register_blueprint(assignments.bp)
    app.register_blueprint(absences.bp)
    app.register_blueprint(classrooms.bp)
    app.register_blueprint(requests.bp)
    app.register_blueprint(recurring_series.bp)
    app.register_blueprint(calendar.calendar_bp)
    app.register_blueprint(relief_pool.bp)
    app.register_blueprint(backup.bp)
    app.register_blueprint(daily_view.daily_view_bp, url_prefix='/api/daily-view')
    
    from api.routes import admin
    app.register_blueprint(admin.bp)
    
    # Error handlers (T052)
    @app.errorhandler(400)
    def bad_request(error):
        description = getattr(error, 'description', None) or str(error)
        return {"error": "Bad request", "message": description}, 400
    
    @app.errorhandler(404)
    def not_found(error):
        description = getattr(error, 'description', None) or str(error)
        return {"error": "Not found", "message": description}, 404
    
    @app.errorhandler(409)
    def conflict(error):
        description = getattr(error, 'description', None) or str(error)
        return {"error": "Conflict", "message": description}, 409
    
    @app.errorhandler(500)
    def internal_error(error):
        description = getattr(error, 'description', None) or str(error)
        return {"error": "Internal server error", "message": description}, 500
    
    # Health check
    @app.route('/api/health')
    def health():
        return {"status": "healthy", "version": "1.0.0"}

    # Catch-all route for SPA support (MUST be after API routes)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if app.static_folder and path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return app.send_static_file(path)
        elif app.static_folder:
            return app.send_static_file('index.html')
        else:
            return {"error": "Frontend not built. Run 'npm run build' in frontend directory."}, 404

    return app

