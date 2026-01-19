import { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert,
    CircularProgress
} from '@mui/material';
import { Warning as WarningIcon, DeleteForever as DeleteIcon } from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import { useUiStore } from '../../store/stores/uiStore';

export default function AdminPanel() {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleResetClick = () => {
        setConfirmOpen(true);
    };

    const handleClose = () => {
        setConfirmOpen(false);
        setError(null);
    };

    const handleConfirmReset = async () => {
        setLoading(true);
        setError(null);
        try {
            await adminApi.resetDb();
            setSuccessMessage('Database has been successfully reset to a clean slate.');
            setConfirmOpen(false);

            // Reload the page after a short delay to clear all state
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Failed to reset database');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                System Administration
            </Typography>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'error.light', bgcolor: 'error.lighter' }}>
                <Typography variant="h6" color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon /> Danger Zone
                </Typography>

                <Typography paragraph>
                    Resetting the database will permanently delete all data, including aides, classes, tasks, and assignments.
                    There is no way to undo this action.
                </Typography>

                <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleResetClick}
                    disabled={loading || !!successMessage}
                >
                    Reset Database to Clean Slate
                </Button>
            </Paper>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title" sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon /> Confirm Database Reset
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you absolutely sure you want to proceed?
                        <br /><br />
                        This action will <strong>permanently delete all data</strong> in the database.
                        <br />
                        You will be starting with a completely empty state.
                        <br /><br />
                        This action <strong>cannot be undone</strong>.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmReset}
                        color="error"
                        variant="contained"
                        autoFocus
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                    >
                        {loading ? 'Resetting...' : 'Delete Everything'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
