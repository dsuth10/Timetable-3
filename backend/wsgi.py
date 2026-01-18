"""
WSGI application for PythonAnywhere
This file tells PythonAnywhere how to run your Flask app
"""

import sys
import os

# Add the backend folder to Python path
path = os.path.expanduser('/home/threft/Timetable-3/backend')
if path not in sys.path:
    sys.path.append(path)

# Import your Flask app
from app import app as application

# This is what PythonAnywhere will execute
if __name__ == "__main__":
    application.run()
