import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  Avatar,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Paper
} from '@mui/material';
import {
  School as SchoolIcon,
  Groups as GroupsIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useAidesStore } from '../store/stores/aides';
import { useClassroomsStore } from '../store/stores/classrooms';
import { useUiStore } from '../store/stores/uiStore';
import ManagementPanel from '../components/Layout/ManagementPanel';
import AidesManagement from '../components/Management/AidesManagement';
import TasksManagement from '../components/Management/TasksManagement';
import RequestsManagement from '../components/Management/RequestsManagement';
import ClassroomsManagement from '../components/Management/ClassroomsManagement';

// Helper to generate initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function Home() {
  const navigate = useNavigate();
  const { aides, fetchAides } = useAidesStore();
  const { classrooms, fetchClassrooms } = useClassroomsStore();
  const { setViewMode, setSelectedClassId } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAides();
    fetchClassrooms();
  }, [fetchAides, fetchClassrooms]);

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classrooms, searchTerm]);

  const filteredAides = useMemo(() => {
    return aides.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [aides, searchTerm]);

  const handleClassClick = (id: number) => {
    setSelectedClassId(id);
    setViewMode('CLASS');
    navigate('/schedule');
  };

  const handleAideClick = (id: number) => {
    setViewMode('AIDE');
    navigate(`/schedule?aideId=${id}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 2, md: 5 },
          py: 1.5
        }}
      >
        <Box sx={{ maxWidth: 1440, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.primary' }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                bgcolor: 'rgba(44, 9, 127, 0.1)', // primary/10
                color: 'primary.main',
                borderRadius: 1
              }}>
                <ScheduleIcon />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ display: { xs: 'none', sm: 'block' } }}>
                TA Manager
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'block' }, width: 300 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search classes or aides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { bgcolor: 'action.hover', border: 'none', '& fieldset': { border: 'none' }, borderRadius: 2 }
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
              <SettingsIcon />
            </IconButton>
            <IconButton size="small" sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
              <NotificationsIcon />
            </IconButton>
            <Avatar sx={{ width: 40, height: 40, border: '2px solid', borderColor: 'background.paper' }} />
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: 4, flex: 1, pb: 10 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' }, justifyContent: 'space-between', gap: 3, mb: 5 }}>
          <Box>
            <Typography variant="h3" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Welcome back, Admin
            </Typography>
            <Typography color="text.secondary" variant="body1">
              Manage class allocations and teacher aide rosters from your dashboard.
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={6}>
          {/* Class Allocations Column */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" /> Class Allocations
              </Typography>
              {/* Could add filter dropdown here if needed */}
            </Box>

            <Grid container spacing={2}>
              {filteredClassrooms.map((classroom) => (
                <Grid item xs={12} sm={6} xl={4} key={classroom.id}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', boxShadow: 2, transform: 'translateY(-2px)' }
                    }}
                  >
                    <CardActionArea onClick={() => handleClassClick(classroom.id)} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" noWrap>
                          {classroom.name}
                        </Typography>
                        <Box sx={{ bgcolor: 'primary.50', color: 'primary.main', p: 0.5, borderRadius: '50%', display: 'flex' }}>
                          <ArrowForwardIcon sx={{ fontSize: 14 }} />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap gutterBottom>
                        {classroom.teacher}
                      </Typography>

                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Placeholder for aide avatars - in real app would need to fetch assignments count */}
                        <Box sx={{ display: 'flex', mr: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'grey.300' }}>?</Avatar>
                        </Box>
                        <Chip label="View" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Staff Rosters Column */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupsIcon color="primary" /> Staff Rosters
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredAides.map((aide) => (
                <Card
                  key={aide.id}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleAideClick(aide.id)}
                    sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}
                  >
                    <Box sx={{ position: 'relative', mr: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: aide.colour_hex || 'primary.main',
                          color: 'white', // Ensure contrast
                          fontWeight: 'bold'
                        }}
                      >
                        {getInitials(aide.name)}
                      </Avatar>
                      {/* Availability indicator could go here */}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {aide.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {aide.details || "No details provided"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1 }}>
                      <ArrowForwardIcon color="action" />
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Bottom Management Panel */}
      <ManagementPanel
        aidesContent={<AidesManagement />}
        tasksContent={<TasksManagement />}
        requestsContent={<RequestsManagement />}
        classroomsContent={<ClassroomsManagement />}
      />
    </Box>
  );
}
