import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, AlertColor, Box } from '@mui/material';

type Toast = {
  id: number;
  message: string;
  type: AlertColor;
  open: boolean;
};

export default function ToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onErrorEvent(e: CustomEvent<{ message: string }>) {
      const id = Date.now();
      setToasts((t) => [...t, { id, message: e.detail.message, type: 'error', open: true }]);
    }

    function onSuccessEvent(e: CustomEvent<{ message: string }>) {
      const id = Date.now();
      setToasts((t) => [...t, { id, message: e.detail.message, type: 'success', open: true }]);
    }

    // @ts-ignore
    window.addEventListener('app:error', onErrorEvent as any);
    // @ts-ignore
    window.addEventListener('app:success', onSuccessEvent as any);

    return () => {
      // @ts-ignore
      window.removeEventListener('app:error', onErrorEvent as any);
      // @ts-ignore
      window.removeEventListener('app:success', onSuccessEvent as any);
    };
  }, []);

  const handleClose = (id: number) => (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, open: false } : t));
    // Clean up after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 500);
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1, zIndex: 9999 }}>
      {toasts.map((t, index) => (
        <Snackbar
          key={t.id}
          open={t.open}
          autoHideDuration={t.type === 'error' ? 8000 : 4000}
          onClose={handleClose(t.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          // Stack them manually by offset if multiple are open
          sx={{
            position: 'relative',
            bottom: 'auto',
            right: 'auto',
            transform: 'none',
            mb: 1
          }}
        >
          <Alert
            onClose={handleClose(t.id)}
            severity={t.type}
            variant="filled"
            sx={{ width: '100%', boxShadow: 3 }}
          >
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}


