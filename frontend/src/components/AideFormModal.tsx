import { useEffect, useState } from 'react';
import { aidesApi } from '../services/aidesApi';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AideFormModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [colour, setColour] = useState('#4f46e5');
  const [qual, setQual] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setColour('#4f46e5');
      setQual('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 16, borderRadius: 8, minWidth: 320 }}>
        <h3 style={{ marginTop: 0 }}>Add Aide</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>
            <span>Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} data-testid="aide-name" />
          </label>
          <label>
            <span>Colour</span>
            <input type="color" value={colour} onChange={(e) => setColour(e.target.value)} data-testid="aide-colour" />
          </label>
          <label>
            <span>Qualifications</span>
            <input type="text" value={qual} onChange={(e) => setQual(e.target.value)} placeholder="Optional" data-testid="aide-qual" />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose}>Cancel</button>
          <button
            disabled={!name || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await aidesApi.create({ name, colour_hex: colour, qualifications: qual || undefined });
                onCreated && onCreated();
                onClose();
              } finally {
                setSubmitting(false);
              }
            }}
            data-testid="aide-submit"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}


