import { useEffect, useState } from 'react';
import { absencesApi } from '../services/absencesApi';
import type { TeacherAide } from '../types';

type Props = {
  open: boolean;
  aides: TeacherAide[];
  onClose: () => void;
  onCreated?: () => void;
};

export default function AbsenceModal({ open, aides, onClose, onCreated }: Props) {
  const [aideId, setAideId] = useState<string>('');
  const [dateISO, setDateISO] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAideId('');
      setDateISO('');
      setReason('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 16, borderRadius: 8, minWidth: 320 }}>
        <h3 style={{ marginTop: 0 }}>Record Absence</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>
            <span>Aide</span>
            <select value={aideId} onChange={(e) => setAideId(e.target.value)} data-testid="absence-aide">
              <option value="">Select…</option>
              {aides.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Date</span>
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} data-testid="absence-date" />
          </label>
          <label>
            <span>Reason</span>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" data-testid="absence-reason" />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose}>Cancel</button>
          <button
            disabled={!aideId || !dateISO || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await absencesApi.create({ aide_id: Number(aideId), date: dateISO, reason: reason || null });
                onCreated && onCreated();
                onClose();
              } finally {
                setSubmitting(false);
              }
            }}
            data-testid="absence-submit"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}


