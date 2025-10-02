import { useState } from 'react';
import { tasksApi } from '../../services/tasksApi';
import type { Task, TaskCategory } from '../../types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (task: Task) => void;
};

export default function TaskCreationModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('CLASS_SUPPORT');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit() {
    setBusy(true);
    setError(undefined);
    try {
      const task = await tasksApi.createOneOff({ title, category, start_time: start, end_time: end, classroom_id: null, notes: null });
      onCreated?.(task);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create task');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 8, padding: 16, minWidth: 420 }}>
        <h3 style={{ marginTop: 0 }}>Create Task</h3>
        {error && <p role="alert">{error}</p>}
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            <div>Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            <div>Category</div>
            <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
              <option value="PLAYGROUND">PLAYGROUND</option>
              <option value="CLASS_SUPPORT">CLASS_SUPPORT</option>
              <option value="GROUP_SUPPORT">GROUP_SUPPORT</option>
              <option value="INDIVIDUAL_SUPPORT">INDIVIDUAL_SUPPORT</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>
              <div>Start</div>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label style={{ flex: 1 }}>
              <div>End</div>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose} disabled={busy}>Cancel</button>
          <button onClick={submit} disabled={busy || !title.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
}



