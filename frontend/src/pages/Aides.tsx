import { useEffect } from 'react';
import { useAidesStore } from '../store/stores/aides';

export default function Aides() {
  const { aides, loading, error, fetchAides } = useAidesStore();

  useEffect(() => {
    fetchAides({ includeAvailability: true }).catch(() => undefined);
  }, [fetchAides]);

  return (
    <div>
      <h1>Aides</h1>
      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}
      <ul>
        {aides.map((a) => (
          <li key={a.id}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: a.colour_hex, marginRight: 8, borderRadius: 2 }} />
            {a.name}
          </li>
        ))}
      </ul>
    </div>
  );
}


