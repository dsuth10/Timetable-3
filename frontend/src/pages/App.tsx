import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Schedule from './Schedule';
import Home from './Home';
import DailyDisplayPage from './DailyDisplayPage';
import ErrorBoundary from '../components/ErrorBoundary';
import ToastNotifications from '../components/ToastNotifications';

export default function App() {
  // Prevent default browser drag-and-drop behavior (prevents "open file" prompts)
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/daily" element={<DailyDisplayPage />} />
      </Routes>
      <ToastNotifications />
    </ErrorBoundary>
  );
}




