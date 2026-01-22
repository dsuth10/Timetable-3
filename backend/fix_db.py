
import sqlite3
import os

instance_path = os.path.join(os.getcwd(), 'instance', 'timetable.db')
print(f"Connecting to database at {instance_path}")

try:
    conn = sqlite3.connect(instance_path)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(teacher_aides)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if 'updated_at' not in columns:
        print("Column 'updated_at' missing. Adding it...")
        cursor.execute("ALTER TABLE teacher_aides ADD COLUMN updated_at DATETIME")
        cursor.execute("UPDATE teacher_aides SET updated_at = created_at WHERE updated_at IS NULL")
        conn.commit()
        print("Column added successfully.")
    else:
        print("Column 'updated_at' already exists.")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
