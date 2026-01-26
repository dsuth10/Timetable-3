# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-01-26

### Added
- **Robust Export and Import System**:
  - Support for importing backups in SQL, JSON, CSV, and Compressed SQLite formats.
  - Multi-stage validation pipeline (Format, Schema, Data Types, Referential Integrity).
  - Atomic import process with automatic rollback on failure.
  - New "Database Management" UI with Export and Import tabs.
  - Real-time progress tracking for import operations.
  - Database emptiness check to prevent accidental data overwrites.
  - Comprehensive documentation for API and troubleshooting.

### Fixed
- Verified and ensured all 4 export formats are producing valid backups.
- Improved error handling during backup generation.

### Changed
- Refactored `BackupService` to support both export and import.
- Updated `BackupManagement` component with a tabbed interface.
