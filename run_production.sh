#!/bin/bash
echo "Starting CHARLOTTE in Production Mode..."

# Navigate to backend directory
cd backend

# Activate virtual environment
if [ -f venv/Scripts/activate ]; then
    source venv/Scripts/activate
elif [ -f venv/bin/activate ]; then
    source venv/bin/activate
else
    echo "Virtual environment not found. Please run setup first."
    exit 1
fi

# Set environment variables
export FLASK_ENV=production
export FLASK_DEBUG=0

# Check if frontend dist exists
if [ ! -d "../frontend/dist" ]; then
    echo "Error: Frontend build not found at frontend/dist."
    echo "Please run 'npm run build' in the frontend directory first."
    exit 1
fi

# Run with Waitress
echo "Application starting on http://localhost:5000"
waitress-serve --port=5000 app:app

