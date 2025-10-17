import React from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../context/ExpensesProvider";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../assets/styles/dash.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { list } = useExpenses();

  // 🔹 Agrupar por fecha (saldo neto diario)
  const grouped = {};
  list.forEach((e) => {
    const day = new Date(e.date).toLocaleDateString();
    grouped[day] =
      (grouped[day] || 0) + (e.type === "income" ? e.amount : -e.amount);
  });

  const labels = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
  const dataValues = labels.map((l) => grouped[l]);

  // 🔹 Cálculos totales
  const totalIncome = list
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = list
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalIncome - totalExpense;
  const lowBalance = balance < 100;

  // 🔹 Datos para gráfico de saldo neto diario
  const dataLine = {
    labels,
    datasets: [
      {
        label: "Saldo neto diario",
        data: dataValues,
        fill: true,
        borderColor: "#52c49d",
        backgroundColor: "rgba(82, 196, 157, 0.2)",
        tension: 0.4,
        pointBackgroundColor: "#52c49d",
        pointRadius: 4,
      },
    ],
  };

  // 🔹 Datos para gráfico de ingresos vs gastos
  const dataBar = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        label: "Monto ($)",
        data: [totalIncome, totalExpense],
        backgroundColor: ["#4CAF50", "#E74C3C"],
        borderRadius: 10,
      },
    ],
  };

  // 🔹 Datos para gráfico de distribución porcentual
  const dataDoughnut = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: ["#52c49d", "#f87171"],
        hoverOffset: 6,
      },
    ],
  };

  // 🔹 Clasificación automática (categorías frecuentes)
  const categories = {};
  list.forEach((e) => {
    const cat = e.category || "Sin categoría";
    categories[cat] = (categories[cat] || 0) + e.amount;
  });

  // 🔹 Recordatorios y alertas
  const alerts = [];
  if (lowBalance) alerts.push("⚠️ Saldo bajo: considera reducir gastos.");
  if (totalExpense > totalIncome)
    alerts.push("🚨 Gastas más de lo que ingresas este mes.");
  if (list.length === 0)
    alerts.push("📭 Aún no tienes movimientos registrados.");

  return (
    <div className="dashboard">
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
      <div className="dashboard-content">
        <h1>📊 Dashboard Financiero</h1>

        {/* 🔹 Resumen general */}
        <div className="summary-section">
          <div className="summary-card income">
            <h3>💰 Ingresos</h3>
            <p>${totalIncome.toFixed(2)}</p>
          </div>
          <div className="summary-card expense">
            <h3>💸 Gastos</h3>
            <p>${totalExpense.toFixed(2)}</p>
          </div>
          <div className="summary-card balance">
            <h3>💵 Balance</h3>
            <p>${balance.toFixed(2)}</p>
          </div>
        </div>

        {/* 🔹 Alertas */}
        {alerts.length > 0 && (
          <div className="alerts-section">
            <h3>🚨 Alertas</h3>
            <ul>
              {alerts.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 🔹 Gráficas */}
        <div className="charts-container">
          <div className="chart-card">
            <h3>📈 Evolución del saldo</h3>
            <Line data={dataLine} />
          </div>

          <div className="chart-card">
            <h3>💸 Ingresos vs Gastos</h3>
            <Bar data={dataBar} />
          </div>

          <div className="chart-card">
            <h3>📊 Distribución porcentual</h3>
            <Doughnut data={dataDoughnut} />
          </div>
        </div>

        {/* 🔹 Clasificación por categorías */}
        <div className="categories-section">
          <h3>🧠 Clasificación automática</h3>
          <table className="category-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Monto Total ($)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categories).map(([cat, val]) => (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td>{val.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Tabla de movimientos */}
        <div className="movements-section">
          <h3>📑 Movimientos recientes</h3>
          <table className="movements-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(-5).map((e, i) => (
                <tr key={i}>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td>{e.type === "income" ? "Ingreso" : "Gasto"}</td>
                  <td>{e.category || "-"}</td>
                  <td
                    className={
                      e.type === "income" ? "amount-income" : "amount-expense"
                    }
                  >
                    ${e.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
