import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Añadir token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar 401 globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const status = err.response?.status;
      const data = err.response?.data;
      const message = data?.detail || data?.message || err.message || 'Error desconocido';

      // Emitir evento global para que ToastProvider lo muestre
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type: 'error' } }));
      }

      if (status === 401) {
        localStorage.removeItem("token");
        // redirigir a login
        window.location.href = "/login";
      }
    } catch (e) {
      console.error('Error en interceptor de respuestas:', e);
    }

    return Promise.reject(err);
  }
);

export default api;
