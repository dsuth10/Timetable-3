import { useEffect, useState } from 'react';
import { assignmentsApi } from '../services/assignmentsApi';
import type { Assignment } from '../types';

type Props = {
  dateISO?: string;
};

export default function UnassignedPanel({ dateISO }: Props) {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    assignmentsApi
      .unassigned(dateISO)
      .then((res) => setItems(res))
      .catch((e: any) => setError(e.message || 'Failed to load unassigned'))
      .finally(() => setLoading(false));
  }, [dateISO]);

  return (
    <aside style={{ width: 280, borderLeft: '1px solid #eee', padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Unassigned</h3>
      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}
      <ul style={{ paddingLeft: 16 }}>
        {items.map((a) => (
          <li key={a.id} data-testid={`unassigned-item-${a.id}`}>
            {a.date} · {(a.start_time || '').slice(0,5)}–{(a.end_time || '').slice(0,5)} (task #{a.task_id})
          </li>
        ))}
      </ul>
    </aside>
  );
}


