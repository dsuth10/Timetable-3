import { useState } from 'react';
import {
  Drawer,
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
      {/* Toggle Button - Now part of layout, not fixed */}
      {!open && (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            zIndex: 1200,
            boxShadow: '0 -2px 5px rgba(0,0,0,0.1)',
          }}
        >
          <Paper
            elevation={2}
            sx={{
              borderRadius: '8px 8px 0 0',
              bgcolor: 'background.paper',
              mt: -1,
              border: 1,
              borderBottom: 0,
              borderColor: 'divider',
            }}
          >
            <IconButton
              onClick={() => toggleDrawer(true)}
              sx={{ px: 4, borderRadius: '8px 8px 0 0' }}
              title="Open Management Panel"
            >
              <KeyboardArrowUp />
            </IconButton>
          </Paper>
        </Box>
      )}

      {/* Drawer */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => toggleDrawer(false)}
        ModalProps={{}}
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
      </Drawer>
    </>
  );
}

