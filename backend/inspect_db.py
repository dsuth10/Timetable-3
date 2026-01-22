
import sqlite3
import os

# Absolute path to ensure we hit the right DB
db_path = r'd:\dsuth10\My Documents\Coding projects\Timetable-3\backend\instance\timetable.db'
print(f"Connecting to database at {db_path}")

if not os.path.exists(db_path):
    print("DATABASE FILE DOES NOT EXIST!")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables found: {[t[0] for t in tables]}")
        
        if ('teacher_aides',) in tables:
            print("\nSchema for teacher_aides:")
            cursor.execute("PRAGMA table_info(teacher_aides)")
            columns = cursor.fetchall()
            for col in columns:
                print(col)
        else:
            print("\nTable 'teacher_aides' NOT found.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")
