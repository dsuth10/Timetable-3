import { Routes, Route } from 'react-router-dom';
import Schedule from './Schedule';
import Home from './Home';
import ErrorBoundary from '../components/ErrorBoundary';
import ToastNotifications from '../components/ToastNotifications';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
      <ToastNotifications />
    </ErrorBoundary>
  );
}




