import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ minBalance: 100 });

  // Simulación de datos
  useEffect(() => {
    const fakeUsers = [
      { id: 1, name: "Juan Pérez", email: "juan@example.com", accounts: 2, active: true },
      { id: 2, name: "Ana Gómez", email: "ana@example.com", accounts: 1, active: false },
    ];

    const fakeTransactions = [
      { id: 1, user: "Juan Pérez", type: "Gasto", amount: 150.5, date: "2025-10-09" },
      { id: 2, user: "Ana Gómez", type: "Ingreso", amount: 800.0, date: "2025-10-10" },
      { id: 3, user: "Juan Pérez", type: "Ingreso", amount: 500.0, date: "2025-10-10" },
    ];

    setUsers(fakeUsers);
    setTransactions(fakeTransactions);
    setLoading(false);
  }, []);

  // Cálculos globales
  const totalIncome = transactions
    .filter((t) => t.type === "Ingreso")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "Gasto")
    .reduce((sum, t) => sum + t.amount, 0);

  // Gráficas
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
        data: [
          users.filter((u) => u.active).length,
          users.filter((u) => !u.active).length,
        ],
        backgroundColor: ["#52c49d", "#f87171"],
        hoverOffset: 6,
      },
    ],
  };

  // PDF
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
      body: users.map((u) => [
        u.id,
        u.name,
        u.email,
        u.accounts,
        u.active ? "Activo" : "Inactivo",
      ]),
    });

    const lastY = doc.lastAutoTable.finalY + 10;
    doc.text("Transacciones registradas:", 14, lastY);
    doc.autoTable({
      startY: lastY + 5,
      head: [["ID", "Usuario", "Tipo", "Monto", "Fecha"]],
      body: transactions.map((t) => [
        t.id,
        t.user,
        t.type,
        `$${t.amount.toFixed(2)}`,
        t.date,
      ]),
    });

    doc.save("Reporte_Administrativo.pdf");
  };

  if (loading) return <div className="admin-loading">Cargando datos...</div>;

  return (
    <div className="admin-page">
      {/* 🔹 Navbar */}
      <nav className="navbar">
        <h2 className="nav-title">Panel de Administración</h2>
        <div className="nav-links">
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
          <Link to="/admin">🧑‍💼 Admin</Link>
        </div>
      </nav>

      <div className="admin-content">
        <h1>Gestión Administrativa</h1>
        <p className="subtitle">
          Supervisa la actividad de usuarios, cuentas y movimientos financieros.
        </p>

        {/* 🔹 Panel General */}
        <div className="admin-summary">
          <div className="summary-card">
            <h3>👥 Usuarios Registrados</h3>
            <p>{users.length}</p>
          </div>
          <div className="summary-card">
            <h3>💼 Total de Cuentas</h3>
            <p>{users.reduce((sum, u) => sum + u.accounts, 0)}</p>
          </div>
          <div className="summary-card">
            <h3>💸 Total Movimientos</h3>
            <p>{transactions.length}</p>
          </div>
          <div className="summary-card">
            <h3>💰 Ingresos Globales</h3>
            <p>${totalIncome.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>📉 Gastos Globales</h3>
            <p>${totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* 🔹 Gráficas Globales */}
        <div className="charts-container">
          <div className="chart-card">
            <h3>📊 Ingresos vs Gastos (Global)</h3>
            <Bar data={dataBar} />
          </div>
          <div className="chart-card">
            <h3>👥 Usuarios activos vs inactivos</h3>
            <Doughnut data={dataDoughnut} />
          </div>
        </div>

        {/* 🔹 Gestión de Usuarios */}
        <div className="admin-section">
          <h2>Gestión de Usuarios</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Cuentas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.accounts}</td>
                  <td className={u.active ? "active" : "inactive"}>
                    {u.active ? "Activo" : "Inactivo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Transacciones Globales */}
        <div className="admin-section">
          <h2>Movimientos Financieros</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.user}</td>
                  <td className={t.type === "Ingreso" ? "type-income" : "type-expense"}>
                    {t.type}
                  </td>
                  <td>${t.amount.toFixed(2)}</td>
                  <td>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Configuración del sistema */}
        <div className="admin-section config-section">
          <h2>Configuración del Sistema</h2>
          <label>
            Límite mínimo de saldo:{" "}
            <input
              type="number"
              value={config.minBalance}
              onChange={(e) => setConfig({ ...config, minBalance: e.target.value })}
            />{" "}
            USD
          </label>
          <p>⚙️ Ajusta este valor para definir cuándo alertar a los usuarios por bajo saldo.</p>
        </div>

        {/* 🔹 Auditoría */}
        <div className="admin-section audit-section">
          <h2>Auditoría y Seguridad</h2>
          <p>📜 Registra y controla las acciones dentro del sistema.</p>
          <ul>
            <li>✅ Último inicio de sesión: 10/10/2025 - 18:34</li>
            <li>⚠️ 2 intentos de acceso fallidos (usuario: Ana Gómez)</li>
            <li>🔐 Backup automático activo</li>
          </ul>
        </div>

        {/* 🔹 Generar reporte */}
        <div className="pdf-section">
          <button onClick={generatePDF} className="btn-pdf">
            📄 Generar Reporte PDF
          </button>
        </div>
      </div>
    </div>
  );
}
