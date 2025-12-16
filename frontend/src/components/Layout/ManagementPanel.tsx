import { useState, useEffect, useRef } from 'react';
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
  classroomsContent: React.ReactNode;
  backupContent: React.ReactNode;
};

export default function ManagementPanel({
  aidesContent,
  tasksContent,
  classroomsContent,
  backupContent,
}: ManagementPanelProps) {
  const [open, setOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const paperRef = useRef<HTMLDivElement>(null);

  const toggleDrawer = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Fix accessibility: Ensure modal root doesn't have aria-hidden when drawer content is focused
  useEffect(() => {
    if (open) {
      // Find the modal root element and ensure it doesn't incorrectly set aria-hidden
      // when the drawer content (which is a child) receives focus
      const timer = setTimeout(() => {
        // Find the modal root by searching from the paper element or by class
        const modalRoot = paperRef.current?.closest('.MuiModal-root') || 
                          document.querySelector('.MuiDrawer-root.MuiModal-root');
        if (modalRoot) {
          // Remove aria-hidden from modal root - the drawer content should be accessible
          // Material-UI sets this, but it causes issues when drawer content is focused
          modalRoot.removeAttribute('aria-hidden');
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [open]);

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
          // Fix accessibility: ensure modal properly manages aria-hidden
          disableEnforceFocus: false,
          disableAutoFocus: false,
        }}
        PaperProps={{
          ref: paperRef,
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
              <Tab label="Classes" id="management-tab-2" />
              <Tab label="Backup" id="management-tab-3" />
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
              <ErrorBoundary>{classroomsContent}</ErrorBoundary>
            </TabPanel>
            <TabPanel value={tabIndex} index={3}>
              <ErrorBoundary>{backupContent}</ErrorBoundary>
            </TabPanel>
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
}
