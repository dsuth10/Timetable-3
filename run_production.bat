@echo off
echo Starting CHARLOTTE in Production Mode...

:: Navigate to backend directory
cd backend

:: Activate virtual environment
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Please run setup first.
    pause
    exit /b
)

:: Set environment variables
set FLASK_ENV=production
set FLASK_DEBUG=0

:: Check if frontend dist exists
if not exist ..\frontend\dist (
    echo Error: Frontend build not found at frontend\dist.
    echo Please run 'npm run build' in the frontend directory first.
    pause
    exit /b
)

:: Run with Waitress
echo Application starting on http://localhost:5000
waitress-serve --port=5000 app:app

pause

