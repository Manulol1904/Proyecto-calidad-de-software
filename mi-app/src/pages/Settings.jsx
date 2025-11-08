import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../context/ExpensesProvider";
import LogoutButton from "../components/LogoutButton";
import "../assets/styles/config.css";

export default function Settings() {
  const { user, updateUser, currentIncome, changePassword } = useExpenses();

  const [income, setIncome] = useState(0);
  const [incomeType, setIncomeType] = useState("monthly");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setIncome(user.income || 0);
      setIncomeType(user.income_type || "monthly");
      setFullName(user.full_name || "");
      setUsername(user.username || "");
    }
  }, [user]);

  const handleUpdateIncome = async () => {
    try {
      await updateUser({
        income: parseFloat(income),
        income_type: incomeType,
      });
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return alert("❌ Las contraseñas no coinciden");
    }
    try {
      await changePassword({ oldPassword, newPassword });
      alert("✅ Contraseña cambiada correctamente");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || err.message));
    }
  };

  if (!user) return <div>Cargando...</div>;

  const nextResetDate = user.next_reset_date
    ? new Date(user.next_reset_date).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "No disponible";

  const daysUntilReset = user.next_reset_date
    ? Math.ceil(
        (new Date(user.next_reset_date) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="settings-page">
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/gastos">Gastos</Link>
          <Link to="/config">Configuración</Link>
          <LogoutButton />
        </div>
      </nav>

      <div className="settings-container">
        <h1>Configuración del Usuario</h1>
        <p className="subtitle">Gestiona tu cuenta y preferencias</p>

        <div className="settings-grid-3cols">
          {/* COL 1 - PERFIL y SEGURIDAD */}
          <div className="col">
            <div className="settings-card form-card">
              <h2>Perfil</h2>
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nombre de usuario</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Correo</label>
                <input type="email" value={user.email} disabled className="disabled-input"/>
              </div>
              <button onClick={handleUpdateProfile} className="primary-btn">Guardar cambios</button>
            </div>

            <div className="settings-card form-card">
              <h2>Seguridad</h2>
              <button className="primary-btn" onClick={() => setShowPasswordModal(true)}>Cambiar contraseña</button>
            </div>
          </div>

          {/* COL 2 - INGRESO / BALANCE */}
          <div className="col">
            <div className="settings-card form-card">
              <h2>Configuración de Ingresos</h2>
              <div className="balance-display">
                <div className="balance-item">
                  <p className="balance-label">Ingreso total:</p>
                  <p className="balance-value">${income.toLocaleString("es-CO")}</p>
                </div>
                <div className="balance-item">
                  <p className="balance-label">Disponible ahora:</p>
                  <p className="balance-value" style={{ color: "#080459" }}>${currentIncome.toLocaleString("es-CO")}</p>
                </div>
              </div>
              <p className="reset-info">Próximo reset: {nextResetDate} ({daysUntilReset} días)</p>

              <div className="form-group">
                <label>Tipo de pago</label>
                <select value={incomeType} onChange={(e) => setIncomeType(e.target.value)}>
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ingreso {incomeType === "monthly" ? "mensual" : "quincenal"}</label>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} />
              </div>
              <button onClick={handleUpdateIncome} className="primary-btn">Actualizar ingreso</button>
            </div>
          </div>

          {/* COL 3 - INFORMACIÓN DE CUENTA */}
          <div className="col">
            <div className="settings-card">
              <h2>Información de cuenta</h2>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Estado:</strong> {user.is_active ? "Activo" : "Inactivo"}</p>
              <p><strong>Registro:</strong> {new Date(user.created_at).toLocaleString()}</p>
              <p><strong>Tipo de ingreso:</strong> {user.income_type === "monthly" ? "Mensual" : "Quincenal"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CONTRASEÑA */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Cambiar contraseña</h3>
            <div className="form-group">
              <input
                type="password"
                placeholder="Contraseña actual"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleChangePassword} className="primary-btn">Guardar</button>
              <button onClick={() => setShowPasswordModal(false)} className="secondary-btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>Manuel Lozano & Cristobal Perez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}
