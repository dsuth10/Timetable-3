import { useEffect, useState } from 'react';

type Toast = { id: number; message: string; type: 'error' | 'success' };

export default function ToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onErrorEvent(e: CustomEvent<{ message: string }>) {
      const id = Date.now();
      setToasts((t) => [...t, { id, message: e.detail.message, type: 'error' }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }
    
    function onSuccessEvent(e: CustomEvent<{ message: string }>) {
      const id = Date.now();
      setToasts((t) => [...t, { id, message: e.detail.message, type: 'success' }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
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

  if (!toasts.length) return null;

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999 }}>
      {toasts.map((t) => (
        <div 
          key={t.id} 
          style={{ 
            background: t.type === 'error' ? '#111827' : '#10b981', 
            color: 'white', 
            padding: '8px 12px', 
            borderRadius: 6, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)' 
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}


