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
  aidesContent?: React.ReactNode;
  classroomsContent?: React.ReactNode;
  tasksContent?: React.ReactNode;
  requestsContent?: React.ReactNode;
  backupContent?: React.ReactNode;
};

export default function ManagementPanel({
  aidesContent,
  classroomsContent,
  tasksContent,
  requestsContent,
  backupContent,
}: ManagementPanelProps) {
  const [open, setOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const tabs = [
    { label: 'Aides', content: aidesContent },
    { label: 'Classes', content: classroomsContent },
    { label: 'Tasks', content: tasksContent },
    { label: 'Requests', content: requestsContent },
    { label: 'Backup', content: backupContent },
  ].filter(tab => tab.content !== undefined);

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
              {tabs.map((tab, index) => (
                <Tab key={tab.label} label={tab.label} id={`management-tab-${index}`} />
              ))}
            </Tabs>
            <IconButton onClick={() => toggleDrawer(false)} sx={{ mr: 1 }}>
              <KeyboardArrowDown />
            </IconButton>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {tabs.map((tab, index) => (
              <TabPanel key={tab.label} value={tabIndex} index={index}>
                <ErrorBoundary>{tab.content}</ErrorBoundary>
              </TabPanel>
            ))}
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
}

