import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { classroomsApi } from '../../services/classroomsApi';
import type { TaskCategory, Classroom } from '../../types';
import { categoryColors } from '../../theme/theme';
import { useTimeUtils } from '../TimetableGrid/timeUtils';
import { useRequestsStore } from '../../store/stores/requests';

type Props = {
    open: boolean;
    onClose: () => void;
};

const CATEGORIES: { value: TaskCategory; label: string }[] = [
    { value: 'PLAYGROUND', label: 'Playground' },
    { value: 'CLASS_SUPPORT', label: 'Class Support' },
    { value: 'GROUP_SUPPORT', label: 'Group Support' },
    { value: 'INDIVIDUAL_SUPPORT', label: 'Individual Support' },
];

export default function RequestCreateModal({ open, onClose }: Props) {
    const { generateAllTimeSlots } = useTimeUtils();
    const { createRequest } = useRequestsStore();

    const [teacher, setTeacher] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<TaskCategory>('CLASS_SUPPORT');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState<string>('09:00');
    const [classroomId, setClassroomId] = useState<number | null>(null);
    const [notes, setNotes] = useState('');

    const [error, setError] = useState<string | undefined>();
    const [busy, setBusy] = useState(false);

    // Classrooms
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loadingClassrooms, setLoadingClassrooms] = useState(false);

    const timeSlots = useMemo(() => generateAllTimeSlots(), [generateAllTimeSlots]);

    useEffect(() => {
        if (open) {
            setLoadingClassrooms(true);
            classroomsApi.list()
                .then(setClassrooms)
                .catch(() => setClassrooms([]))
                .finally(() => setLoadingClassrooms(false));
        }
    }, [open]);

    const handleClose = () => {
        if (!busy) {
            setTeacher('');
            setTitle('');
            setCategory('CLASS_SUPPORT');
            setDate(new Date().toISOString().split('T')[0]);
            setTime('09:00');
            setClassroomId(null);
            setNotes('');
            setError(undefined);
            onClose();
        }
    };

    async function submit() {
        if (!teacher || !title || !date || !time) {
            setError('Please fill in all required fields');
            return;
        }

        setBusy(true);
        setError(undefined);

        try {
            await createRequest({
                requesting_teacher: teacher,
                task_title: title,
                task_category: category,
                preferred_date: date,
                preferred_time: `${time}:00`,
                classroom_id: classroomId,
                notes: notes || null
            });
            handleClose();
        } catch (e: any) {
            setError(e.message || 'Failed to create request');
        } finally {
            setBusy(false);
        }
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="primary" />
                    New Teacher Request
                </Box>
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Your Name (Teacher)"
                        value={teacher}
                        onChange={(e) => setTeacher(e.target.value)}
                        fullWidth
                        required
                        autoFocus
                    />

                    <TextField
                        label="Task Title / Description"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        placeholder="e.g., Reading support for small group"
                    />

                    <FormControl fullWidth required>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={category}
                            label="Category"
                            onChange={(e) => setCategory(e.target.value as TaskCategory)}
                        >
                            {CATEGORIES.map(cat => (
                                <MenuItem key={cat.value} value={cat.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                bgcolor: categoryColors[cat.value],
                                            }}
                                        />
                                        {cat.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Preferred Time</InputLabel>
                            <Select
                                value={time}
                                label="Preferred Time"
                                onChange={(e) => setTime(e.target.value)}
                            >
                                {timeSlots.map(t => (
                                    <MenuItem key={t} value={t}>
                                        {t}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <FormControl fullWidth>
                        <InputLabel>Classroom (Optional)</InputLabel>
                        <Select
                            value={classroomId || ''}
                            label="Classroom (Optional)"
                            onChange={(e) => setClassroomId(e.target.value ? Number(e.target.value) : null)}
                            disabled={loadingClassrooms}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {classrooms.map(classroom => (
                                <MenuItem key={classroom.id} value={classroom.id}>
                                    {classroom.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Additional Notes (Optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Any specific requirements or details..."
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={busy}>
                    Cancel
                </Button>
                <Button
                    onClick={submit}
                    disabled={busy || !teacher.trim() || !title.trim()}
                    variant="contained"
                    startIcon={busy ? <CircularProgress size={16} /> : <AddIcon />}
                >
                    Submit Request
                </Button>
            </DialogActions>
        </Dialog>
    );
}
