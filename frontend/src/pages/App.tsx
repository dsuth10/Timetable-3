import { useEffect, useState } from 'react';
import { useAidesStore } from '../store/stores/aides';
import Schedule from './Schedule';
import ErrorBoundary from '../components/ErrorBoundary';
import ToastNotifications from '../components/ToastNotifications';

export default function App() {
  const { fetchAides } = useAidesStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchAides({ includeAvailability: true })
      .catch(() => undefined)
      .finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, [fetchAides]);

  return (
    <ErrorBoundary>
      {ready && <Schedule />}
      <ToastNotifications />
    </ErrorBoundary>
  );
}




