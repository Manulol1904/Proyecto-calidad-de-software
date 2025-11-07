import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./pages/Dashboard";
import ExpensesPage from "./pages/ExpensesPage";
import Settings from "./pages/Settings";
import { useAuth } from "./context/AuthProvider";
import ForgotPassword from "./components/Auth/ForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Mostrar loader mientras verifica autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.5rem',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <div>Cargando...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Rutas protegidas */}
      <Route 
        path="/" 
        element={
          <Protected>
            <Dashboard />
          </Protected>
        } 
      />
      <Route 
        path="/gastos" 
        element={
          <Protected>
            <ExpensesPage />
          </Protected>
        } 
      />
      <Route 
        path="/config" 
        element={
          <Protected>
            <Settings />
          </Protected>
        } 
      />
      <Route 
        path="/AdminDashboard" 
        element={
          <Protected>
            <AdminDashboard />
          </Protected>
        } 
      />
    </Routes>
  );
}