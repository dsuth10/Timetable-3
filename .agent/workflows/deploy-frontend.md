---
description: how to deploy frontend updates to Hostinger
---

1. **Build the Project Locally**
   - Open a terminal on your computer.
   - Navigate to the frontend directory: `cd frontend`
   - Run the build command: `npm run build`
   - This will create a `dist` folder.

2. **Access Hostinger File Manager**
   - Log in to your Hostinger hPanel.
   - Go to **Websites** -> **Manage** -> **File Manager**.
   - Open the **`public_html`** folder.
   - Open the **`timetable`** folder.

3. **Upload Files**
   - Select all files and folders inside your local `frontend/dist` folder.
   - Drag and drop them into the `timetable` folder on Hostinger.
   - **Overwrite** any existing files when prompted.
   - Ensure `index.html` and `.htaccess` are directly inside the `timetable` folder.

4. **Verify**
   - Visit `https://mrsutherland.net/timetable/`
   - If you see a white screen, ensure `basename` was set correctly in `main.tsx`.
