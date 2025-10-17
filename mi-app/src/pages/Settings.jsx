import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/config.css";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [balance] = useState(125000); // ejemplo
  const [photo, setPhoto] = useState(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  return (
    <div className="settings-page">
      {/* 🔹 Navbar */}
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
        </div>
      </nav>

      {/* 🔹 Contenido principal */}
      <div className="settings-container">
        <h1>Configuración del Usuario</h1>
        <p className="subtitle">Gestiona tu cuenta, tu perfil y tus preferencias.</p>

        <div className="settings-grid">
          {/* 🧍 Perfil */}
          <div className="settings-card profile">
            <h2>Perfil</h2>
            <div className="profile-photo">
              <img
                src={photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="Foto de perfil"
              />
              <label htmlFor="photo-upload" className="upload-btn">Cambiar foto</label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
            <p><strong>Correo:</strong> usuario@correo.com</p>
            <p><strong>Miembro desde:</strong> Enero 2024</p>
          </div>

          {/* 🔐 Cambio de contraseña */}
          <div className="settings-card">
            <h2>Cambiar Contraseña</h2>
            <form className="password-form">
              <input type="password" placeholder="Contraseña actual" />
              <input type="password" placeholder="Nueva contraseña" />
              <button type="submit">Actualizar</button>
            </form>
          </div>

          {/* 💰 Saldo */}
          <div className="settings-card balance-card">
            <h2>Saldo disponible</h2>
            <p className="balance">${balance.toLocaleString()}</p>
          </div>

          {/* 📬 Notificaciones */}
          <div className="settings-card notifications-card">
            <h2>Notificaciones</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
              />
              <span className="slider"></span>
            </label>
            <p>{notifications ? "Activadas" : "Desactivadas"}</p>
          </div>

          {/* 📄 Datos de cuenta */}
          <div className="settings-card account-info">
            <h2>Datos de la cuenta</h2>
            <p><strong>Nombre:</strong> Fernando Gaitán</p>
            <p><strong>Correo:</strong> usuario@correo.com</p>
            <p><strong>Plan:</strong> Estándar</p>
            <p><strong>Estado:</strong> Activo ✅</p>
          </div>
        </div>
      </div>
    </div>
  );
}
