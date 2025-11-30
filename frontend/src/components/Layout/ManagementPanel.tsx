import { useState } from 'react';
import {
  SwipeableDrawer,
  Box,
  Tabs,
  Tab,
  IconButton,
  Paper,
} from '@mui/material';
import {
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import ErrorBoundary from '../ErrorBoundary';

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

type ManagementPanelProps = {
  aidesContent: React.ReactNode;
  tasksContent: React.ReactNode;
  requestsContent: React.ReactNode;
  classroomsContent: React.ReactNode;
};

export default function ManagementPanel({
  aidesContent,
  tasksContent,
  requestsContent,
  classroomsContent,
}: ManagementPanelProps) {
  const [open, setOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const toggleDrawer = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <>
      {/* Toggle Button - Always visible at bottom */}
      {!open && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
            borderRadius: '8px 8px 0 0',
            boxShadow: 3,
          }}
        >
          <IconButton
            onClick={() => toggleDrawer(true)}
            sx={{ px: 4, borderRadius: '8px 8px 0 0' }}
          >
            <KeyboardArrowUp />
          </IconButton>
        </Paper>
      )}

      {/* Swipeable Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={() => toggleDrawer(false)}
        onOpen={() => toggleDrawer(true)}
        swipeAreaWidth={56}
        disableSwipeToOpen={false}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            height: '60vh',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header with Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Tabs value={tabIndex} onChange={handleTabChange} sx={{ flex: 1 }}>
              <Tab label="Aides" id="management-tab-0" />
              <Tab label="Tasks" id="management-tab-1" />
              <Tab label="Requests" id="management-tab-2" />
              <Tab label="Classes" id="management-tab-3" />
            </Tabs>
            <IconButton onClick={() => toggleDrawer(false)} sx={{ mr: 1 }}>
              <KeyboardArrowDown />
            </IconButton>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <TabPanel value={tabIndex} index={0}>
              <ErrorBoundary>{aidesContent}</ErrorBoundary>
            </TabPanel>
            <TabPanel value={tabIndex} index={1}>
              <ErrorBoundary>{tasksContent}</ErrorBoundary>
            </TabPanel>
            <TabPanel value={tabIndex} index={2}>
              <ErrorBoundary>{requestsContent}</ErrorBoundary>
            </TabPanel>
            <TabPanel value={tabIndex} index={3}>
              <ErrorBoundary>{classroomsContent}</ErrorBoundary>
            </TabPanel>
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
}
