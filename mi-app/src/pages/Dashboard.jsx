import React from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const { list, user } = useExpenses();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // 🔹 Totales
  const totalIncome = list
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);

  const totalExpense = list
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);

  const userIncome = Number(user?.income) || 0;
  const balance = userIncome + totalIncome - totalExpense;
  const lowBalance = balance < 100;

  // 🔹 Evolución del saldo ACUMULADO (comenzando desde el ingreso del usuario)
  const sortedList = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Crear array con fechas únicas ordenadas
  const uniqueDates = [...new Set(sortedList.map(e => new Date(e.date).toLocaleDateString()))].sort(
    (a, b) => new Date(a) - new Date(b)
  );
  
  // Agregar fecha inicial (hoy o la primera fecha con movimientos)
  const today = new Date().toLocaleDateString();
  const startDate = uniqueDates.length > 0 ? uniqueDates[0] : today;
  
  // Crear el punto inicial con el ingreso del usuario
  const evolutionLabels = [];
  const evolutionValues = [];
  
  // Agregar punto inicial ANTES de cualquier movimiento
  if (uniqueDates.length > 0) {
    const firstDate = new Date(sortedList[0].date);
    const dayBefore = new Date(firstDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    evolutionLabels.push(dayBefore.toLocaleDateString());
    evolutionValues.push(userIncome);
  } else {
    // Si no hay movimientos, mostrar solo hoy con el ingreso del usuario
    evolutionLabels.push(today);
    evolutionValues.push(userIncome);
  }
  
  // Procesar movimientos día por día
  let runningBalance = userIncome;
  
  uniqueDates.forEach((date) => {
    // Obtener todos los movimientos de este día
    const dayMovements = sortedList.filter(e => new Date(e.date).toLocaleDateString() === date);
    
    // Aplicar cada movimiento
    dayMovements.forEach((e) => {
      const amount = Math.abs(Number(e.amount)) || 0;
      if (e.type === "income") {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }
    });
    
    evolutionLabels.push(date);
    evolutionValues.push(runningBalance);
  });

  const labels = evolutionLabels;
  const dataValues = evolutionValues;

  // 🔹 Datos para gráfico de línea (Evolución)
  const dataLine = {
    labels,
    datasets: [
      {
        label: "Saldo acumulado",
        data: dataValues,
        fill: true,
        borderColor: "#52c49d",
        backgroundColor: "rgba(82, 196, 157, 0.2)",
        tension: 0.4,
      },
    ],
  };

  // 🔹 Gráfico de barras (solo Ingresos y Gastos SIN el ingreso del usuario)
  const dataBar = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        label: "Monto ($)",
        data: [totalIncome, totalExpense],
        backgroundColor: ["#52c49d", "#E74C3C"],
        borderRadius: 10,
      },
    ],
  };

  // 🔹 Gráfico de dona (solo Ingresos y Gastos SIN el ingreso del usuario)
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

  // 🔹 Clasificación de gastos por categorías
  const categories = {};
  list
    .filter((e) => e.type === "expense")
    .forEach((e) => {
      const cat = e.category || "Sin categoría";
      const amount = Math.abs(Number(e.amount)) || 0;
      categories[cat] = (categories[cat] || 0) + amount;
    });

  // 🔹 Alertas
  const alerts = [];
  if (lowBalance) alerts.push("⚠️ Saldo bajo: considera reducir gastos.");
  if (totalExpense > userIncome + totalIncome)
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
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Cerrar sesión
          </button>
        </div>
      </nav>

      {/* 🔹 Contenido principal */}
      <div className="dashboard-content">
        <h1>📊 Dashboard Financiero</h1>

        {/* 🔹 Resumen general */}
        <div className="summary-section">
          {user && (
            <div className="summary-card user-income">
              <h3>💎 Ingreso del usuario</h3>
              <p>${userIncome.toFixed(2)}</p>
            </div>
          )}
          <div className="summary-card income">
            <h3>💰 Total Ingresos</h3>
            <p>${totalIncome.toFixed(2)}</p>
          </div>
          <div className="summary-card expense">
            <h3>💸 Total Gastos</h3>
            <p>${totalExpense.toFixed(2)}</p>
          </div>
          <div
            className={`summary-card balance ${
              balance < 0 ? "negative" : "positive"
            }`}
          >
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
            <Line data={dataLine} options={{
              scales: {
                y: {
                  beginAtZero: false,
                  ticks: {
                    callback: function(value) {
                      return '$' + value.toLocaleString();
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return 'Saldo: $' + context.parsed.y.toLocaleString();
                    }
                  }
                }
              }
            }} />
          </div>
          <div className="chart-card">
            <h3>💸 Ingresos vs Gastos</h3>
            <Bar data={dataBar} options={{
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '$' + value.toLocaleString();
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                    }
                  }
                }
              }
            }} />
          </div>
          <div className="chart-card">
            <h3>📊 Distribución Ingresos/Gastos</h3>
            <Doughnut data={dataDoughnut} options={{
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return label + ': $' + value.toLocaleString() + ' (' + percentage + '%)';
                    }
                  }
                }
              }
            }} />
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
              {Object.entries(categories).length > 0 ? (
                Object.entries(categories).map(([cat, val]) => (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td>${val.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center", color: "#999" }}>
                    No hay gastos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔹 Footer */}
      <footer className="app-footer">
        <p>Manuel Lozano & Cristobal Perez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}