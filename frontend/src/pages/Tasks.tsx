import { useEffect } from 'react';
import { useTasksStore } from '../store/stores/tasks';

export default function Tasks() {
  const { tasks, loading, error, fetchTasks } = useTasksStore();

  useEffect(() => {
    fetchTasks().catch(() => undefined);
  }, [fetchTasks]);

  return (
    <div>
      <h1>Tasks</h1>
      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>{t.title} · {t.category} · {t.start_time.slice(0,5)}-{t.end_time.slice(0,5)}</li>
        ))}
      </ul>
    </div>
  );
}


