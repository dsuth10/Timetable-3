import { useState } from 'react';
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
} from '@mui/material';
import { Backup as BackupIcon, Download as DownloadIcon } from '@mui/icons-material';
import { backupService } from '../../services/backupService';
import type { BackupFormat, BackupResponse, BackupProgress } from '../../types/backup';

export default function BackupManagement() {
  const [selectedFormat, setSelectedFormat] = useState<BackupFormat>('sql');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [backupResponse, setBackupResponse] = useState<BackupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stopPolling, setStopPolling] = useState<(() => void) | null>(null);

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

  // Cleanup polling on unmount
  const handleStopPolling = () => {
    if (stopPolling) {
      stopPolling();
      setStopPolling(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h6" component="h2">
          Database Backup
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Create a complete backup of all your timetable data. Select a format and click Create Backup.
        </Typography>

        {/* Format Selection */}
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

        {/* Create Backup Button */}
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

        {/* Progress Indicator */}
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

        {/* Success Message */}
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

        {/* Error Message */}
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
    </Box>
  );
}









