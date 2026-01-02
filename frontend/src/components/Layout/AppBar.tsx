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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Today,
  Add as AddIcon,
  Settings as SettingsIcon,
  CalendarMonth,
  School,
  Person,
  Home as HomeIcon,
  ViewDay,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { isWeekend, format } from 'date-fns';
import { useUiStore } from '../../store/stores/uiStore';
import joshuaIcon from '../../assets/images/joshua-icon.png';

type AppBarProps = {
  onMenuClick: () => void;
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
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
}: AppBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { getWeekNumber, getWeekDateRange, setWeekStart, viewMode, setViewMode } = useUiStore();
  const [datePickerAnchor, setDatePickerAnchor] = useState<HTMLButtonElement | null>(null);

  const isDailyView = location.pathname === '/daily';
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
      const dateStr = String(date.getFullYear()) + '-' + 
                     String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(date.getDate()).padStart(2, '0');
      
      if (isDailyView) {
        // If in daily view, navigate to the specific date
        navigate(`/daily?date=${dateStr}`);
      } else {
        const monday = getMonday(date);
        const year = monday.getFullYear();
        const month = String(monday.getMonth() + 1).padStart(2, '0');
        const day = String(monday.getDate()).padStart(2, '0');
        const mondayISO = `${year}-${month}-${day}`;
        setWeekStart(mondayISO);
      }
      handleDatePickerClose();
    }
  };

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'AIDE' | 'CLASS' | 'DAILY' | null,
  ) => {
    if (newView !== null) {
      if (newView === 'DAILY') {
        navigate('/daily');
      } else {
        setViewMode(newView);
        navigate('/schedule');
      }
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
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Home Button */}
        <IconButton
          color="inherit"
          aria-label="home"
          onClick={() => navigate('/')}
          sx={{ mr: 1 }}
        >
          <HomeIcon />
        </IconButton>

        {/* CHARLOTTE Icon (Static) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mr: 1,
            ml: 0.5
          }}
        >
          <Box
            component="img"
            src={joshuaIcon}
            alt="CHARLOTTE Icon"
            sx={{
              width: 32,
              height: 32,
              objectFit: 'contain'
            }}
          />
        </Box>

        <Typography variant="h6" component="div" sx={{ mr: 4, fontWeight: 'bold' }}>
          CHARLOTTE
        </Typography>

        <ToggleButtonGroup
          value={location.pathname === '/daily' ? 'DAILY' : viewMode}
          exclusive
          onChange={handleViewChange}
          aria-label="view mode"
          size="small"
          sx={{
            mr: 4,
            bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.3)',
              '&.Mui-selected': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.3)',
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              }
            }
          }}
        >
          <ToggleButton value="AIDE" aria-label="aide view">
            <Person sx={{ mr: 1, fontSize: 20 }} />
            Aides
          </ToggleButton>
          <ToggleButton value="CLASS" aria-label="class view">
            <School sx={{ mr: 1, fontSize: 20 }} />
            Classes
          </ToggleButton>
          <ToggleButton value="DAILY" aria-label="daily view">
            <ViewDay sx={{ mr: 1, fontSize: 20 }} />
            Daily
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Center: Week Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <ButtonGroup variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
            <IconButton
              onClick={onPrevWeek}
              size="small"
              sx={{ color: 'white' }}
              data-testid="nav-prev"
              aria-label={isDailyView ? "Previous day" : "Previous week"}
            >
              <ChevronLeft />
            </IconButton>
            <Button
              onClick={onToday}
              sx={{ color: 'white', minWidth: 80 }}
              data-testid="nav-today"
              aria-label={isDailyView ? "Today" : "Jump to current week"}
            >
              <Today sx={{ mr: 0.5, fontSize: 18 }} />
              Today
            </Button>
            <IconButton
              onClick={onNextWeek}
              size="small"
              sx={{ color: 'white' }}
              data-testid="nav-next"
              aria-label={isDailyView ? "Next day" : "Next week"}
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
            aria-label={isDailyView ? "Select a specific date" : "Select a specific week"}
          >
            {isDailyView ? "Jump to Date" : "Jump to Week"}
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
              {isDailyView 
                ? format(new Date(weekLabel + 'T00:00:00'), 'EEEE, MMM d, yyyy')
                : dateRange
              }
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
              shouldDisableDate={(date: Date) => isWeekend(date)}
            />
          </LocalizationProvider>
        </Popover>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" aria-label="settings">
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}

