import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress,
  Alert
} from '@mui/material';
import AppBar from '../components/Layout/AppBar';
import { useDailyDisplayStore } from '../store/stores/dailyDisplay';
import DailyTimeline from '../components/DailyTimeline';
import TaskBank from '../components/TaskBank';
import ReliefPool from '../components/ReliefPool';
import AppDragDropContext from '../components/DragDropContext';
import DailyDatePicker from '../components/DailyDatePicker';
import AssignmentConfirmationDialog from '../components/AssignmentConfirmationDialog';

export default function DailyDisplayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const { data, loading, error, fetchDailyData, assignTask } = useDailyDisplayStore();
  const [activeTab, setActiveTab] = useState<'bank' | 'relief'>('bank');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<any>(null);

  useEffect(() => {
    fetchDailyData(dateParam);
  }, [dateParam, fetchDailyData]);

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

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

    if (source.droppableId === 'daily-task-bank' || source.droppableId === 'task-bank') {
      const taskId = parseInt(draggableId.replace('task-', ''));
      try {
        await assignTask({
          type: 'FROM_BANK',
          id: taskId,
          date: dateParam,
          aide_id: aideId,
          start_time: startTime,
          end_time: endTime
        });
      } catch (e) {
        console.error('Failed to assign task from bank', e);
      }
    } else if (source.droppableId === 'relief-pool') {
      const assignmentId = parseInt(draggableId.replace('relief-', ''));
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
    }
  };

  const handleConfirm = async (start: string, end: string) => {
    if (!pendingAssignment) return;
    try {
      await assignTask({
        ...pendingAssignment,
        start_time: start,
        end_time: end
      });
      setConfirmOpen(false);
      setPendingAssignment(null);
    } catch (e) {
      console.error('Failed to confirm assignment', e);
    }
  };

  const handleDateChange = (newDate: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('date', newDate);
    setSearchParams(newParams);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        weekLabel={dateParam}
        onMenuClick={() => {}}
        onPrevWeek={() => {}}
        onNextWeek={() => {}}
        onToday={() => {}}
        onCreateTask={() => {}}
      />
      
      <AppDragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5">Daily Display</Typography>
          <DailyDatePicker value={dateParam} onChange={handleDateChange} />
        </Box>

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Timeline Area (Horizontal Scroll) */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {loading && !data ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : data ? (
              <DailyTimeline data={data} />
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
              zIndex: 10
            }}
          >
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Box 
                onClick={() => setActiveTab('bank')}
                sx={{ 
                  flex: 1, 
                  p: 1.5, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderBottom: activeTab === 'bank' ? 2 : 0,
                  borderColor: 'primary.main',
                  fontWeight: activeTab === 'bank' ? 'bold' : 'normal'
                }}
              >
                Task Bank
              </Box>
              <Box 
                onClick={() => setActiveTab('relief')}
                sx={{ 
                  flex: 1, 
                  p: 1.5, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderBottom: activeTab === 'relief' ? 2 : 0,
                  borderColor: 'primary.main',
                  fontWeight: activeTab === 'relief' ? 'bold' : 'normal'
                }}
              >
                Relief Pool
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {activeTab === 'bank' ? (
                <TaskBank />
              ) : (
                <ReliefPool />
              )}
            </Box>
          </Paper>
        </Box>
      </AppDragDropContext>

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
    </Box>
  );
}
