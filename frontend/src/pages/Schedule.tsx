import { useEffect, useMemo, useState } from 'react';
import { useUiStore } from '../store/stores/uiStore';
import { useAidesStore } from '../store/stores/aides';
import { useTasksStore } from '../store/stores/tasks';
import { assignmentsApi } from '../services/assignmentsApi';
import { TimetableGrid } from '../components/TimetableGrid/TimetableGrid';
import AppDragDropContext from '../components/DragDropContext';
import UnassignedPanel from '../components/UnassignedPanel';
import { useDragDrop } from '../hooks/useDragDrop';
import type { Assignment } from '../types';
import TaskCreationModal from '../components/TaskModals/TaskCreationModal';
import MultiDayDialog from '../components/MultiDayDialog';
import { tasksApi } from '../services/tasksApi';
import WeekNavigation from '../components/WeekNavigation';
import UndoRedoControls from '../components/UndoRedoControls';

export default function Schedule() {
  const { selectedWeekStartISO, nextWeek, prevWeek, thisWeek } = useUiStore();
  const { aides, fetchAides } = useAidesStore();
  const { tasks, fetchTasks } = useTasksStore();
  const [assignmentsByAide, setAssignmentsByAide] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showMultiDay, setShowMultiDay] = useState(false);
  const [multiDayState, setMultiDayState] = useState([
    { key: 'MO' as const, label: 'Monday', selected: true },
    { key: 'TU' as const, label: 'Tuesday', selected: false },
    { key: 'WE' as const, label: 'Wednesday', selected: false },
    { key: 'TH' as const, label: 'Thursday', selected: false },
    { key: 'FR' as const, label: 'Friday', selected: false },
  ]);
  const [selectedAideId, setSelectedAideId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    fetchAides({ includeAvailability: true }).catch(() => undefined);
    fetchTasks().catch(() => undefined);
  }, [fetchAides, fetchTasks]);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    assignmentsApi.weeklyMatrix(selectedWeekStartISO)
      .then((matrix) => {
        // Expecting matrix structure per backend contract; fall back to grouping items if needed
        const byAide: Record<string, Assignment[]> = {};
        const items: Assignment[] = (matrix?.assignments || []) as Assignment[];
        for (const a of items) {
          const key = String(a.aide_id ?? 'unassigned');
          byAide[key] = byAide[key] || [];
          byAide[key].push(a);
        }
        setAssignmentsByAide(byAide);
      })
      .catch((e: any) => setError(e.message || 'Failed to load weekly matrix'))
      .finally(() => setLoading(false));
  }, [selectedWeekStartISO]);

  const weekLabel = useMemo(() => selectedWeekStartISO, [selectedWeekStartISO]);

  const { onDragEnd, ConflictUI } = useDragDrop();

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <WeekNavigation weekStartISO={weekLabel} onPrev={prevWeek} onNext={nextWeek} onToday={thisWeek} />
        <UndoRedoControls />
        <span style={{ flex: 1 }} />
        <label>
          <span style={{ marginRight: 6 }}>Aide</span>
          <select value={selectedAideId ?? ''} onChange={(e) => setSelectedAideId(e.target.value ? Number(e.target.value) : null)} data-testid="select-aide">
            <option value="">Select…</option>
            {aides.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ marginLeft: 8, marginRight: 6 }}>Task</span>
          <select value={selectedTaskId ?? ''} onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)} data-testid="select-task">
            <option value="">Select…</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setShowMultiDay(true)} data-testid="open-multiday" disabled={!selectedAideId || !selectedTaskId}>Multi-Day</button>
        <button onClick={() => setShowCreateTask(true)} data-testid="open-create-task">+ Create Task</button>
      </div>
      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}
      <div style={{ flex: 1 }}>
        <AppDragDropContext onDragEnd={onDragEnd}>
          <TimetableGrid aides={aides} assignmentsByAide={assignmentsByAide} />
        </AppDragDropContext>
        {ConflictUI}
      </div>
      <UnassignedPanel dateISO={selectedWeekStartISO} />
      <TaskCreationModal open={showCreateTask} onClose={() => setShowCreateTask(false)} />
      <MultiDayDialog
        open={showMultiDay}
        days={multiDayState}
        onToggle={(k) => setMultiDayState((s) => s.map((d) => d.key === k ? { ...d, selected: !d.selected } : d))}
        onApply={async (selected) => {
          if (!selected.length || !selectedAideId || !selectedTaskId) { setShowMultiDay(false); return; }
          const task = tasks.find((t) => t.id === selectedTaskId);
          if (!task) { setShowMultiDay(false); return; }
          const start = new Date(selectedWeekStartISO + 'T00:00:00');
          const dayToOffset: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4 } as any;
          const dates = selected.map((d) => {
            const dt = new Date(start);
            dt.setDate(dt.getDate() + dayToOffset[d]);
            return dt.toISOString().slice(0, 10);
          });
          // Close dialog immediately for better UX and test stability
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
            const matrix = await assignmentsApi.weeklyMatrix(selectedWeekStartISO);
            const byAide: Record<string, Assignment[]> = {};
            const items: Assignment[] = (matrix?.assignments || []) as Assignment[];
            for (const a of items) {
              const key = String(a.aide_id ?? 'unassigned');
              byAide[key] = byAide[key] || [];
              byAide[key].push(a);
            }
            setAssignmentsByAide(byAide);
          } catch (e: any) {
            setError(e.message || 'Failed to apply multi-day');
          } finally {
            setLoading(false);
          }
        }}
        onClose={() => setShowMultiDay(false)}
      />
    </div>
  );
}


