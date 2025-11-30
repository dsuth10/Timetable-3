import { useEffect, useState, useMemo } from 'react';
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
} from '@mui/material';
import { Search, ExpandMore, AssignmentLate, Inventory } from '@mui/icons-material';
import { Droppable } from '@hello-pangea/dnd';
import { useTasksStore } from '../store/stores/tasks';
import { useAidesStore } from '../store/stores/aides';
import { assignmentsApi } from '../services/assignmentsApi';
import type { Task, Assignment, TeacherAide } from '../types';
import { TaskTemplateCard } from './TaskTemplateCard';
import LoadingState from './common/LoadingState';
import EmptyState from './common/EmptyState';

type Props = {
  dateISO?: string;
  refreshTrigger?: number;
  onTaskDoubleClick?: (assignment: Assignment, task?: Task) => void; // We might want to change this signature later
};

const DRAWER_WIDTH = 320;

export default function UnassignedPanel({ dateISO, refreshTrigger, onTaskDoubleClick }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { tasks, loading, error } = useTasksStore();
  const { aides } = useAidesStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

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
        {/* Header */}
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory color="primary" />
            Task Bank
          </Typography>
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
                        {categoryTasks.map((task) => {
                          const currentIndex = globalIndex++;
                          return (
                            <Box key={task.id}>
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
      </Box>
    </Drawer>
  );
}


