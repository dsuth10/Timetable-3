# Troubleshooting: Backup Import

This guide helps you resolve common issues when importing backup files into the Timetable application.

## Common Errors

### E001: Invalid file format
**Symptoms**: Validation fails with "Invalid file format".
**Causes**:
- The file extension does not match the content.
- The file is corrupted.
**Solutions**:
- Ensure you selected the correct format in the dropdown.
- Check if the file can be opened with a standard tool (e.g., a ZIP viewer for .zip files, a text editor for .json or .sql).

### E002: File exceeds 100MB limit
**Symptoms**: Upload is rejected or fails with size error.
**Causes**:
- The backup file is too large for the system to process in a single request.
**Solutions**:
- Use a more compressed format like `Compressed SQLite (.db.gz)`.
- If the data is truly massive, contact support for manual restoration.

### E003: Database not empty
**Symptoms**: Import is blocked with message "Database is not empty".
**Causes**:
- The application already has data. Import is only allowed on fresh installations to prevent accidental overwrites.
**Solutions**:
- Reset the database to a fresh state before importing.
- If you are testing, you can delete `backend/instance/timetable.db` and run `flask db upgrade`.

### E004: Missing required table
**Symptoms**: Validation fails with "Missing required table: {table}".
**Causes**:
- The backup file was created with an older version or is incomplete.
**Solutions**:
- Ensure the backup was created using the same application.
- If possible, create a new backup from the source.

### I003: Database locked
**Symptoms**: Import fails with "Database is locked" or "Database busy".
**Causes**:
- Another process (like a SQLite viewer or another application instance) is using the database file.
**Solutions**:
- Close all other applications that might be using the database.
- Restart the Flask server and try again.

## Getting Help
If you encounter an error not listed here, please check the backend logs for detailed error messages and report the issue to the development team.
