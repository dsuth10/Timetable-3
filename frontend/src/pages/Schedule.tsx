import { useEffect, useMemo, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useUiStore } from '../store/stores/uiStore';
import { useAidesStore } from '../store/stores/aides';
import { useTasksStore } from '../store/stores/tasks';
import { assignmentsApi } from '../services/assignmentsApi';
import { TimetableGrid } from '../components/TimetableGrid/TimetableGrid';
import AppDragDropContext from '../components/DragDropContext';
import UnassignedPanel from '../components/UnassignedPanel';
import { useDragDrop } from '../hooks/useDragDrop';
import type { Assignment, Task } from '../types';
import TaskCreationModal from '../components/TaskModals/TaskCreationModal';
import TaskEditModal from '../components/TaskModals/TaskEditModal';
import MultiDayDialog from '../components/MultiDayDialog';
import AppBar from '../components/Layout/AppBar';
import AideDrawer from '../components/Layout/AideDrawer';
import ManagementPanel from '../components/Layout/ManagementPanel';
import AidesManagement from '../components/Management/AidesManagement';
import TasksManagement from '../components/Management/TasksManagement';
import RequestsManagement from '../components/Management/RequestsManagement';
import UndoRedoControls from '../components/UndoRedoControls';
import LoadingState from '../components/common/LoadingState';
import AbsenceModal from '../components/AbsenceModal';
import AideFormModal from '../components/AideFormModal';

