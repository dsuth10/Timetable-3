import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { addDays, subDays, format, isWeekend, nextMonday } from 'date-fns';
import { Add as AddIcon } from '@mui/icons-material';
import AppBar from '../components/Layout/AppBar';
import { useTasksStore } from '../store/stores/tasks';
import DailyTimeline from '../components/DailyTimeline';
import TaskBank from '../components/Layout/SidePanel/TaskBank';
import AppDragDropContext from '../components/DragDropContext';
import DailyDatePicker from '../components/DailyDatePicker';
import AssignmentConfirmationDialog from '../components/AssignmentConfirmationDialog';
import TaskCreationModal from '../components/TaskModals/TaskCreationModal';
import TaskEditModal from '../components/TaskModals/TaskEditModal';
import ManagementPanel from '../components/Layout/ManagementPanel';
import AidesManagement from '../components/Management/AidesManagement';
import TasksManagement from '../components/Management/TasksManagement';
import ClassroomsManagement from '../components/Management/ClassroomsManagement';
import RequestsManagement from '../components/Management/RequestsManagement';
import BackupManagement from '../components/Management/BackupManagement';
import DailyAideSidebar from '../components/DailyAideSidebar';
import AideFormModal from '../components/AideFormModal';
import { useDragDrop } from '../hooks/useDragDrop';
import { useDailyView } from '../hooks/useDailyView';
import { useAssignTask } from '../hooks/useAssignTask';
import type { Task, Assignment } from '../types';

