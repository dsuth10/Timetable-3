---
name: LocalDevelopment
description: Guidelines for working in the local development environment.
---

# Local Development Guide

This skill directs the agent on how to correctly manage and interact with the local development environment for the Timetable-3 project.

## Environment Architecture
- **Backend API**: Flask server running on `http://127.0.0.1:5000`.
- **Frontend App**: Vite development server running on `http://localhost:3000`.
- **Database**: Local SQLite database located at `backend/instance/timetable.db`.

## Connection Logic
- The frontend is configured to use a **Vite Proxy** (`vite.config.ts`) to route `/api` requests to the local backend.
- **CRITICAL**: The `frontend/src/services/api.ts` file automatically detects `localhost` and uses the relative `/api` path. This ensures all local traffic stays local.

## Commands
- **Start Backend**: `cd backend; python -m flask run`
- **Start Frontend**: `cd frontend; npm run dev -- --port 3000`
- **Install Backend Deps**: `pip install -r requirements.txt`
- **Install Frontend Deps**: `npm install`

## Local Development Workflow
1. **Verify Servers**: Always check if the backend is healthy via `http://127.0.0.1:5000/api/health` before troubleshooting frontend errors.
2. **Environment Variables**: Use `frontend/.env.development` for local-only settings. Note that Vite requires variables to be prefixed with `VITE_`.
3. **Database Management**: For manual DB edits, use the local SQLite instance. Avoid using production data locally unless specifically requested.
4. **Testing**: Always test fixes on `http://localhost:3000/timetable/` before proceeding to production planning.
