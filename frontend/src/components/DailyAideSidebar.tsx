import { Box, Paper, Typography, IconButton, Tooltip, Avatar, Chip } from '@mui/material';
import { Edit, Visibility, Book } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek } from 'date-fns';
import type { AideWithStatus, TeacherAide, Weekday } from '../types';

type Props = {
    aides: AideWithStatus[];
    date: string;
    onEditAide: (aide: TeacherAide) => void;
};

export default function DailyAideSidebar({ aides, date, onEditAide }: Props) {
    const navigate = useNavigate();

    const handleViewSchedule = (aideId: number) => {
        // Calculate start of the week for the given date (assuming Monday start)
        const currentDate = new Date(date);
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekParam = format(weekStart, 'yyyy-MM-dd');

        navigate(`/schedule?aideId=${aideId}&week=${weekParam}&view=AIDE`);
    };

    return (
        <Paper
            elevation={3}
            sx={{
                width: 280,
                display: 'flex',
                flexDirection: 'column',
                borderRight: 1,
                borderColor: 'divider',
                zIndex: 10,
                overflow: 'hidden',
                bgcolor: 'background.paper'
            }}
        >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" component="h2">
                    Staff
                </Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {aides.map((aide) => (
                    <Box
                        key={aide.id}
                        sx={{
                            p: 2,
                            borderBottom: 1,
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            bgcolor: aide.is_absent ? 'action.hover' : 'transparent',
                            opacity: aide.is_absent ? 0.7 : 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                                sx={{
                                    bgcolor: aide.colour_hex,
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: '#fff'
                                }}
                            >
                                {aide.name.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" noWrap>
                                    {aide.name}
                                </Typography>
                                {aide.details && (
                                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                                        {aide.details}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {aide.is_absent && (
                            <Chip label="Absent" color="error" size="small" sx={{ alignSelf: 'start' }} />
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, mt: 0.5 }}>
                            <Tooltip title="Edit Details & Availability">
                                <IconButton
                                    size="small"
                                    onClick={() => onEditAide(aide)}
                                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                                >
                                    <Edit fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="View Weekly Schedule">
                                <IconButton
                                    size="small"
                                    onClick={() => handleViewSchedule(aide.id)}
                                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                                >
                                    <Visibility fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Detailed Task Editor (Coming Soon)">
                                <IconButton
                                    size="small"
                                    disabled
                                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                                >
                                    <Book fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                ))}
                {aides.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            No staff found
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
