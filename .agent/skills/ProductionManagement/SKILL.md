---
name: ProductionManagement
description: Guidelines for managing and updating the production environment.
---

# Production Management Guide

This skill directs the agent on how to manage the production environment and the transition from local development to live deployment.

## Production Architecture
- **Backend API**: Hosted on **PythonAnywhere** (`https://threft.pythonanywhere.com`).
- **Frontend App**: Hosted on **Hostinger** at `https://mrsutherland.net/timetable`.
- **Database**: Production SQLite database on PythonAnywhere.

## Deployment Workflow

### 1. Backend (PythonAnywhere)
- **Code Sync**: Pull latest changes from Git on the PythonAnywhere console.
- **Dependencies**: If `requirements.txt` changed, run `pip install -r requirements.txt`.
- **Reloading**: You **MUST** reload the Web App via the PythonAnywhere dashboard for changes to take effect.
- **CORS**: Ensure `backend/api/__init__.py` has the correct production URLs in the `origins` list.

### 2. Frontend (Hostinger)
- **Build**: Run `npm run build` locally in the `frontend` directory.
- **Configuration**:
    - `vite.config.ts` must have `base: '/timetable/'`.
    - `main.tsx` must use `BrowserRouter` with `basename={import.meta.env.BASE_URL}`.
- **Upload**: Transfer the contents of `frontend/dist` to the `/public_html/timetable/` folder on Hostinger.
- **Routing**: Ensure `.htaccess` is present in the production directory to handle SPA routing.

## Production Verification
- **URL**: Test the live application at `https://mrsutherland.net/timetable`.
- **Console Check**: Monitor for CORS errors or 404s on static assets.
- **API Health**: Check production health at `https://threft.pythonanywhere.com/api/health`.

## Safety Rules
- **Never Test in Production**: Always verify features locally first.
- **Database Backups**: Use the `/api/backup` endpoints if available before making destructive changes.
