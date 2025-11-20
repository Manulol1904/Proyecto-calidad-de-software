import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';
import { useEffect } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const formatMessage = (msg) => {
    if (msg == null) return "";
    if (typeof msg === 'string') return msg;
    // If it's an array of errors (pydantic/validation), join messages
    if (Array.isArray(msg)) {
      try {
        return msg
          .map((m) => {
            if (typeof m === 'string') return m;
            if (m?.msg) return m.msg;
            if (m?.message) return m.message;
            return JSON.stringify(m);
          })
          .join(' | ');
      } catch (e) {
        return JSON.stringify(msg);
      }
    }
    // If it's an object, try common fields
    if (typeof msg === 'object') {
      if (msg.detail && typeof msg.detail === 'string') return msg.detail;
      if (msg.message && typeof msg.message === 'string') return msg.message;
      if (msg.msg && typeof msg.msg === 'string') return msg.msg;
      // pydantic error shape: { loc, msg, type }
      if (msg.msg) return msg.msg;
      try {
        return JSON.stringify(msg);
      } catch (e) {
        return String(msg);
      }
    }
    return String(msg);
  };

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const text = formatMessage(message);
    setToasts(prev => [...prev, { id, message: text, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Escuchar eventos globales para mostrar toasts desde fuera de React
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      const message = detail.message || detail || "Ocurrió un error";
      const type = detail.type || 'error';
      const duration = detail.duration || 4000;
      addToast(message, type, duration);
    };

    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '!'}
              {toast.type === 'info' && 'i'}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button 
              className="toast-close"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};