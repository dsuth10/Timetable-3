import { Link, Route, Routes, BrowserRouter } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAidesStore } from '../store/stores/aides';
import Schedule from './Schedule';
import Aides from './Aides';
import Tasks from './Tasks';
import Requests from './Requests';
import ErrorBoundary from '../components/ErrorBoundary';
import ToastNotifications from '../components/ToastNotifications';
import AbsenceModal from '../components/AbsenceModal';

export default function App() {
  const { aides, fetchAides } = useAidesStore();
  const [ready, setReady] = useState(false);
  const [showAbsence, setShowAbsence] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchAides({ includeAvailability: true })
      .catch(() => undefined)
      .finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, [fetchAides]);

  // Test-only event: allow Cypress to open AbsenceModal
  useEffect(() => {
    function openAbsence() { setShowAbsence(true); }
    // @ts-ignore
    window.addEventListener('ui:openAbsenceTest', openAbsence as any);
    return () => {
      // @ts-ignore
      window.removeEventListener('ui:openAbsenceTest', openAbsence as any);
    };
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: 220, borderRight: '1px solid #eee', padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Aide Scheduler</h2>
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 8 }}><Link to="/">Schedule</Link></li>
              <li style={{ marginBottom: 8 }}><Link to="/aides">Aides</Link></li>
              <li style={{ marginBottom: 8 }}><Link to="/tasks">Tasks</Link></li>
              <li style={{ marginBottom: 8 }}><Link to="/requests">Requests</Link></li>
            </ul>
          </nav>
          <div style={{ marginTop: 16 }}>
            <strong>Aides</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0' }}>
              {aides.map((a) => (
                <li key={a.id}>{a.name}</li>
              ))}
            </ul>
          </div>
        </aside>
        <main style={{ flex: 1, padding: 16 }}>
          {ready && (
            <Routes>
              <Route path="/" element={<Schedule />} />
              <Route path="/aides" element={<Aides />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/requests" element={<Requests />} />
            </Routes>
          )}
        </main>
      </div>
      <ToastNotifications />
      <AbsenceModal open={showAbsence} aides={aides} onClose={() => setShowAbsence(false)} />
      </ErrorBoundary>
    </BrowserRouter>
  );
}




