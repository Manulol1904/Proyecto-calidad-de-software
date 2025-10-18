import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useExpenses } from "../context/ExpensesProvider";
import "../assets/styles/config.css";

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser } = useExpenses();
  
  const [income, setIncome] = useState(0);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (user) {
      setIncome(user.income || 0);
      setFullName(user.full_name || "");
      setUsername(user.username || "");
    }
  }, [user]);

  const handleUpdateIncome = async () => {
    try {
      await updateUser({ income: parseFloat(income) });
      alert("✅ Ingreso actualizado correctamente");
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateUser({ full_name: fullName, username });
      alert("✅ Perfil actualizado correctamente");
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="settings-page">
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
          <button className="logout-btn" onClick={handleLogout}>🚪 Cerrar sesión</button>
        </div>
      </nav>

      <div className="settings-container">
        <h1>Configuración del Usuario</h1>
        <p className="subtitle">Gestiona tu cuenta y preferencias</p>

        <div className="settings-grid">
          {/* 🧍 Perfil */}
          <div className="settings-card">
            <h2>👤 Perfil</h2>
            <div className="profile-info">
              <label>Nombre completo:</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
              />
              
              <label>Nombre de usuario:</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
              
              <label>Correo:</label>
              <input 
                type="email" 
                value={user.email} 
                disabled
                style={{ background: "#f0f0f0", cursor: "not-allowed" }}
              />
              
              <label>Miembro desde:</label>
              <input 
                type="text" 
                value={new Date(user.created_at).toLocaleDateString()}
                disabled
                style={{ background: "#f0f0f0", cursor: "not-allowed" }}
              />

              <button 
                onClick={handleUpdateProfile}
                style={{
                  marginTop: "10px",
                  background: "#52c49d",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                💾 Guardar cambios
              </button>
            </div>
          </div>

          {/* 💰 Ingreso mensual */}
          <div className="settings-card balance-card">
            <h2>💰 Ingreso Mensual</h2>
            <div className="balance-display">
              <div className="balance-item">
                <p className="balance-label">Ingreso actual:</p>
                <p className="balance-value">${income.toLocaleString('es-CO')}</p>
              </div>
            </div>
            
            <div style={{ marginTop: "20px" }}>
              <label>Nuevo ingreso mensual:</label>
              <input 
                type="number" 
                value={income} 
                onChange={(e) => setIncome(e.target.value)}
                min="0"
                step="1000"
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd"
                }}
              />
              <button 
                onClick={handleUpdateIncome}
                style={{
                  marginTop: "10px",
                  background: "#52c49d",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                💾 Actualizar ingreso
              </button>
            </div>
          </div>

          {/* 🔐 Seguridad */}
          <div className="settings-card">
            <h2>🔐 Seguridad</h2>
            <p>Cambia tu contraseña o gestiona tu seguridad</p>
            <button 
              style={{
                marginTop: "10px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              🔑 Cambiar contraseña
            </button>
          </div>

          {/* 📊 Información de cuenta */}
          <div className="settings-card">
            <h2>📊 Información de cuenta</h2>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Estado:</strong> {user.is_active ? "✅ Activo" : "❌ Inactivo"}</p>
            <p><strong>Fecha de registro:</strong> {new Date(user.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Manuel Lozano & Cristobal Perez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}