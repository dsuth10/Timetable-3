
import os
import shutil

db_path = r'd:\dsuth10\My Documents\Coding projects\Timetable-3\backend\instance\timetable.db'
if os.path.exists(db_path):
    print(f"Removing {db_path}")
    os.remove(db_path)
else:
    print(f"{db_path} not found")

# Also remove compiled python files that might linger
for root, dirs, files in os.walk(r'd:\dsuth10\My Documents\Coding projects\Timetable-3\backend'):
    for file in files:
        if file.endswith('.pyc'):
            os.remove(os.path.join(root, file))
