import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../assets/styles/admin.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ minBalance: 100 });
  const [auditData, setAuditData] = useState({});
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState("");

  // --- Fetch inicial ---
  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, transactionsRes, configRes, auditRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/transactions"),
          fetch("/api/config"),
          fetch("/api/audit"),
        ]);

        const usersData = await usersRes.json();
        const transactionsData = await transactionsRes.json();
        const configData = await configRes.json();
        const audit = await auditRes.json();

        setUsers(usersData);
        setTransactions(transactionsData);
        setConfig(configData);
        setAuditData(audit);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- Función Cerrar Sesión ---
  const handleLogout = () => {
    localStorage.removeItem("token"); // ejemplo
    navigate("/login");
  };

  // --- CRUD usuarios ---
  const saveUser = (user) => {
    if (user.id) {
      setUsers(users.map((u) => (u.id === user.id ? user : u)));
      fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
    } else {
      const newUser = { ...user, id: Date.now() };
      setUsers([...users, newUser]);
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
    }
    closeModal();
  };

  const deleteUser = (id) => {
    setUsers(users.filter((u) => u.id !== id));
    fetch(`/api/users/${id}`, { method: "DELETE" });
  };

  // --- CRUD transacciones ---
  const saveTransaction = (t) => {
    if (t.id) {
      setTransactions(transactions.map((tr) => (tr.id === t.id ? t : tr)));
      fetch(`/api/transactions/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
    } else {
      const newT = { ...t, id: Date.now() };
      setTransactions([...transactions, newT]);
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newT),
      });
    }
    closeModal();
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    fetch(`/api/transactions/${id}`, { method: "DELETE" });
  };

  // --- Modal ---
  const openModal = (type, data = null) => {
    setModalType(type);
    if (type === "user") {
      setModalData(data || { name: "", email: "", accounts: 1, active: true });
    } else if (type === "transaction") {
      setModalData(
        data || {
          user: users[0]?.name || "",
          type: "Ingreso",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
        }
      );
    }
  };

  const closeModal = () => {
    setModalData(null);
    setModalType("");
  };

  // --- Cálculos y gráficas ---
  const totalIncome = transactions.filter((t) => t.type === "Ingreso").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "Gasto").reduce((sum, t) => sum + t.amount, 0);

  const dataBar = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        label: "Monto total ($)",
        data: [totalIncome, totalExpense],
        backgroundColor: ["#4CAF50", "#E74C3C"],
        borderRadius: 8,
      },
    ],
  };

  const dataDoughnut = {
    labels: ["Usuarios activos", "Usuarios inactivos"],
    datasets: [
      {
        data: [users.filter((u) => u.active).length, users.filter((u) => !u.active).length],
        backgroundColor: ["#52c49d", "#f87171"],
        hoverOffset: 6,
      },
    ],
  };

  // --- Generar PDF ---
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reporte General del Sistema", 14, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    doc.text("Usuarios registrados:", 14, 40);
    doc.autoTable({
      startY: 45,
      head: [["ID", "Nombre", "Correo", "Cuentas", "Estado"]],
      body: users.map((u) => [u.id, u.name, u.email, u.accounts, u.active ? "Activo" : "Inactivo"]),
    });

    const lastY = doc.lastAutoTable.finalY + 10;
    doc.text("Transacciones registradas:", 14, lastY);
    doc.autoTable({
      startY: lastY + 5,
      head: [["ID", "Usuario", "Tipo", "Monto", "Fecha"]],
      body: transactions.map((t) => [t.id, t.user, t.type, `$${t.amount.toFixed(2)}`, t.date]),
    });

    doc.save("Reporte_Administrativo.pdf");
  };

  if (loading) return <div className="admin-loading">Cargando datos...</div>;

  return (
    <div className="admin-page">
      <nav className="navbar">
        <h2 className="nav-title">Panel de Administración</h2>
        <div className="nav-links">
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
          <Link to="/admin">🧑‍💼 Admin</Link>
          <button className="logout-btn" onClick={handleLogout}>🚪 Cerrar sesión</button>
        </div>
      </nav>

      <div className="admin-content">
        <h1>Gestión Administrativa</h1>
        <p className="subtitle">Supervisa la actividad de usuarios, cuentas y movimientos financieros.</p>

        <div className="admin-summary">
          <div className="summary-card"><h3>👥 Usuarios Registrados</h3><p>{users.length}</p></div>
          <div className="summary-card"><h3>💼 Total de Cuentas</h3><p>{users.reduce((sum, u) => sum + u.accounts, 0)}</p></div>
          <div className="summary-card"><h3>💸 Total Movimientos</h3><p>{transactions.length}</p></div>
          <div className="summary-card"><h3>💰 Ingresos Globales</h3><p>${totalIncome.toFixed(2)}</p></div>
          <div className="summary-card"><h3>📉 Gastos Globales</h3><p>${totalExpense.toFixed(2)}</p></div>
        </div>

        <div className="charts-container">
          <div className="chart-card"><h3>📊 Ingresos vs Gastos (Global)</h3><Bar data={dataBar} /></div>
          <div className="chart-card"><h3>👥 Usuarios activos vs inactivos</h3><Doughnut data={dataDoughnut} /></div>
        </div>

        {/* TABLA USUARIOS */}
        <div className="admin-section">
          <h2>Gestión de Usuarios</h2>
          <button onClick={() => openModal("user")}>➕ Nuevo Usuario</button>
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Cuentas</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.accounts}</td>
                  <td className={u.active ? "active" : "inactive"}>{u.active ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button onClick={() => openModal("user", u)}>✏️ Editar</button>
                    <button onClick={() => deleteUser(u.id)}>🗑️ Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLA TRANSACCIONES */}
        <div className="admin-section">
          <h2>Movimientos Financieros</h2>
          <button onClick={() => openModal("transaction")}>➕ Nueva Transacción</button>
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Usuario</th><th>Tipo</th><th>Monto</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.user}</td>
                  <td className={t.type === "Ingreso" ? "type-income" : "type-expense"}>{t.type}</td>
                  <td>${t.amount.toFixed(2)}</td>
                  <td>{t.date}</td>
                  <td>
                    <button onClick={() => openModal("transaction", t)}>✏️ Editar</button>
                    <button onClick={() => deleteTransaction(t.id)}>🗑️ Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AUDITORÍA */}
        <div className="admin-section audit-section">
          <h2>Auditoría y Seguridad</h2>
          <ul>
            {auditData.lastLogin && <li>✅ Último inicio de sesión: {auditData.lastLogin}</li>}
            {auditData.failedAttempts && <li>⚠️ {auditData.failedAttempts} intentos de acceso fallidos</li>}
            {auditData.backupActive && <li>🔐 Backup automático activo</li>}
          </ul>
        </div>

        <div className="pdf-section">
          <button onClick={generatePDF} className="btn-pdf">📄 Generar Reporte PDF</button>
        </div>
      </div>

      <footer className="app-footer">
        <p>Manuel Lozano & Cristobal Perez - Ingenieros de Sistemas</p>
      </footer>

      {/* MODAL */}
      {modalData && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{modalType === "user" ? (modalData.id ? "Editar Usuario" : "Nuevo Usuario") : modalData.id ? "Editar Transacción" : "Nueva Transacción"}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              modalType === "user" ? saveUser(modalData) : saveTransaction(modalData);
            }}>
              {modalType === "user" ? (
                <>
                  <input type="text" placeholder="Nombre" value={modalData.name} onChange={(e) => setModalData({ ...modalData, name: e.target.value })} required />
                  <input type="email" placeholder="Correo" value={modalData.email} onChange={(e) => setModalData({ ...modalData, email: e.target.value })} required />
                  <input type="number" placeholder="Cuentas" value={modalData.accounts} onChange={(e) => setModalData({ ...modalData, accounts: parseInt(e.target.value) })} min={1} required />
                  <select value={modalData.active ? "true" : "false"} onChange={(e) => setModalData({ ...modalData, active: e.target.value === "true" })}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </>
              ) : (
                <>
                  <select value={modalData.user} onChange={(e) => setModalData({ ...modalData, user: e.target.value })}>
                    {users.map((u) => (<option key={u.id} value={u.name}>{u.name}</option>))}
                  </select>
                  <select value={modalData.type} onChange={(e) => setModalData({ ...modalData, type: e.target.value })}>
                    <option value="Ingreso">Ingreso</option>
                    <option value="Gasto">Gasto</option>
                  </select>
                  <input type="number" placeholder="Monto" value={modalData.amount} onChange={(e) => setModalData({ ...modalData, amount: parseFloat(e.target.value) })} min={0} required />
                  <input type="date" value={modalData.date} onChange={(e) => setModalData({ ...modalData, date: e.target.value })} />
                </>
              )}
              <div className="modal-buttons">
                <button type="submit">Guardar</button>
                <button type="button" onClick={closeModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
