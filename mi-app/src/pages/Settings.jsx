import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/config.css";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [balance] = useState(125000); // ejemplo
  const [photo, setPhoto] = useState(null);
  const [language, setLanguage] = useState("es");
  const [theme, setTheme] = useState("dark");
  const [primaryColor, setPrimaryColor] = useState("#4CAF50");
  const [twoFactor, setTwoFactor] = useState(false);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(false);
  const [role, setRole] = useState("usuario"); // 🆕 Nuevo estado para rol

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
              <label htmlFor="photo-upload" className="upload-btn">
                Cambiar foto
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="profile-info">
              <p><strong>Nombre:</strong> Fernando Gaitán</p>
              <p><strong>Correo:</strong> usuario@correo.com</p>
              <p><strong>Miembro desde:</strong> Enero 2024</p>
              <div className="editable-fields">
                <label>Idioma:</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
                <label>Zona horaria:</label>
                <select>
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
            <form className="password-form">
              <input type="password" placeholder="Contraseña actual" />
              <input type="password" placeholder="Nueva contraseña" />
              <button type="submit">Actualizar</button>
            </form>

            <div className="two-factor">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={() => setTwoFactor(!twoFactor)}
                />
                <span className="slider"></span>
              </label>
              <p>Autenticación de dos factores {twoFactor ? "activada ✅" : "desactivada ❌"}</p>
            </div>

            <div className="login-history">
              <h4>Historial de inicio de sesión:</h4>
              <ul>
                <li>📍 Bogotá - 10 Oct 2025, 19:45</li>
                <li>💻 Chrome - Windows 10</li>
                <li>📱 Móvil Android - 09 Oct 2025</li>
              </ul>
            </div>
          </div>

          {/* 💰 Saldo */}
          <div className="settings-card balance-card">
            <h2>Saldo disponible</h2>
            <p className="balance">${balance.toLocaleString()}</p>
            <button className="link-btn">Vincular cuenta bancaria</button>
            <button className="link-btn">Definir meta de ahorro</button>

            <div className="alert-option">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={lowBalanceAlert}
                  onChange={() => setLowBalanceAlert(!lowBalanceAlert)}
                />
                <span className="slider"></span>
              </label>
              <p>Alerta si el saldo es bajo</p>
            </div>
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

            <div className="notif-types">
              <label><input type="checkbox" defaultChecked /> 💵 Gastos importantes</label>
              <label><input type="checkbox" defaultChecked /> 📆 Recordatorios automáticos</label>
              <label><input type="checkbox" /> 📊 Resúmenes semanales</label>
              <label><input type="checkbox" /> ✉️ Enviar por correo</label>
            </div>
          </div>

          {/* 📄 Datos de cuenta */}
          <div className="settings-card account-info">
            <h2>Datos de la cuenta</h2>
            <p><strong>Nombre:</strong> Fernando Gaitán</p>
            <p><strong>Correo:</strong> usuario@correo.com</p>
            <p><strong>Plan:</strong> Estándar</p>
            <p><strong>Estado:</strong> Activo ✅</p>
          </div>

          {/* ⚙️ Gestión de Roles y Permisos */}
          <div className="settings-card roles-card">
            <h2>Gestión de Roles y Permisos</h2>
            <p>Define el nivel de acceso y control para tu cuenta:</p>

            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Administrador 👑</option>
              <option value="usuario">Usuario Básico 👤</option>
              <option value="auditor">Auditor 🔍</option>
            </select>

            <div className="role-description">
              {role === "admin" && (
                <p>🔹 Acceso completo: puede gestionar usuarios, editar datos y configurar el sistema.</p>
              )}
              {role === "usuario" && (
                <p>🔹 Acceso estándar: puede registrar gastos e ingresos, pero no modificar configuraciones globales.</p>
              )}
              {role === "auditor" && (
                <p>🔹 Solo lectura: puede visualizar reportes y registros sin modificar datos.</p>
              )}
            </div>
          </div>

          {/* 🧾 Personalización del sistema */}
          <div className="settings-card customization-card">
            <h2>Personalización del sistema</h2>
            <div className="theme-options">
              <label>Tema:</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dark">Oscuro</option>
                <option value="light">Claro</option>
              </select>

              <label>Color principal:</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>
            <div className="font-size">
              <label>Tamaño de fuente:</label>
              <select>
                <option value="normal">Normal</option>
                <option value="large">Grande</option>
                <option value="xlarge">Extra grande</option>
              </select>
            </div>
          </div>

          {/* 💾 Gestión de datos y reportes */}
          <div className="settings-card data-management">
            <h2>Gestión de datos y reportes</h2>
            <button className="export-btn">Exportar datos (PDF)</button>
            <button className="export-btn">Exportar a Excel</button>
            <button className="export-btn">Descargar historial</button>

            <div className="danger-zone">
              <h4>Zona de riesgo ⚠️</h4>
              <button className="delete-btn">Borrar cuenta</button>
              <button className="reset-btn">Restablecer configuración</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
