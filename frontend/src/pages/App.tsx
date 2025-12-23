import { Routes, Route } from 'react-router-dom';
import Schedule from './Schedule';
import Home from './Home';
import DailyDisplayPage from './DailyDisplayPage';
import ErrorBoundary from '../components/ErrorBoundary';
import ToastNotifications from '../components/ToastNotifications';

export default function App() {
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




