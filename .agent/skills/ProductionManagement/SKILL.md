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

## Git & Release Strategy
- **`main` Branch**: Production-ready code ONLY. Never push directly here.
- **`develop` Branch**: Active development. All work happens here.

### Releasing to Production
1.  **Checkout Main**: `git checkout main`
2.  **Merge Develop**: `git merge develop`
3.  **Push**: `git push origin main`
4.  **Tag (Optional)**: `git tag vX.Y.Z && git push --tags`

## Deployment Workflow

### 1. Backend (PythonAnywhere)
- **Code Sync**: Pull latest changes from Git on the PythonAnywhere console.
- **Dependencies**: 
    - If `requirements.txt` changed, you **MUST** activate the virtualenv first:
      ```bash
      workon timetable_venv  # Use the correct venv name
      pip install -r requirements.txt
      ```
- **Reloading**: You **MUST** reload the Web App via the PythonAnywhere dashboard for changes to take effect.
- **CORS**: 
    - Ensure `backend/api/__init__.py` has the correct production URLs in the `origins` list (include `www` subdomains).
    - **CRITICAL**: Use `r"/api/.*"` as the resource regex to match all endpoints. `r"/api/*"` is incorrect and will cause CORS blocks.

### 2. Frontend (Hostinger)
- **Build**: Run `npm run build` locally in the `frontend` directory.
- **Configuration**:
    - `vite.config.ts` must have `base: '/timetable/'`.
    - `main.tsx` must use `BrowserRouter` with `basename={import.meta.env.BASE_URL}`.
- **Upload**: Transfer the contents of `frontend/dist` to the `/public_html/timetable/` folder on Hostinger.
- **Routing**: Ensure `.htaccess` is present in the production directory to handle SPA routing.

## Troubleshooting Production

### The "CORS Mask"
If the browser console shows "CORS Policy" errors (No 'Access-Control-Allow-Origin' header), it often means the **backend has crashed (500 error)**. 
- When Flask crashes during startup or a request before reaching the CORS middleware, no headers are sent.
- **Action**: Do not just look at CORS settings. Check the **Error Logs** immediately.

### Checking Logs (PythonAnywhere)
1. Go to the **Web tab** on PythonAnywhere.
2. Under **Log files**, open the **Error log** (`...error.log`).
3. Scroll to the bottom to find the traceback for the 500 error. Common causes:
    - Missing dependencies in the virtualenv.
    - Database schema mismatches (run migrations if needed).

## Production Verification
- **URL**: Test the live application at `https://mrsutherland.net/timetable`.
- **Console Check**: Monitor for CORS errors or 404s on static assets.
- **API Health**: Check production health at `https://threft.pythonanywhere.com/api/health`.

## Safety Rules
- **Never Test in Production**: Always verify features locally first.
- **Database Backups**: Use the `/api/backup` endpoints or the "Tasks Management" download feature before making destructive changes.
- **Virtualenv Discipline**: Always run `pip` commands *after* `workon`.
