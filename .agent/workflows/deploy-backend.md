---
description: how to deploy backend updates to PythonAnywhere
---

1. **Commit and Push Local Changes**
   - Save your work and push to GitHub/your repository.
   - Command (example): `git add . && git commit -m "Update backend" && git push`

2. **Pull Changes on PythonAnywhere**
   - Log in to your PythonAnywhere account.
   - Open a **Bash Console**.
   - Navigate to your project directory: `cd ~/Timetable-3`
   - Pull the latest changes: `git pull`

3. **Reload the Web App**
   - Go to the **Web** tab in the PythonAnywhere dashboard.
   - Click the green **Reload [username].pythonanywhere.com** button.
   - Wait for the spinner to finish.

4. **Verify**
   - Check the health endpoint: `https://threft.pythonanywhere.com/api/health`
