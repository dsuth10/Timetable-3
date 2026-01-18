import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert
} from '@mui/material';
import { Search, ExpandMore, Inventory } from '@mui/icons-material';
import { Droppable } from '@hello-pangea/dnd';
import { useTasksStore } from '../store/stores/tasks';
import { Task } from '@/types';
import { TaskTemplateCard } from './TaskTemplateCard';
import LoadingState from './common/LoadingState';
import EmptyState from './common/EmptyState';

export default function TaskBank({ tasks: propTasks }: { tasks?: Task[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { tasks: storeTasks, loading, error, fetchTasks } = useTasksStore();

  const tasks = propTasks || storeTasks;

  useEffect(() => {
    if (!propTasks) {
      fetchTasks();
    }
  }, [propTasks, fetchTasks]);

  const groupedTasks = useMemo(() => {
    const filtered = tasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups = new Map<string, typeof tasks>();
    filtered.forEach(task => {
      const group = groups.get(task.category) || [];
      group.push(task);
      groups.set(task.category, group);
    });

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks, searchQuery]);

  if (loading && tasks.length === 0) return <LoadingState variant="skeleton" rows={5} />;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  let globalIndex = 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search task templates..."
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

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tasks.length === 0 ? (
          <EmptyState
            icon={<Inventory sx={{ fontSize: 48 }} />}
            title="No Templates"
            description="Create task templates to see them here."
          />
        ) : (
          <Droppable droppableId="daily-task-bank" isDropDisabled>
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ p: 1 }}>
                {tasks.map((task, idx) => (
                  <TaskTemplateCard
                    key={task.id}
                    task={task}
                    index={idx}
                  />
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        )}
      </Box>
    </Box>
  );
}

