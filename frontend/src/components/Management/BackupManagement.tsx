import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  Stack,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { 
  Backup as BackupIcon, 
  Download as DownloadIcon, 
  Upload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { backupService } from '../../services/backupService';
import type { BackupFormat, BackupResponse, BackupProgress } from '../../types/backup';

export default function BackupManagement() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Export states
  const [selectedFormat, setSelectedFormat] = useState<BackupFormat>('sql');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [backupResponse, setBackupResponse] = useState<BackupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stopPolling, setStopPolling] = useState<(() => void) | null>(null);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [dbEmpty, setDbEmpty] = useState<{ is_empty: boolean; non_empty_tables: string[] } | null>(null);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      const status = await backupService.checkDatabaseEmpty();
      setDbEmpty(status);
    } catch (err) {
      console.error('Failed to check database status', err);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setImportError(null);
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setError(null);
    setProgress(null);
    setBackupResponse(null);

    try {
      // Create backup
      const response = await backupService.createBackup({ format: selectedFormat });
      
      if (response.status === 'failed') {
        setError(response.error || 'Backup creation failed');
        setLoading(false);
        return;
      }

      // If backup completed immediately (small database), set response
      if (response.status === 'completed') {
        setBackupResponse(response);
        setProgress({
          backup_id: response.backup_id,
          progress_percent: 100,
          status: 'completed',
        });
        setLoading(false);
        return;
      }

      // Otherwise, start polling for progress
      const stop = backupService.pollBackupProgress(
        response.backup_id,
        (progressUpdate) => {
          setProgress(progressUpdate);
        },
        (finalResponse) => {
          setBackupResponse(finalResponse);
          setLoading(false);
        },
        (err) => {
          setError(err.message || 'Backup failed');
          setLoading(false);
        },
        1000 // Poll every 1 second
      );

      setStopPolling(() => stop);
    } catch (err: any) {
      setError(err.message || 'Failed to create backup');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleCreateBackup();
  };

  const handleDownload = async () => {
    if (!backupResponse?.download_url || !backupResponse.filename) return;

    try {
      await backupService.downloadBackup(backupResponse.backup_id, backupResponse.filename);
    } catch (err: any) {
      setError(err.message || 'Failed to download backup');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation
      if (file.size > 100 * 1024 * 1024) {
        setImportError("File exceeds 100MB limit. Please use a smaller backup file.");
        return;
      }
      
      setImportFile(file);
      setImportError(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    setImportLoading(true);
    setImportError(null);
    setImportProgress({ status: 'starting', progress_percent: 0 });

    try {
      // Auto-detect format from extension
      const ext = importFile.name.split('.').pop()?.toLowerCase();
      let format: BackupFormat = 'json';
      if (ext === 'sql') format = 'sql';
      else if (ext === 'zip') format = 'csv';
      else if (ext === 'gz') format = 'sqlite_gz';

      const response = await backupService.importBackup(importFile, format);
      
      if (response.status === 'failed') {
        setImportError(response.error || 'Import failed');
        setImportLoading(false);
        return;
      }

      // Poll for progress
      const stop = backupService.pollImportProgress(
        response.import_id,
        (progressUpdate) => {
          setImportProgress(progressUpdate);
          if (progressUpdate.status === 'completed' || progressUpdate.status === 'failed') {
            setImportLoading(false);
            if (progressUpdate.status === 'completed') {
              // Refresh database status
              checkDatabase();
            }
          }
        },
        (err) => {
          setImportError(err.message || 'Import failed');
          setImportLoading(false);
        }
      );

      // Cleanup
      return () => stop();
    } catch (err: any) {
      setImportError(err.message || 'Failed to start import');
      setImportLoading(false);
    }
  };

  // Cleanup polling on unmount
  const handleStopPolling = () => {
    if (stopPolling) {
      stopPolling();
      setStopPolling(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Database Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="backup tabs">
          <Tab label="Export Backup" id="backup-tab-0" />
          <Tab label="Import Backup" id="backup-tab-1" />
        </Tabs>
      </Box>

      {/* Tab 0: Export */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Create a complete backup of all your timetable data. Select a format and click Create Backup.
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="backup-format-label">Backup Format</InputLabel>
            <Select
              labelId="backup-format-label"
              id="backup-format-select"
              value={selectedFormat}
              label="Backup Format"
              onChange={(e) => setSelectedFormat(e.target.value as BackupFormat)}
              disabled={loading}
            >
              <MenuItem value="sql">SQL Dump (.sql)</MenuItem>
              <MenuItem value="json">JSON Export (.json)</MenuItem>
              <MenuItem value="csv">CSV Collection (.zip)</MenuItem>
              <MenuItem value="sqlite_gz">Compressed SQLite (.db.gz)</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <BackupIcon />}
            onClick={handleCreateBackup}
            disabled={loading}
            fullWidth
            size="large"
          >
            {loading ? 'Creating Backup...' : 'Create Backup'}
          </Button>

          {progress && progress.status !== 'completed' && progress.status !== 'failed' && (
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {progress.current_step || 'Creating backup...'}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress.progress_percent} 
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'right' }}>
                    {progress.progress_percent}%
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {backupResponse && backupResponse.status === 'completed' && (
            <Alert severity="success">
              <Typography variant="body2" gutterBottom>
                Backup created successfully!
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                File: {backupResponse.filename}
              </Typography>
              <Typography variant="caption" display="block">
                Size: {(backupResponse.size_bytes / 1024).toFixed(2)} KB
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mt: 2 }}
                fullWidth
              >
                Download Backup
              </Button>
            </Alert>
          )}

          {error && (
            <Alert 
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={handleRetry}>
                  Retry
                </Button>
              }
            >
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}
        </Stack>
      )}

      {/* Tab 1: Import */}
      {activeTab === 1 && (
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Restore timetable data from a backup file. <strong>Warning:</strong> Import is only allowed on fresh installations.
          </Typography>

          {dbEmpty && !dbEmpty.is_empty && (
            <Alert severity="warning">
              <Typography variant="body2">
                Database is not empty. Found data in: {dbEmpty.non_empty_tables.join(', ')}.
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Please reset the database to a fresh state before importing.
              </Typography>
            </Alert>
          )}

          <Box>
            <input
              accept=".sql,.json,.zip,.gz"
              style={{ display: 'none' }}
              id="import-file-upload"
              type="file"
              onChange={handleFileChange}
              disabled={importLoading || (dbEmpty !== null && !dbEmpty.is_empty)}
            />
            <label htmlFor="import-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                size="large"
                disabled={importLoading || (dbEmpty !== null && !dbEmpty.is_empty)}
              >
                {importFile ? importFile.name : 'Select Backup File'}
              </Button>
            </label>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={!importFile || importLoading || (dbEmpty !== null && !dbEmpty.is_empty)}
            fullWidth
            size="large"
          >
            {importLoading ? 'Importing...' : 'Start Import'}
          </Button>

          {importProgress && importProgress.status !== 'completed' && importProgress.status !== 'failed' && (
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {importProgress.current_step || 'Importing...'}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={importProgress.progress_percent} 
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'right' }}>
                    {importProgress.progress_percent}%
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {importProgress && importProgress.status === 'completed' && (
            <Alert severity="success" icon={<SuccessIcon />}>
              <Typography variant="body2">
                Import completed successfully!
              </Typography>
              {importProgress.records_imported && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" display="block">
                    Imported records:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {Object.entries(importProgress.records_imported).map(([table, count]) => (
                      <li key={table}><Typography variant="caption">{table}: {count as number}</Typography></li>
                    ))}
                  </ul>
                </Box>
              )}
            </Alert>
          )}

          {importError && (
            <Alert severity="error" icon={<ErrorIcon />}>
              <Typography variant="body2">{importError}</Typography>
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );
}






















