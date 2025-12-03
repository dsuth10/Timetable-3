import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  Divider,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import { Search, ExpandMore, AssignmentLate, Inventory, PersonOff } from '@mui/icons-material';
import { Droppable } from '@hello-pangea/dnd';
import { useTasksStore } from '../../../store/stores/tasks';
import { useAidesStore } from '../../../store/stores/aides';
import { useReliefPoolStore } from '../../../store/stores/reliefPool';
import { assignmentsApi } from '../../../services/assignmentsApi';
import type { Task, Assignment, ReliefPoolTask } from '../../../types';
import { TaskTemplateCard } from '../../TaskTemplateCard';
import LoadingState from '../../common/LoadingState';
import EmptyState from '../../common/EmptyState';
import ReliefPoolTab from './ReliefPoolTab';

type Props = {
  dateISO?: string;
  refreshTrigger?: number;
  onTaskDoubleClick?: (assignment: Assignment, task?: Task) => void;
};

const DRAWER_WIDTH = 320;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-bank-tabpanel-${index}`}
      aria-labelledby={`task-bank-tab-${index}`}
      style={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `task-bank-tab-${index}`,
    'aria-controls': `task-bank-tabpanel-${index}`,
  };
}

export default function TaskBank({ dateISO, refreshTrigger, onTaskDoubleClick }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { tasks, loading, error } = useTasksStore();
  const { aides } = useAidesStore();
  const { count: reliefPoolCount, fetchCount: fetchReliefPoolCount, dismiss } = useReliefPoolStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Fetch Relief Pool count on mount and periodically
  useEffect(() => {
    fetchReliefPoolCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchReliefPoolCount, 30000);
    return () => clearInterval(interval);
  }, [fetchReliefPoolCount]);

  // Fetch assignments for the current week
  useEffect(() => {
    if (!dateISO) return;
    
    assignmentsApi.weeklyMatrix(dateISO)
      .then((matrix: any) => {
        const allAssignments: Assignment[] = [];
        
        if (matrix?.matrix) {
          Object.entries(matrix.matrix).forEach(([, days]) => {
            Object.entries(days as Record<string, any>).forEach(([, assignments]) => {
              if (Array.isArray(assignments)) {
                allAssignments.push(...assignments);
              }
            });
          });
        }
        
        setAssignments(allAssignments);
      })
      .catch(() => {
        setAssignments([]);
      });
  }, [dateISO, refreshTrigger]);

  // Group tasks by category
  const groupedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (!searchQuery) return true;
      return task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             task.category.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const groups = new Map<string, Task[]>();
    filtered.forEach(task => {
      if (!groups.has(task.category)) {
        groups.set(task.category, []);
      }
      groups.get(task.category)!.push(task);
    });

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks, searchQuery]);

  // Handle Relief Pool task dismiss
  const handleDismiss = useCallback(async (task: ReliefPoolTask) => {
    try {
      await dismiss(task.id, { version: task.version });
    } catch (err) {
      console.error('Failed to dismiss task:', err);
      // Could show a toast here
    }
  }, [dismiss]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Tabs Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            aria-label="Task bank sections"
          >
            <Tab 
              icon={<Inventory fontSize="small" />}
              iconPosition="start"
              label="Task Bank"
              {...a11yProps(0)}
              sx={{ minHeight: 48, textTransform: 'none' }}
            />
            <Tab 
              icon={
                <Badge 
                  badgeContent={reliefPoolCount} 
                  color="warning"
                  max={99}
                >
                  <PersonOff fontSize="small" />
                </Badge>
              }
              iconPosition="start"
              label="Relief Pool"
              {...a11yProps(1)}
              sx={{ minHeight: 48, textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        {/* Task Bank Tab Content */}
        <TabPanel value={activeTab} index={0}>
          {/* Search */}
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              aria-label="Search tasks"
            />
          </Box>
          <Divider />

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {loading && <LoadingState variant="skeleton" rows={5} />}
            {error && (
              <Typography color="error" role="alert" sx={{ p: 2 }}>
                {error}
              </Typography>
            )}
            {!loading && !error && tasks.length === 0 && (
              <EmptyState
                icon={<AssignmentLate />}
                title="No Tasks"
                description="Create tasks to see them here."
              />
            )}
            {!loading && !error && groupedTasks.length === 0 && searchQuery && (
              <EmptyState
                title="No Results"
                description={`No tasks found matching "${searchQuery}"`}
              />
            )}
            
            {/* Droppable Area - Dropping here means "Unassign/Delete Assignment" */}
            <Droppable droppableId="unassigned">
              {(provided, snapshot) => {
                let globalIndex = 0; // Track index across all categories
                
                return (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ 
                      minHeight: '100%',
                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                      transition: 'background-color 0.2s',
                      borderRadius: 1,
                    }}
                  >
                    {!loading && !error && groupedTasks.map(([category, categoryTasks]) => (
                      <Accordion key={category} defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2" fontWeight={600}>
                            {category.replace(/_/g, ' ')}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ ml: 1, color: 'text.secondary' }}
                          >
                            ({categoryTasks.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 1 }}>
                          {categoryTasks.map((task, taskIndex) => {
                            const currentIndex = globalIndex++;
                            // Use combination of category, task.id, and index to ensure unique keys
                            const uniqueKey = `${category}-${task.id}-${taskIndex}`;
                            return (
                              <Box key={uniqueKey}>
                                <TaskTemplateCard
                                  task={task}
                                  index={currentIndex}
                                  assignments={assignments}
                                  aides={aides}
                                  onDoubleClick={(t) => {
                                    // For double click on template, maybe create a new assignment on today?
                                    // Or just edit the task?
                                    // Existing prop is onTaskDoubleClick(assignment, task)
                                    // We don't have an assignment here.
                                    // Let's ignore for now or allow editing task
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                    {provided.placeholder}
                  </Box>
                );
              }}
            </Droppable>
          </Box>
        </TabPanel>

        {/* Relief Pool Tab Content */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <ReliefPoolTab onDismiss={handleDismiss} />
          </Box>
        </TabPanel>
      </Box>
    </Drawer>
  );
}