export default function DailyDisplayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

  const { data, isLoading: loading, error, refetch: fetchDailyData } = useDailyView(dateParam);
  const assignTaskMutation = useAssignTask();
  const { fetchTasks } = useTasksStore();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [selectedAssignmentForEdit, setSelectedAssignmentForEdit] = useState<Assignment | null>(null);

  // Aide Modal State
  const [showAideModal, setShowAideModal] = useState(false);
  const [editingAide, setEditingAide] = useState<any>(null);

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Use the standardized drag-drop hook with Daily View specific options
  const { onDragEnd, ConflictUI, DurationModal } = useDragDrop({
    defaultDate: dateParam, // Provide the current date for Daily View
    aides: data?.aides || [],
    onSuccess: () => {
      // Refresh daily data after successful assignment
      fetchDailyData();
      setRefreshTrigger(prev => prev + 1);
    }
  });

  // Weekend redirect logic
  useEffect(() => {
    const date = new Date(dateParam + 'T00:00:00');
    if (isWeekend(date)) {
      const nextMon = nextMonday(date);
      handleDateChange(format(nextMon, 'yyyy-MM-dd'));
    }
  }, [dateParam]);

  // Handler for relief pool drops (still uses the confirmation dialog)
  const handleReliefPoolDrop = async (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId !== 'relief-pool') return;

    const destMatch = destination.droppableId.match(/aide-(\d+)-slot-(.+)/);
    if (!destMatch) return;

    const aideId = parseInt(destMatch[1]);
    const startTime = destMatch[2];

    const slot = data?.timeline_config.slots.find(s => s.start_time === startTime);
    const duration = slot?.duration_minutes || 30;

    const [h, m] = startTime.split(':').map(Number);
    const dateObj = new Date();
    dateObj.setHours(h, m + duration, 0);
    const endTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:00`;

    // Draggable ID format for Relief Pool in unified component is `relief-pool-${task.id}`
    const assignmentId = parseInt(draggableId.replace('relief-pool-', ''));
    const reliefTask = data?.relief_pool.find(t => t.id === assignmentId);

    setPendingAssignment({
      type: 'FROM_RELIEF',
      id: assignmentId,
      date: dateParam,
      aide_id: aideId,
      start_time: startTime,
      end_time: reliefTask ? reliefTask.end_time : endTime,
      title: reliefTask?.task?.title || 'Relief Task'
    });
    setConfirmOpen(true);
  };

  const handleConfirm = async (start: string, end: string) => {
    if (!pendingAssignment) return;
    try {
      await assignTaskMutation.mutateAsync({
        ...pendingAssignment,
        start_time: start,
        end_time: end
      });
      setConfirmOpen(false);
      setPendingAssignment(null);
      // Refresh after relief pool assignment
      fetchDailyData();
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error('Failed to confirm assignment', e);
    }
  };

  // Combined drag end handler
  const handleDragEnd = (result: any) => {
    const { source } = result;

    // Handle relief pool drops separately
    if (source.droppableId === 'relief-pool') {
      handleReliefPoolDrop(result);
    } else {
      // Use the standard hook for task bank drops
      onDragEnd(result);
    }
  };

  const handleDateChange = (newDate: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('date', newDate);
    setSearchParams(newParams);
  };

  const handlePrevDay = () => {
    let current = new Date(dateParam + 'T00:00:00');
    let prev = subDays(current, 1);
    while (isWeekend(prev)) {
      prev = subDays(prev, 1);
    }
    handleDateChange(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    let current = new Date(dateParam + 'T00:00:00');
    let next = addDays(current, 1);
    while (isWeekend(next)) {
      next = addDays(next, 1);
    }
    handleDateChange(format(next, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    let today = new Date();
    if (isWeekend(today)) {
      today = nextMonday(today);
    }
    handleDateChange(format(today, 'yyyy-MM-dd'));
  };

  const handleTaskDoubleClick = (assignment: Assignment) => {
    if (assignment.task) {
      setSelectedTaskForEdit(assignment.task);
      setSelectedAssignmentForEdit(assignment);
      setShowEditTask(true);
    }
  };

  const handleTaskUpdated = () => {
    setShowEditTask(false);
    setSelectedTaskForEdit(null);
    setSelectedAssignmentForEdit(null);
    fetchDailyData();
    fetchTasks();
  };

  const handleRefresh = () => {
    fetchDailyData();
    fetchTasks();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditAide = (aide: any) => {
    setEditingAide(aide);
    setShowAideModal(true);
  };

  const handleAideUpdated = () => {
    setShowAideModal(false);
    setEditingAide(null);
    handleRefresh();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        weekLabel={dateParam}
        onMenuClick={() => setSidebarOpen(prev => !prev)}
        onPrevWeek={handlePrevDay}
        onNextWeek={handleNextDay}
        onToday={handleToday}
      />

      <AppDragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5">Daily Display</Typography>
            <DailyDatePicker value={dateParam} onChange={handleDateChange} />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => setShowCreateTaskModal(true)}
          >
            Create Task
          </Button>
        </Box>

        {(error || assignTaskMutation.error) && (
          <Alert severity="error" sx={{ m: 2 }}>
            {(error as any)?.message || assignTaskMutation.error?.message || 'An error occurred'}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left Panel: Aide List */}
          {data && sidebarOpen && (
            <DailyAideSidebar
              aides={data.aides}
              date={dateParam}
              onEditAide={handleEditAide}
            />
          )}

          {/* Timeline Area (Horizontal Scroll) */}
          <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
            {loading && !data ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : data ? (
              <DailyTimeline
                data={data}
                date={dateParam}
                onTaskDoubleClick={handleTaskDoubleClick}
              />
            ) : null}
          </Box>

          {/* Fixed Right Panel */}
          <Paper
            elevation={3}
            sx={{
              width: 350,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: 1,
              borderColor: 'divider',
              zIndex: 10,
              overflow: 'hidden'
            }}
          >
            <TaskBank
              noDrawer
              dateISO={dateParam}
              tasks={data?.task_bank}
              refreshTrigger={refreshTrigger}
            />
          </Paper>
        </Box>
      </AppDragDropContext>

      {/* Bottom Management Panel */}
      <ManagementPanel
        aidesContent={<AidesManagement onChanged={handleRefresh} />}
        classroomsContent={<ClassroomsManagement onChanged={handleRefresh} />}
        tasksContent={<TasksManagement refreshTrigger={refreshTrigger} onChanged={handleRefresh} />}
        requestsContent={<RequestsManagement />}
        backupContent={<BackupManagement />}
      />

      {/* Relief Pool Confirmation Dialog */}
      {pendingAssignment && (
        <AssignmentConfirmationDialog
          open={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setPendingAssignment(null);
          }}
          onConfirm={handleConfirm}
          initialStartTime={pendingAssignment.start_time}
          initialEndTime={pendingAssignment.end_time}
          title={pendingAssignment.title}
        />
      )}

      {/* Render modals from useDragDrop hook */}
      {ConflictUI}
      {DurationModal}

      <TaskCreationModal
        open={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreated={() => {
          setShowCreateTaskModal(false);
          handleRefresh();
        }}
      />

      <TaskEditModal
        open={showEditTask}
        task={selectedTaskForEdit}
        assignment={selectedAssignmentForEdit}
        onClose={() => {
          setShowEditTask(false);
          setSelectedTaskForEdit(null);
          setSelectedAssignmentForEdit(null);
        }}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskUpdated}
      />

      <AideFormModal
        open={showAideModal}
        aide={editingAide}
        onClose={() => {
          setShowAideModal(false);
          setEditingAide(null);
        }}
        onUpdated={handleAideUpdated}
      />
    </Box>
  );
}
