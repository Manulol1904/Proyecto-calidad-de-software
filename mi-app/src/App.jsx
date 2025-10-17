import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./pages/Dashboard";
import ExpensesPage from "./pages/ExpensesPage";
import Settings from "./pages/Settings";
import { useAuth } from "./context/AuthProvider";
import ForgotPassword from "./components/Auth/ForgotPassword";

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}



export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/gastos" element={<ExpensesPage />} />
      <Route path="/config" element={<Settings />} />
         <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}



/*
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Dashboard />  </Protected>} /> 
      <Route path="/gastos" element={<Protected><ExpensesPage /></Protected>} />
      <Route path="/config" element={<Protected><Settings /></Protected>} />
    </Routes>
  );
}
  */
