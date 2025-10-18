import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/styles/config.css";

export default function Settings({ backendData, updateBackend }) {
  const navigate = useNavigate();

  // 🔹 Estados para campos editables
  const [balance, setBalance] = useState(backendData?.balance || 0); 
  const [photo, setPhoto] = useState(backendData?.photo || null);
  const [language, setLanguage] = useState(backendData?.language || "");
  const [twoFactor, setTwoFactor] = useState(backendData?.twoFactor || false);

  // Función para subir foto de perfil
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
      updateBackend?.({ photo: url });
    }
  };

  // Función para actualizar saldo
  const handleBalanceChange = (e) => {
    const newBalance = parseInt(e.target.value) || 0;
    setBalance(newBalance);
    updateBackend?.({ balance: newBalance });
  };

  // Función para actualizar idioma
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    updateBackend?.({ language: e.target.value });
  };

  // Función para toggle autenticación de dos factores
  const handleTwoFactorToggle = () => {
    setTwoFactor(!twoFactor);
    updateBackend?.({ twoFactor: !twoFactor });
  };

  // Función cerrar sesión
  const handleLogout = () => {
    updateBackend?.({ action: "logout" });
    navigate("/login"); // Redirige a login
  };

  return (
    <div className="settings-page">
      {/* 🔹 Navbar fijo */}
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
          <button className="logout-btn" onClick={handleLogout}>🚪 Cerrar sesión</button>
        </div>
      </nav>

      {/* 🔹 Contenido principal con padding-top para navbar */}
      <div className="settings-container" style={{ paddingTop: "90px" }}>
        <h1>Configuración del Usuario</h1>
        <p className="subtitle">Gestiona tu cuenta, tu perfil y tus preferencias.</p>

        <div className="settings-grid">
          {/* 🧍 Perfil */}
          <div className="settings-card profile">
            <h2>Perfil</h2>
            <div className="profile-photo">
              <img src={photo || ""} alt="Foto de perfil" />
              <label htmlFor="photo-upload" className="upload-btn">Cambiar foto</label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="profile-info">
              <p><strong>Nombre:</strong> {backendData?.name || ""}</p>
              <p><strong>Correo:</strong> {backendData?.email || ""}</p>
              <p><strong>Miembro desde:</strong> {backendData?.memberSince || ""}</p>
              <div className="editable-fields">
                <label>Idioma:</label>
                <select value={language} onChange={handleLanguageChange}>
                  <option value="">Seleccionar</option>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
                <label>Zona horaria:</label>
                <select
                  value={backendData?.timezone || ""}
                  onChange={(e) => updateBackend?.({ timezone: e.target.value })}
                >
                  <option value="">Seleccionar</option>
                  <option value="GMT-5">GMT-5 (Colombia)</option>
                  <option value="GMT-3">GMT-3 (Argentina)</option>
                  <option value="GMT+1">GMT+1 (España)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 🔐 Cambio de contraseña */}
          <div className="settings-card">
            <h2>Seguridad y Contraseña</h2>
            <form
              className="password-form"
              onSubmit={(e) => {
                e.preventDefault();
                updateBackend?.({
                  currentPassword: e.target[0].value,
                  newPassword: e.target[1].value,
                });
                e.target.reset();
              }}
            >
              <input type="password" placeholder="Contraseña actual" />
              <input type="password" placeholder="Nueva contraseña" />
              <button type="submit">Actualizar</button>
            </form>

            <div className="two-factor">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={handleTwoFactorToggle}
                />
                <span className="slider"></span>
              </label>
              <p>Autenticación de dos factores {twoFactor ? "activada ✅" : "desactivada ❌"}</p>
            </div>

            <div className="login-history">
              <h4>Historial de inicio de sesión:</h4>
              <ul>
                {(backendData?.loginHistory || []).map((entry, idx) => (
                  <li key={idx}>{entry}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 💰 Saldo disponible */}
          <div className="settings-card balance-card">
            <h2>Saldo disponible</h2>
            <div className="balance-display">
              <div className="balance-item">
                <p className="balance-label">COP:</p>
                <p className="balance-value">{balance.toLocaleString('es-CO')} COP</p>
              </div>
              <div className="balance-item">
                <p className="balance-label">USD:</p>
                <p className="balance-value">{backendData?.usdBalance || 0} USD</p>
              </div>
            </div>
          </div>

          {/* 📄 Datos de cuenta */}
          <div className="settings-card account-info">
            <h2>Datos de la cuenta</h2>
            <p><strong>Nombre:</strong> {backendData?.name || ""}</p>
            <p><strong>Correo:</strong> {backendData?.email || ""}</p>
            <p><strong>Plan:</strong> {backendData?.plan || ""}</p>
            <p><strong>Estado:</strong> {backendData?.status || ""}</p>
          </div>

          {/* 💾 Gestión de datos y reportes */}
          <div className="settings-card data-management">
            <h2>Gestión de datos y reportes</h2>
            <button className="export-btn" onClick={() => updateBackend?.({ export: "pdf" })}>
              Exportar datos (PDF)
            </button>
            <button className="export-btn" onClick={() => updateBackend?.({ export: "excel" })}>
              Exportar a Excel
            </button>
            <button className="export-btn" onClick={() => updateBackend?.({ export: "history" })}>
              Descargar historial
            </button>

            <div className="danger-zone">
              <h4>Zona de riesgo ⚠️</h4>
              <button className="delete-btn" onClick={() => updateBackend?.({ action: "deleteAccount" })}>
                Borrar cuenta
              </button>
              <button className="reset-btn" onClick={() => updateBackend?.({ action: "resetSettings" })}>
                Restablecer configuración
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Footer universal */}
      <footer className="app-footer">
        <p>Manuel Lozano & Cristobal Perez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}
