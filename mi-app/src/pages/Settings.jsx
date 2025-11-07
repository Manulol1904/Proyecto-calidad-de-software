import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../context/ExpensesProvider";
import LogoutButton from "../components/LogoutButton";
import "../assets/styles/config.css";

export default function Settings() {
  const { user, updateUser, currentIncome } = useExpenses();

  const [income, setIncome] = useState(0);
  const [incomeType, setIncomeType] = useState("monthly");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

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

  if (!user) {
    return <div>Cargando...</div>;
  }

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
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
          <LogoutButton />
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
                  cursor: "pointer",
                }}
              >
                💾 Guardar cambios
              </button>
            </div>
          </div>

          {/* 💰 Ingreso mensual */}
          <div className="settings-card balance-card">
            <h2>💰 Configuración de Ingresos</h2>

            <div className="balance-display">
              <div className="balance-item">
                <p className="balance-label">Ingreso total configurado:</p>
                <p className="balance-value">${income.toLocaleString("es-CO")}</p>
              </div>
              <div className="balance-item">
                <p className="balance-label">Disponible ahora:</p>
                <p className="balance-value" style={{ color: "#52c49d" }}>
                  ${currentIncome.toLocaleString("es-CO")}
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#f0f9ff",
                padding: "15px",
                borderRadius: "8px",
                marginTop: "15px",
                border: "2px solid #0077cc",
              }}
            >
              <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#333" }}>
                <strong>📅 Próximo reset:</strong> {nextResetDate}
              </p>
              <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#666" }}>
                ⏰ Faltan {daysUntilReset} días
              </p>
            </div>

            <div style={{ marginTop: "20px" }}>
              <label style={{ fontWeight: "600", color: "#333" }}>
                Tipo de pago:
              </label>
              <select
                value={incomeType}
                onChange={(e) => setIncomeType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                }}
              >
                <option value="monthly">
                  💼 Mensual (todo el ingreso al inicio del mes)
                </option>
                <option value="biweekly">
                  📅 Quincenal (mitad día 1, mitad día 15)
                </option>
              </select>

              <div
                style={{
                  background: "#fff3cd",
                  padding: "12px",
                  borderRadius: "8px",
                  marginTop: "15px",
                  fontSize: "0.85rem",
                  color: "#856404",
                  border: "1px solid #ffeeba",
                }}
              >
                <strong>💡 ¿Cómo funciona?</strong>
                <br />
                {incomeType === "monthly" ? (
                  <>
                    • <strong>Mensual:</strong> Tu ingreso completo estará
                    disponible el día 1 de cada mes.
                    <br />• El balance se resetea automáticamente cada mes.
                  </>
                ) : (
                  <>
                    • <strong>Quincenal:</strong> Recibes la mitad de tu ingreso
                    el día 1 y la otra mitad el día 15.
                    <br />• Primera quincena (1-14): Balance = 50% del ingreso
                    <br />• Segunda quincena (15-fin): Balance = 100% del ingreso
                  </>
                )}
              </div>

              <label
                style={{
                  fontWeight: "600",
                  color: "#333",
                  display: "block",
                  marginTop: "15px",
                }}
              >
                Ingreso {incomeType === "monthly" ? "mensual" : "quincenal"} total:
              </label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                min="0"
                step="1000"
                placeholder={
                  incomeType === "monthly"
                    ? "Ej: 3000000"
                    : "Ej: 3000000 (se dividirá en 2)"
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                }}
              />

              <button
                onClick={handleUpdateIncome}
                style={{
                  marginTop: "15px",
                  background: "#52c49d",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                💾 Actualizar configuración de ingresos
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
                cursor: "pointer",
              }}
            >
              🔑 Cambiar contraseña
            </button>
          </div>

          {/* 📊 Información de cuenta */}
          <div className="settings-card">
            <h2>📊 Información de cuenta</h2>
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              {user.is_active ? "✅ Activo" : "❌ Inactivo"}
            </p>
            <p>
              <strong>Fecha de registro:</strong>{" "}
              {new Date(user.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Tipo de ingreso:</strong>{" "}
              {user.income_type === "monthly" ? "💼 Mensual" : "📅 Quincenal"}
            </p>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Manuel Lozano & Cristobal Perez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}
