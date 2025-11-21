import { useState } from 'react';
import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Button,
  Box,
  ButtonGroup,
  Popover,
  Stack,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Today,
  Add as AddIcon,
  Settings as SettingsIcon,
  CalendarMonth,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useUiStore } from '../../store/stores/uiStore';

type AppBarProps = {
  onMenuClick: () => void;
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onCreateTask: () => void;
};

// Helper to get Monday of any given date
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday (1), handle Sunday (0)
  date.setDate(date.getDate() + diff);
  return date;
}

export default function AppBar({
  onMenuClick,
  weekLabel,
  onPrevWeek,
  onNextWeek,
  onToday,
  onCreateTask,
}: AppBarProps) {
  const { getWeekNumber, getWeekDateRange, setWeekStart } = useUiStore();
  const [datePickerAnchor, setDatePickerAnchor] = useState<HTMLButtonElement | null>(null);
  
  const weekNumber = getWeekNumber(weekLabel);
  const dateRange = getWeekDateRange(weekLabel);
  
  const handleDatePickerOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDatePickerAnchor(event.currentTarget);
  };
  
  const handleDatePickerClose = () => {
    setDatePickerAnchor(null);
  };
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      const monday = getMonday(date);
      // Use local time components to avoid timezone shifts
      const year = monday.getFullYear();
      const month = String(monday.getMonth() + 1).padStart(2, '0');
      const day = String(monday.getDate()).padStart(2, '0');
      const mondayISO = `${year}-${month}-${day}`;
      setWeekStart(mondayISO);
      handleDatePickerClose();
    }
  };
  
  const datePickerOpen = Boolean(datePickerAnchor);
  return (
    <MuiAppBar position="static" elevation={1}>
      <Toolbar>
        {/* Left: Menu and Title */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ mr: 4 }}>
          Aide Scheduler
        </Typography>

        {/* Center: Week Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <ButtonGroup variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
            <IconButton 
              onClick={onPrevWeek} 
              size="small" 
              sx={{ color: 'white' }}
              data-testid="nav-prev"
              aria-label="Previous week"
            >
              <ChevronLeft />
            </IconButton>
            <Button 
              onClick={onToday} 
              sx={{ color: 'white', minWidth: 80 }}
              data-testid="nav-today"
              aria-label="Jump to current week"
            >
              <Today sx={{ mr: 0.5, fontSize: 18 }} />
              Today
            </Button>
            <IconButton 
              onClick={onNextWeek} 
              size="small" 
              sx={{ color: 'white' }}
              data-testid="nav-next"
              aria-label="Next week"
            >
              <ChevronRight />
            </IconButton>
          </ButtonGroup>
          
          <Button
            onClick={handleDatePickerOpen}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              textTransform: 'none',
              px: 2,
            }}
            startIcon={<CalendarMonth />}
            data-testid="date-picker-button"
            aria-label="Select a specific week"
          >
            Jump to Week
          </Button>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={`Week ${weekNumber}`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            />
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              {dateRange}
            </Typography>
          </Stack>
        </Box>
        
        {/* Date Picker Popover */}
        <Popover
          open={datePickerOpen}
          anchorEl={datePickerAnchor}
          onClose={handleDatePickerClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              value={new Date(weekLabel + 'T00:00:00')}
              onChange={handleDateChange}
              showDaysOutsideCurrentMonth
            />
          </LocalizationProvider>
        </Popover>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={onCreateTask}
            data-testid="create-task-btn"
          >
            Create Task
          </Button>
          <IconButton color="inherit" aria-label="settings">
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}

