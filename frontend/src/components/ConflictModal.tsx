import React from 'react';

type Conflict = {
  existing_assignment_id: number;
  task_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Props = {
  open: boolean;
  conflicts: Conflict[];
  onReplace: () => void;
  onCancel: () => void;
  onClose: () => void;
};

export default function ConflictModal({ open, conflicts, onReplace, onCancel, onClose }: Props) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 8, padding: 16, minWidth: 360 }}>
        <h3 style={{ marginTop: 0 }}>Assignment Conflict</h3>
        <p>The following assignments conflict with your action:</p>
        <ul>
          {conflicts.map((c) => (
            <li key={c.existing_assignment_id}>{c.date} · {c.start_time}-{c.end_time} (assignment #{c.existing_assignment_id})</li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} data-testid="conflict-cancel">Cancel</button>
          <button onClick={onReplace} data-testid="conflict-replace">Replace existing</button>
          <button onClick={onClose} data-testid="conflict-close">Close</button>
        </div>
      </div>
    </div>
  );
}


