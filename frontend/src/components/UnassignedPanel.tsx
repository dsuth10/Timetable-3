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
import { Search, ExpandMore, AssignmentLate } from '@mui/icons-material';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { assignmentsApi } from '../services/assignmentsApi';
import { useTasksStore } from '../store/stores/tasks';
import type { Assignment, Task } from '../types';
import { TaskCard } from './TimetableGrid/TaskCard';
import LoadingState from './common/LoadingState';
import EmptyState from './common/EmptyState';

type Props = {
  dateISO?: string;
  refreshTrigger?: number; // Add refresh trigger prop
  onTaskDoubleClick?: (assignment: Assignment, task?: Task) => void;
};

const DRAWER_WIDTH = 320;

export default function UnassignedPanel({ dateISO, refreshTrigger, onTaskDoubleClick }: Props) {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const { tasks } = useTasksStore();

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    assignmentsApi
      .unassigned() // Remove date parameter to show all unassigned tasks
      .then((res) => {
        console.log('[UnassignedPanel] Received assignments from API:', res);
        console.log('[UnassignedPanel] Number of items:', res.length);
        setItems(res);
      })
      .catch((e: any) => {
        console.error('[UnassignedPanel] Error loading unassigned:', e);
        setError(e.message || 'Failed to load unassigned');
      })
      .finally(() => setLoading(false));
  }, [dateISO, refreshTrigger]); // Add refreshTrigger as dependency

  const taskMap = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach(task => map.set(task.id, task));
    return map;
  }, [tasks]);

  // Filter and group by date
  const groupedItems = useMemo(() => {
    console.log('[UnassignedPanel] Processing items:', items.length);
    console.log('[UnassignedPanel] TaskMap size:', taskMap.size);
    
    // First filter out assignments with missing tasks (orphaned assignments)
    const validItems = items.filter(item => {
      const task = taskMap.get(item.task_id);
      return task !== undefined; // Only show assignments with valid tasks
    });
    
    console.log('[UnassignedPanel] Valid items after filtering orphaned:', validItems.length);
    
    const filtered = validItems.filter(item => {
      if (!searchQuery) return true;
      const task = taskMap.get(item.task_id);
      return task?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             task?.category.toLowerCase().includes(searchQuery.toLowerCase());
    });

    console.log('[UnassignedPanel] Filtered items:', filtered.length);

    const groups = new Map<string, Assignment[]>();
    filtered.forEach(item => {
      const date = item.date;
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(item);
    });

    const result = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    console.log('[UnassignedPanel] Grouped by date:', result.length, 'groups');
    result.forEach(([date, assignments]) => {
      console.log(`  - ${date}: ${assignments.length} assignments`);
    });
    
    return result;
  }, [items, searchQuery, taskMap]);

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
            <AssignmentLate color="primary" />
            Unassigned Tasks
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
          {!loading && !error && items.length === 0 && (
            <EmptyState
              icon={<AssignmentLate />}
              title="All Clear!"
              description="No unassigned tasks at the moment."
            />
          )}
          {!loading && !error && groupedItems.length === 0 && searchQuery && (
            <EmptyState
              title="No Results"
              description={`No tasks found matching "${searchQuery}"`}
            />
          )}
          {!loading && !error && groupedItems.map(([date, assignments]) => (
            <Accordion key={date} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ ml: 1, color: 'text.secondary' }}
                >
                  ({assignments.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Droppable droppableId="unassigned">
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ p: 1 }}
                    >
                      {assignments.map((assignment, idx) => {
                        const task = taskMap.get(assignment.task_id);
                        return (
                          <Box key={assignment.id} data-testid={`unassigned-item-${assignment.id}`}>
                            <TaskCard
                              assignment={assignment}
                              index={idx}
                              task={task}
                              onDoubleClick={onTaskDoubleClick}
                            />
                          </Box>
                        );
                      })}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}


