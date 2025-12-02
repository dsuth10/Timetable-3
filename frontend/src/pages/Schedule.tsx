import { useEffect, useMemo, useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Button, 
  Tooltip, 
  Menu
} from '@mui/material';
import { FileDownload as FileDownloadIcon, PictureAsPdf as PdfIcon, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { useUiStore } from '../store/stores/uiStore';
import { useAidesStore } from '../store/stores/aides';
import { useTasksStore } from '../store/stores/tasks';
import { assignmentsApi } from '../services/assignmentsApi';
import { calendarApi } from '../services/calendarApi';
import { downloadBlob } from '../utils/download';
import { TimetableGrid } from '../components/TimetableGrid/TimetableGrid';
import { ClassTimetableGrid } from '../components/TimetableGrid/ClassTimetableGrid';
import { addMinutesToTime } from '../components/TimetableGrid/timeUtils';
import AppDragDropContext from '../components/DragDropContext';
import TaskBank from '../components/Layout/SidePanel/TaskBank';
import TeacherAideListPanel from '../components/Layout/SidePanel/TeacherAideListPanel';
import { useDragDrop } from '../hooks/useDragDrop';
import type { Assignment, Task, Absence } from '../types';
import { useAbsencesStore } from '../store/stores/absences';
import { useClassroomsStore } from '../store/stores/classrooms';
import TaskCreationModal from '../components/TaskModals/TaskCreationModal';
import TaskEditModal from '../components/TaskModals/TaskEditModal';
import { TaskSelectionModal } from '../components/Modals/TaskSelectionModal';
import { taskService } from '../services/taskService';
import MultiDayDialog from '../components/MultiDayDialog';
import AppBar from '../components/Layout/AppBar';
import AideDrawer from '../components/Layout/AideDrawer';
import ClassroomDrawer from '../components/Layout/ClassroomDrawer';
import ManagementPanel from '../components/Layout/ManagementPanel';
import AidesManagement from '../components/Management/AidesManagement';
import TasksManagement from '../components/Management/TasksManagement';
import RequestsManagement from '../components/Management/RequestsManagement';
import ClassroomsManagement from '../components/Management/ClassroomsManagement';
import UndoRedoControls from '../components/UndoRedoControls';
import LoadingState from '../components/common/LoadingState';
import AbsenceModal from '../components/AbsenceModal';
import AideFormModal from '../components/AideFormModal';

export default function Schedule() {
  const { selectedWeekStartISO, nextWeek, prevWeek, thisWeek, viewMode, selectedClassId, setSelectedClassId, setSelectedTimeSlot } = useUiStore();
  const { aides, fetchAides } = useAidesStore();
  const { tasks, fetchTasks } = useTasksStore();
  const { classrooms, fetchClassrooms } = useClassroomsStore();
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
  const [selectedAbsenceAideId, setSelectedAbsenceAideId] = useState<number | null>(null);
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
  const { byAide: absencesByAide, listForAide, delete: deleteAbsence } = useAbsencesStore();
  const [selectedAbsenceDate, setSelectedAbsenceDate] = useState<string | null>(null);
  
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

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
    fetchClassrooms().catch(() => undefined);
  }, [fetchAides, fetchTasks, fetchClassrooms]);

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

  // Preload absences for all visible aides to enable fast switching
  useEffect(() => {
    if (!aides.length || visibleAideIds.size === 0) return;
    const visible = aides.filter(a => visibleAideIds.has(a.id));
    visible.forEach(aide => {
      if (!absencesByAide[aide.id]) {
        listForAide(aide.id).catch(() => undefined);
      }
    });
  }, [aides, visibleAideIds, listForAide, absencesByAide]);

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

  // Get selected class object
  const selectedClass = useMemo(() => {
    return classrooms.find(c => c.id === selectedClassId) || null;
  }, [classrooms, selectedClassId]);

  // Transform assignments for selected class into day-based structure
  const classAssignmentsByDay = useMemo(() => {
    if (viewMode !== 'CLASS' || !selectedClassId) return {};
    
    const byDay: Record<string, Assignment[]> = {};
    weekDates.forEach(date => {
      byDay[date] = [];
    });

    Object.values(assignmentsByAide).flat().forEach(assignment => {
      if (weekDates.includes(assignment.date)) {
        const task = tasks.find(t => t.id === assignment.task_id);
        if (task && task.classroom_id === selectedClassId) {
          byDay[assignment.date].push(assignment);
        }
      }
    });
    
    return byDay;
  }, [viewMode, selectedClassId, assignmentsByAide, weekDates, tasks]);

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
    setSelectedAbsenceDate(null);
    setShowAbsenceModal(true);
    setDrawerOpen(false);
  };

  const handleAddAbsence = (aideId: number, date: string) => {
    setSelectedAbsenceAideId(aideId);
    setSelectedAbsenceDate(date);
    setShowAbsenceModal(true);
  };

  const handleRemoveAbsence = async (absenceId: number) => {
    try {
      await deleteAbsence(absenceId);
      await refreshData();
    } catch (e: any) {
      setError(e.message || 'Failed to remove absence');
    }
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
      console.error('Failed to refresh schedule data:', e);
      setError(e.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportIcs = async () => {
    handleExportClose();
    if (!weekDates.length) return;
    
    setLoading(true);
    try {
      const startDate = weekDates[0];
      const endDate = weekDates[weekDates.length - 1];
      
      const blob = await calendarApi.export({
        start_date: startDate,
        end_date: endDate,
        aide_id: selectedAideId || undefined
      });
      
      const filename = selectedAide 
        ? `schedule-${selectedAide.name.replace(/\s+/g, '_')}-${startDate}.ics`
        : `schedule-${startDate}.ics`;
        
      downloadBlob(blob, filename);
    } catch (e: any) {
      setError(e.message || 'Failed to export schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    handleExportClose();
    if (!weekDates.length) return;
    
    setLoading(true);
    try {
      const startDate = weekDates[0];
      const endDate = weekDates[weekDates.length - 1];
      
      const blob = await calendarApi.exportPdf({
        start_date: startDate,
        end_date: endDate,
        aide_id: selectedAideId || undefined
      });
      
      const filename = selectedAide 
        ? `schedule-${selectedAide.name.replace(/\s+/g, '_')}-${startDate}.pdf`
        : `schedule-${startDate}.pdf`;
        
      downloadBlob(blob, filename);
    } catch (e: any) {
      setError(e.message || 'Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [taskSelectionDraft, setTaskSelectionDraft] = useState<{
    aideId: number;
    classroomId: number;
    date: string;
    time: string;
    duration: number;
  } | null>(null);

  const { onDragEnd, ConflictUI, DurationModal } = useDragDrop({
    onSuccess: refreshData,
    aides: aides,
    onClassroomDrop: (data) => {
      setTaskSelectionDraft(data);
      setShowTaskSelection(true);
    }
  });

  const handleTaskDoubleClick = (assignment: Assignment, task?: Task) => {
    if (task) {
      setSelectedTaskForEdit(task);
      setSelectedAssignmentForEdit(assignment);
      setShowEditTask(true);
    }
  };

  const handleSlotClick = (date: string, time: string) => {
    setSelectedTimeSlot({ date, time, duration: 60 }); // Default to 60 minutes
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
          {/* Left Drawer */}
          {viewMode === 'AIDE' ? (
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
          ) : (
            <ClassroomDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              classrooms={classrooms}
              selectedClassId={selectedClassId}
              onSelectClass={(id) => {
                setSelectedClassId(id);
                setDrawerOpen(false);
              }}
            />
          )}

          {/* Center: Timetable Grid */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {viewMode === 'AIDE' && (
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
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Export Schedule">
                  <Button
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportClick}
                    disabled={loading}
                    variant="outlined"
                    size="small"
                    aria-controls={exportMenuOpen ? 'export-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={exportMenuOpen ? 'true' : undefined}
                  >
                    Export
                  </Button>
                </Tooltip>
                <Menu
                  id="export-menu"
                  anchorEl={exportAnchorEl}
                  open={exportMenuOpen}
                  onClose={handleExportClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                >
                  <MenuItem onClick={handleExportIcs}>
                    <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
                    Export to Calendar (.ics)
                  </MenuItem>
                  <MenuItem onClick={handleExportPdf}>
                    <PdfIcon fontSize="small" sx={{ mr: 1 }} />
                    Export to PDF
                  </MenuItem>
                </Menu>
                <UndoRedoControls />
              </Box>
            </Box>
            )}
            
            {viewMode === 'CLASS' && !selectedClass && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Button variant="contained" onClick={() => setDrawerOpen(true)}>
                  Select a Class
                </Button>
              </Box>
            )}

            {loading && <LoadingState message="Loading schedule..." />}
            {error && (
              <Box sx={{ p: 2, color: 'error.main' }} role="alert">
                {error}
              </Box>
            )}
            
            {!loading && !error && viewMode === 'AIDE' && selectedAide && (
              <TimetableGrid 
                key={`${selectedWeekStartISO}-${selectedAide.id}`}
                selectedAide={selectedAide}
                assignmentsByDay={assignmentsByDay}
                weekDates={weekDates}
                tasks={tasks}
                onTaskDoubleClick={handleTaskDoubleClick}
                absences={absencesByAide[selectedAide.id] as Absence[] || []}
                onAddAbsence={handleAddAbsence}
                onRemoveAbsence={handleRemoveAbsence}
              />
            )}

            {!loading && !error && viewMode === 'CLASS' && selectedClass && (
              <ClassTimetableGrid
                selectedClass={selectedClass}
                assignmentsByDay={classAssignmentsByDay}
                weekDates={weekDates}
                tasks={tasks}
                aides={aides}
                onTaskDoubleClick={handleTaskDoubleClick}
                onSlotClick={handleSlotClick}
              />
            )}
            
            {ConflictUI}
            {DurationModal}
          </Box>

          {/* Right Panel */}
          {viewMode === 'AIDE' ? (
            <TaskBank 
              dateISO={selectedWeekStartISO} 
              refreshTrigger={refreshTrigger}
              onTaskDoubleClick={handleTaskDoubleClick}
            />
          ) : (
            <TeacherAideListPanel assignmentsByAide={assignmentsByAide} />
          )}
        </Box>
      </AppDragDropContext>

      {/* Bottom Management Panel */}
      <ManagementPanel
        aidesContent={<AidesManagement onAddAide={() => setShowAideFormModal(true)} />}
        tasksContent={<TasksManagement refreshTrigger={refreshTrigger} />}
        requestsContent={<RequestsManagement />}
        classroomsContent={<ClassroomsManagement />}
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
          setSelectedAbsenceDate(null);
        }}
        initialAideId={selectedAbsenceAideId || undefined}
        initialDate={selectedAbsenceDate || undefined}
        onCreated={async (aideId) => {
          // Refresh absences for the aide that was just created
          await listForAide(aideId);
          // Also refresh assignments since absences can release assignments
          await refreshData();
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
      <TaskSelectionModal
        open={showTaskSelection}
        classroomId={taskSelectionDraft?.classroomId || null}
        onClose={() => {
          setShowTaskSelection(false);
          setTaskSelectionDraft(null);
        }}
        onConfirm={async (taskId) => {
          if (!taskSelectionDraft) return;
          try {
            setLoading(true);
            await assignmentsApi.create({
              aide_id: taskSelectionDraft.aideId,
              task_id: taskId,
              date: taskSelectionDraft.date,
              start_time: taskSelectionDraft.time,
              end_time: addMinutesToTime(taskSelectionDraft.time, taskSelectionDraft.duration),
              auto_shorten: true
            });
            await refreshData();
            setShowTaskSelection(false);
            setTaskSelectionDraft(null);
          } catch (e: any) {
            setError(e.message || 'Failed to create assignment');
          } finally {
            setLoading(false);
          }
        }}
        onCreate={async (taskData) => {
          if (!taskSelectionDraft) return;
          try {
            setLoading(true);
            const newTask = await taskService.createTask({
              title: taskData.title,
              description: taskData.description,
              classroom_id: taskSelectionDraft.classroomId
            });
            
            await assignmentsApi.create({
              aide_id: taskSelectionDraft.aideId,
              task_id: newTask.id,
              date: taskSelectionDraft.date,
              start_time: taskSelectionDraft.time,
              end_time: addMinutesToTime(taskSelectionDraft.time, taskSelectionDraft.duration),
              auto_shorten: true
            });
            
            await refreshData();
            // Also refresh tasks list
            fetchTasks(); 
            setShowTaskSelection(false);
            setTaskSelectionDraft(null);
          } catch (e: any) {
            setError(e.message || 'Failed to create task and assignment');
          } finally {
            setLoading(false);
          }
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