export default function Schedule() {
  const { selectedWeekStartISO, nextWeek, prevWeek, thisWeek } = useUiStore();
  const { aides, fetchAides } = useAidesStore();
  const { tasks, fetchTasks } = useTasksStore();
  const [assignmentsByAide, setAssignmentsByAide] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [selectedAssignmentForEdit, setSelectedAssignmentForEdit] = useState<Assignment | null>(null);
  const [showMultiDay, setShowMultiDay] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showAideFormModal, setShowAideFormModal] = useState(false);
  const [, setSelectedAbsenceAideId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleAideIds, setVisibleAideIds] = useState<Set<number>>(new Set());
  const [multiDayState, setMultiDayState] = useState([
    { key: 'MO' as const, label: 'Monday', selected: true },
    { key: 'TU' as const, label: 'Tuesday', selected: false },
    { key: 'WE' as const, label: 'Wednesday', selected: false },
    { key: 'TH' as const, label: 'Thursday', selected: false },
    { key: 'FR' as const, label: 'Friday', selected: false },
  ]);
  const [selectedAideId, setSelectedAideId] = useState<number | null>(null);
  const [selectedTaskId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize visible aides when aides are loaded
  useEffect(() => {
    if (aides.length > 0 && visibleAideIds.size === 0) {
      setVisibleAideIds(new Set(aides.map(a => a.id)));
    }
  }, [aides, visibleAideIds.size]);

  // Set default selected aide when aides are loaded
  useEffect(() => {
    if (aides.length > 0 && selectedAideId === null) {
      const firstVisibleAide = aides.find(aide => visibleAideIds.has(aide.id));
      if (firstVisibleAide) {
        setSelectedAideId(firstVisibleAide.id);
      }
    }
  }, [aides, visibleAideIds, selectedAideId]);

  useEffect(() => {
    fetchAides({ includeAvailability: true }).catch(() => undefined);
    fetchTasks().catch(() => undefined);
  }, [fetchAides, fetchTasks]);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    assignmentsApi.weeklyMatrix(selectedWeekStartISO)
      .then((matrix: any) => {
        const byAide: Record<string, Assignment[]> = {};
        
        if (matrix?.matrix) {
          Object.entries(matrix.matrix).forEach(([aideId, days]) => {
            const aideAssignments: Assignment[] = [];
            Object.entries(days as Record<string, any>).forEach(([, assignments]) => {
              if (Array.isArray(assignments)) {
                aideAssignments.push(...assignments);
              }
            });
            byAide[aideId] = aideAssignments;
          });
        }
        
        setAssignmentsByAide(byAide);
      })
      .catch((e: any) => setError(e.message || 'Failed to load weekly matrix'))
      .finally(() => setLoading(false));
  }, [selectedWeekStartISO]);

  const weekLabel = useMemo(() => selectedWeekStartISO, [selectedWeekStartISO]);

  // Calculate week dates (Monday to Friday)
  const weekDates = useMemo(() => {
    // Parse date in UTC to avoid timezone issues
    const [year, month, day] = selectedWeekStartISO.split('-').map(Number);
    const dates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(Date.UTC(year, month - 1, day + i));
      dates.push(date.toISOString().slice(0, 10));
    }
    return dates;
  }, [selectedWeekStartISO]);

  // Transform assignments for selected aide into day-based structure
  const assignmentsByDay = useMemo(() => {
    if (!selectedAideId) return {};
    
    const aideAssignments = assignmentsByAide[String(selectedAideId)] || [];
    const byDay: Record<string, Assignment[]> = {};
    
    // Initialize empty arrays for each day
    weekDates.forEach(date => {
      byDay[date] = [];
    });
    
    // Group assignments by date
    aideAssignments.forEach(assignment => {
      if (weekDates.includes(assignment.date)) {
        byDay[assignment.date].push(assignment);
      }
    });
    
    return byDay;
  }, [selectedAideId, assignmentsByAide, weekDates]);

  // Get selected aide object
  const selectedAide = useMemo(() => {
    return aides.find(aide => aide.id === selectedAideId) || null;
  }, [aides, selectedAideId]);

  const handleToggleAideVisibility = (aideId: number) => {
    setVisibleAideIds(prev => {
      const next = new Set(prev);
      if (next.has(aideId)) {
        next.delete(aideId);
      } else {
        next.add(aideId);
      }
      return next;
    });
  };

  const handleMarkAbsence = (aideId: number) => {
    setSelectedAbsenceAideId(aideId);
    setShowAbsenceModal(true);
    setDrawerOpen(false);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const matrix = await assignmentsApi.weeklyMatrix(selectedWeekStartISO);
      const byAide: Record<string, Assignment[]> = {};
      
      if (matrix?.matrix) {
        Object.entries(matrix.matrix).forEach(([aideId, days]) => {
          const aideAssignments: Assignment[] = [];
          Object.entries(days as Record<string, any>).forEach(([, assignments]) => {
            if (Array.isArray(assignments)) {
              aideAssignments.push(...assignments);
            }
          });
          byAide[aideId] = aideAssignments;
        });
      }
      
      setAssignmentsByAide(byAide);
      // Trigger refresh of unassigned panel
      setRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      setError(e.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const { onDragEnd, ConflictUI } = useDragDrop({
    onSuccess: refreshData
  });

  const handleTaskDoubleClick = (assignment: Assignment, task?: Task) => {
    if (task) {
      setSelectedTaskForEdit(task);
      setSelectedAssignmentForEdit(assignment);
      setShowEditTask(true);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top App Bar */}
      <AppBar
        onMenuClick={() => setDrawerOpen(true)}
        weekLabel={weekLabel}
        onPrevWeek={prevWeek}
        onNextWeek={nextWeek}
        onToday={thisWeek}
        onCreateTask={() => setShowCreateTask(true)}
      />

      {/* Main Content Area */}
      <AppDragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Aide Drawer */}
          <AideDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            aides={aides}
            visibleAideIds={visibleAideIds}
            onToggleAideVisibility={handleToggleAideVisibility}
            onMarkAbsence={handleMarkAbsence}
            onAddAide={() => {
              setDrawerOpen(false);
              setShowAideFormModal(true);
            }}
          />

          {/* Center: Timetable Grid */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              {/* Aide Selector */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="aide-select-label">Select Aide</InputLabel>
                <Select
                  labelId="aide-select-label"
                  value={selectedAideId || ''}
                  label="Select Aide"
                  onChange={(event: SelectChangeEvent<number>) => {
                    setSelectedAideId(Number(event.target.value));
                  }}
                >
                  {aides
                    .filter(aide => visibleAideIds.has(aide.id))
                    .map((aide) => (
                      <MenuItem key={aide.id} value={aide.id}>
                        {aide.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              
              <UndoRedoControls />
            </Box>
            {loading && <LoadingState message="Loading schedule..." />}
            {error && (
              <Box sx={{ p: 2, color: 'error.main' }} role="alert">
                {error}
              </Box>
            )}
            {!loading && !error && selectedAide && (
              <TimetableGrid 
                key={`${selectedWeekStartISO}-${selectedAide.id}`}
                selectedAide={selectedAide}
                assignmentsByDay={assignmentsByDay}
                weekDates={weekDates}
                tasks={tasks}
                onTaskDoubleClick={handleTaskDoubleClick}
              />
            )}
            {ConflictUI}
          </Box>

          {/* Right: Unassigned Panel */}
          <UnassignedPanel 
            dateISO={selectedWeekStartISO} 
            refreshTrigger={refreshTrigger}
            onTaskDoubleClick={handleTaskDoubleClick}
          />
        </Box>
      </AppDragDropContext>

      {/* Bottom Management Panel */}
      <ManagementPanel
        aidesContent={<AidesManagement onAddAide={() => setShowAideFormModal(true)} />}
        tasksContent={<TasksManagement refreshTrigger={refreshTrigger} />}
        requestsContent={<RequestsManagement />}
      />

      {/* Modals */}
      <TaskCreationModal 
        open={showCreateTask} 
        onClose={() => {
          setShowCreateTask(false);
          refreshData();
          fetchTasks(); // Refresh tasks list
        }} 
      />
      <MultiDayDialog
        open={showMultiDay}
        days={multiDayState}
        onToggle={(k) => setMultiDayState((s) => s.map((d) => d.key === k ? { ...d, selected: !d.selected } : d))}
        onApply={async (selected) => {
          if (!selected.length || !selectedAideId || !selectedTaskId) { 
            setShowMultiDay(false); 
            return; 
          }
          const task = tasks.find((t) => t.id === selectedTaskId);
          if (!task) { 
            setShowMultiDay(false); 
            return; 
          }
          const start = new Date(selectedWeekStartISO + 'T00:00:00');
          const dayToOffset: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4 } as any;
          const dates = selected.map((d) => {
            const dt = new Date(start);
            dt.setDate(dt.getDate() + dayToOffset[d]);
            return dt.toISOString().slice(0, 10);
          });
          setShowMultiDay(false);
          setLoading(true);
          try {
            await assignmentsApi.batch({
              task_id: task.id,
              aide_id: selectedAideId,
              dates,
              start_time: task.start_time,
              end_time: task.end_time,
            });
            await refreshData();
          } catch (e: any) {
            setError(e.message || 'Failed to apply multi-day');
          } finally {
            setLoading(false);
          }
        }}
        onClose={() => setShowMultiDay(false)}
      />
      <AbsenceModal 
        open={showAbsenceModal} 
        aides={aides}
        onClose={() => {
          setShowAbsenceModal(false);
          setSelectedAbsenceAideId(null);
          refreshData();
        }} 
      />
      <AideFormModal
        open={showAideFormModal}
        onClose={() => setShowAideFormModal(false)}
        onCreated={(aide) => {
          setShowAideFormModal(false);
          fetchAides({ includeAvailability: true });
          // Add the new aide to visible set
          setVisibleAideIds(prev => new Set([...prev, aide.id]));
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
        onUpdated={() => {
          setShowEditTask(false);
          setSelectedTaskForEdit(null);
          setSelectedAssignmentForEdit(null);
          refreshData();
          fetchTasks();
        }}
        onDeleted={() => {
          setShowEditTask(false);
          setSelectedTaskForEdit(null);
          setSelectedAssignmentForEdit(null);
          refreshData();
          fetchTasks();
        }}
      />
    </Box>
  );
}


