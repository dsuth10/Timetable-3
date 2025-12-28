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
  alpha,
} from '@mui/material';
import { Search, ExpandMore, AssignmentLate, Inventory, PersonOff, School } from '@mui/icons-material';
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
  noDrawer?: boolean;
  tasks?: Task[];
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
      style={{ height: '100%', overflow: 'hidden', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
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

export default function TaskBank({ dateISO, refreshTrigger, onTaskDoubleClick, noDrawer, tasks: propTasks }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { tasks: storeTasks, loading, error, fetchTasks } = useTasksStore();
  const { aides } = useAidesStore();
  const { count: reliefPoolCount, fetchCount: fetchReliefPoolCount, dismiss } = useReliefPoolStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Accordion expansion states
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('taskBank_expandedCategories');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('taskBank_expandedClasses');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const tasks = propTasks || storeTasks;

  // Fetch tasks if not provided
  useEffect(() => {
    if (!propTasks) {
      fetchTasks();
    }
  }, [propTasks, fetchTasks]);

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
      const query = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(query) ||
             task.category.toLowerCase().includes(query) ||
             task.classroom?.name.toLowerCase().includes(query);
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

  // Group tasks by classroom
  const groupedTasksByClass = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(query) ||
             task.category.toLowerCase().includes(query) ||
             task.classroom?.name.toLowerCase().includes(query);
    });

    const groups = new Map<string, Task[]>();
    filtered.forEach(task => {
      const className = task.classroom?.name || 'No Classroom';
      if (!groups.has(className)) {
        groups.set(className, []);
      }
      groups.get(className)!.push(task);
    });

    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === 'No Classroom') return 1;
      if (b[0] === 'No Classroom') return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [tasks, searchQuery]);

  // Persist expansion states
  useEffect(() => {
    localStorage.setItem('taskBank_expandedCategories', JSON.stringify(Array.from(expandedCategories)));
  }, [expandedCategories]);

  useEffect(() => {
    localStorage.setItem('taskBank_expandedClasses', JSON.stringify(Array.from(expandedClasses)));
  }, [expandedClasses]);

  // Handle accordion toggles
  const handleCategoryToggle = (category: string) => (_: any, expanded: boolean) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (expanded) next.add(category);
      else next.delete(category);
      return next;
    });
  };

  const handleClassToggle = (className: string) => (_: any, expanded: boolean) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (expanded) next.add(className);
      else next.delete(className);
      return next;
    });
  };

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

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
            label="By Category"
            {...a11yProps(0)}
            sx={{ minHeight: 48, textTransform: 'none', px: 1 }}
          />
          <Tab 
            icon={<School fontSize="small" />}
            iconPosition="start"
            label="By Class"
            {...a11yProps(1)}
            sx={{ minHeight: 48, textTransform: 'none', px: 1 }}
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
            {...a11yProps(2)}
            sx={{ minHeight: 48, textTransform: 'none', px: 1 }}
          />
        </Tabs>
      </Box>

      {/* Task Bank Tab Content (By Category) */}
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
          {loading && tasks.length === 0 && <LoadingState variant="skeleton" rows={5} />}
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
                    <Accordion 
                      key={category} 
                      expanded={expandedCategories.has(category)}
                      onChange={handleCategoryToggle(category)}
                    >
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
                                  if (onTaskDoubleClick) {
                                    // Handle double click if needed, though card currently doesn't provide assignment here
                                  }
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

      {/* Task Bank Tab Content (By Class) */}
      <TabPanel value={activeTab} index={1}>
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
          {loading && tasks.length === 0 && <LoadingState variant="skeleton" rows={5} />}
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
          {!loading && !error && groupedTasksByClass.length === 0 && searchQuery && (
            <EmptyState
              title="No Results"
              description={`No tasks found matching "${searchQuery}"`}
            />
          )}
          
          {/* Droppable Area - Dropping here means "Unassign/Delete Assignment" */}
          <Droppable droppableId="unassigned">
            {(provided, snapshot) => {
              let globalIndex = 0; // Track index across all classes
              
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
                  {!loading && !error && groupedTasksByClass.map(([className, classTasks]) => {
                    const classColor = classTasks[0]?.classroom?.colour_hex;
                    return (
                      <Accordion 
                        key={className} 
                        expanded={expandedClasses.has(className)}
                        onChange={handleClassToggle(className)}
                        sx={{
                          '&.Mui-expanded': {
                            m: 0,
                            borderBottom: classColor ? `1px solid ${classColor}` : 'inherit'
                          },
                          border: classColor ? `1px solid ${alpha(classColor, 0.2)}` : 'inherit',
                          mb: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <AccordionSummary 
                          expandIcon={<ExpandMore sx={{ color: classColor || 'inherit' }} />}
                          sx={{
                            bgcolor: classColor ? alpha(classColor, 0.1) : 'transparent',
                            color: classColor ? 'text.primary' : 'inherit',
                            borderLeft: classColor ? `4px solid ${classColor}` : 'none',
                            minHeight: 40,
                            '&.Mui-expanded': {
                              minHeight: 40,
                            },
                            '& .MuiAccordionSummary-content': {
                              my: 1,
                              '&.Mui-expanded': { my: 1 },
                              '& .MuiTypography-root': {
                                color: classColor ? classColor : 'inherit',
                                fontWeight: 700
                              }
                            }
                          }}
                        >
                          <Typography variant="body2">
                            {className}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}
                          >
                            ({classTasks.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 1, bgcolor: classColor ? alpha(classColor, 0.05) : 'transparent' }}>
                          {classTasks.map((task, taskIndex) => {
                            const currentIndex = globalIndex++;
                            // Use combination of className, task.id, and index to ensure unique keys
                            const uniqueKey = `${className}-${task.id}-${taskIndex}`;
                            return (
                              <Box key={uniqueKey}>
                                <TaskTemplateCard
                                  task={task}
                                  index={currentIndex}
                                  assignments={assignments}
                                  aides={aides}
                                  onDoubleClick={(t) => {
                                    if (onTaskDoubleClick) {
                                      // Handle double click if needed, though card currently doesn't provide assignment here
                                    }
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                  {provided.placeholder}
                </Box>
              );
            }}
          </Droppable>
        </Box>
      </TabPanel>

      {/* Relief Pool Tab Content */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <ReliefPoolTab onDismiss={handleDismiss} />
        </Box>
      </TabPanel>
    </Box>
  );

  if (noDrawer) {
    return content;
  }

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
      {content}
    </Drawer>
  );
}
