"""
CHARLOTTE - Flask Application Entry Point
"""
import os
from api import create_app

app = create_app()

if __name__ == '__main__':
    # Default to production-like settings if not specified
    debug = os.getenv('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=5000)



