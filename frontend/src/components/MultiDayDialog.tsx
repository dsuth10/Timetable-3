type Props = {
  open: boolean;
  days: { key: 'MO' | 'TU' | 'WE' | 'TH' | 'FR'; label: string; selected: boolean }[];
  onToggle: (key: Props['days'][number]['key']) => void;
  onApply: (selectedKeys: Array<'MO' | 'TU' | 'WE' | 'TH' | 'FR'>) => void;
  onClose: () => void;
};

export default function MultiDayDialog({ open, days, onToggle, onApply, onClose }: Props) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 8, padding: 16, minWidth: 360 }}>
        <h3 style={{ marginTop: 0 }}>Apply to multiple days</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {days.map((d) => (
            <li key={d.key} style={{ marginBottom: 6 }}>
              <label>
                <input type="checkbox" checked={d.selected} onChange={() => onToggle(d.key)} data-testid={`multiday-${d.key}`} /> {d.label}
              </label>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onApply(days.filter((d) => d.selected).map((d) => d.key))}>Apply</button>
        </div>
      </div>
    </div>
  );
}


