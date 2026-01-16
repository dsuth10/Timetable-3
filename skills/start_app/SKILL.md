---
name: start_app
description: Standard operating procedure for launching the CHARLOTTE application development environment.
---

# Start App Skill

This skill provides the necessary instructions and context for starting the CHARLOTTE application, ensuring both the backend API and the frontend UI are correctly initialized and communicating.

## Prerequisites
- Python 3.8+
- Node.js 16+
- virtualenv (optional but recommended)

## Backend Startup
The backend is a Flask application.
1. Navigate to `backend/`.
2. (Optional) Activate your virtual environment.
3. Run `python -m flask run`.
4. The API will be available at `http://127.0.0.1:5000/`.

## Frontend Startup
The frontend is a React application powered by Vite.
1. Navigate to `frontend/`.
2. Run `npm run dev`.
3. The UI will be available at `http://localhost:3000/`.

## Verification
- Visit `http://127.0.0.1:5000/api/health` to confirm the backend is responsive.
- The UI should load and display the login or schedule page without API connection errors.
