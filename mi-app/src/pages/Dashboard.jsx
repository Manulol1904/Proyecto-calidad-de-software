import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../context/ExpensesProvider";
import { useAuth } from "../context/AuthProvider";
import { useCurrency } from "../context/CurrencyProvider";
import CurrencySelector from "../components/CurrencySelector/CurrencySelector";
import LogoutButton from "../components/LogoutButton";
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
  const { list, user, currentIncome, loading: expensesLoading, initialized } = useExpenses();
  const { isAuthenticated } = useAuth();
  const { convertFromCOP, formatAmount, selectedCurrency } = useCurrency();
  
  // Estados para valores convertidos
  const [convertedCurrentIncome, setConvertedCurrentIncome] = useState(0);
  const [convertedTotalIncome, setConvertedTotalIncome] = useState(0);
  const [convertedTotalExpense, setConvertedTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  // Función de normalización
  const normalizeCategory = (text) => {
    if (!text) return "Sin Categoría";
    return text.trim().toLowerCase().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calcular totales en COP
  const totalIncomeCOP = list
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);

  const totalExpenseCOP = list
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);

  // Convertir valores cuando cambie la moneda
  useEffect(() => {
    const convertValues = async () => {
      setLoading(true);
      try {
        const [convertedCurrent, convertedIncome, convertedExpense] = await Promise.all([
          convertFromCOP(currentIncome),
          convertFromCOP(totalIncomeCOP),
          convertFromCOP(totalExpenseCOP)
        ]);

        setConvertedCurrentIncome(convertedCurrent);
        setConvertedTotalIncome(convertedIncome);
        setConvertedTotalExpense(convertedExpense);
      } catch (error) {
        console.error("Error convirtiendo valores:", error);
        setConvertedCurrentIncome(currentIncome);
        setConvertedTotalIncome(totalIncomeCOP);
        setConvertedTotalExpense(totalExpenseCOP);
      } finally {
        setLoading(false);
      }
    };

    if (initialized) {
      convertValues();
    }
  }, [currentIncome, totalIncomeCOP, totalExpenseCOP, selectedCurrency, initialized]);

  // Calcular balance con valores convertidos
  const balance = convertedCurrentIncome + convertedTotalIncome - convertedTotalExpense;
  const lowBalance = balance < 100;

  // Mensaje sobre el tipo de ingreso
  const incomeTypeMessage = user?.income_type === "biweekly" 
    ? "📅 Pago quincenal (mitad disponible ahora, resto el día 15)"
    : "💼 Pago mensual (ingreso completo disponible)";

  const nextResetMessage = user?.next_reset_date
    ? `Próximo reset: ${new Date(user.next_reset_date).toLocaleDateString('es-CO')}`
    : "";

  // Evolución del saldo ACUMULADO
  const sortedList = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const uniqueDates = [...new Set(sortedList.map(e => new Date(e.date).toLocaleDateString()))].sort(
    (a, b) => new Date(a) - new Date(b)
  );
  
  const today = new Date().toLocaleDateString();
  
  const evolutionLabels = [];
  const evolutionValues = [];
  
  if (uniqueDates.length > 0) {
    const firstDate = new Date(sortedList[0].date);
    const dayBefore = new Date(firstDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    evolutionLabels.push(dayBefore.toLocaleDateString());
    evolutionValues.push(convertedCurrentIncome);
  } else {
    evolutionLabels.push(today);
    evolutionValues.push(convertedCurrentIncome);
  }
  
  let runningBalance = convertedCurrentIncome;
  
  uniqueDates.forEach(async (date) => {
    const dayMovements = sortedList.filter(e => new Date(e.date).toLocaleDateString() === date);
    
    for (const e of dayMovements) {
      const amount = await convertFromCOP(Math.abs(Number(e.amount)) || 0);
      if (e.type === "income") {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }
    }
    
    evolutionLabels.push(date);
    evolutionValues.push(runningBalance);
  });

  const dataLine = {
    labels: evolutionLabels,
    datasets: [
      {
        label: "Saldo acumulado",
        data: evolutionValues,
        fill: true,
        borderColor: "#52c49d",
        backgroundColor: "rgba(82, 196, 157, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const dataBar = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        label: `Monto (${selectedCurrency})`,
        data: [convertedTotalIncome, convertedTotalExpense],
        backgroundColor: ["#52c49d", "#E74C3C"],
        borderRadius: 10,
      },
    ],
  };

  const dataDoughnut = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        data: [convertedTotalIncome, convertedTotalExpense],
        backgroundColor: ["#52c49d", "#f87171"],
        hoverOffset: 6,
      },
    ],
  };

  // Clasificación por categorías
  const categories = {};
  list
    .filter((e) => e.type === "expense")
    .forEach((e) => {
      const cat = normalizeCategory(e.category);
      const amount = Math.abs(Number(e.amount)) || 0;
      categories[cat] = (categories[cat] || 0) + amount;
    });

  // Alertas
  const alerts = [];
  if (lowBalance) alerts.push("⚠️ Saldo bajo: considera reducir gastos.");
  if (convertedTotalExpense > convertedCurrentIncome + convertedTotalIncome)
    alerts.push("🚨 Gastas más de lo que ingresas este período.");
  if (list.length === 0)
    alerts.push("📭 Aún no tienes movimientos registrados.");

  // Mostrar loader mientras carga datos iniciales o convierte
  if (expensesLoading || !initialized || (loading && (currentIncome > 0 || list.length > 0))) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.2rem',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '3rem' }}>
          {loading ? '💱' : '⏳'}
        </div>
        <div>
          {loading ? `Convirtiendo a ${selectedCurrency}...` : 'Cargando datos...'}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <CurrencySelector />
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
          <LogoutButton />
        </div>
      </nav>

      <div className="dashboard-content">
        <h1>📊 Dashboard Financiero ({selectedCurrency})</h1>

        {/* Info sobre tipo de ingreso */}
        {user && (
          <div style={{
            background: "#e0f7fa",
            border: "2px solid #00bcd4",
            borderRadius: "12px",
            padding: "15px 20px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            <p style={{ margin: "5px 0", fontSize: "1rem", fontWeight: "600", color: "#006064" }}>
              {incomeTypeMessage}
            </p>
            <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#00838f" }}>
              {nextResetMessage}
            </p>
          </div>
        )}

        {/* Resumen general */}
        <div className="summary-section">
          {user && (
            <div className="summary-card user-income">
              <h3>💎 Ingreso disponible ahora</h3>
              <p>{formatAmount(convertedCurrentIncome)}</p>
              <small style={{ fontSize: '0.75rem', color: '#006064', display: 'block', marginTop: '5px' }}>
                Original: ${currentIncome.toLocaleString('es-CO')} COP
              </small>
              <small style={{ fontSize: '0.7rem', color: '#00838f', display: 'block', marginTop: '3px' }}>
                {user.income_type === "biweekly" ? "Quincenal" : "Mensual"}
              </small>
            </div>
          )}
          <div className="summary-card income">
            <h3>💰 Total Ingresos Registrados</h3>
            <p>{formatAmount(convertedTotalIncome)}</p>
            <small style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginTop: '5px' }}>
              Original: ${totalIncomeCOP.toLocaleString('es-CO')} COP
            </small>
          </div>
          <div className="summary-card expense">
            <h3>💸 Total Gastos</h3>
            <p>{formatAmount(convertedTotalExpense)}</p>
            <small style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginTop: '5px' }}>
              Original: ${totalExpenseCOP.toLocaleString('es-CO')} COP
            </small>
          </div>
          <div className={`summary-card balance ${balance < 0 ? "negative" : "positive"}`}>
            <h3>💵 Balance</h3>
            <p>{formatAmount(balance)}</p>
            <small style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginTop: '5px' }}>
              Original: ${(currentIncome + totalIncomeCOP - totalExpenseCOP).toLocaleString('es-CO')} COP
            </small>
          </div>
        </div>

        {/* Alertas */}
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

        {/* Gráficas */}
        <div className="charts-container">
          <div className="chart-card">
            <h3>📈 Evolución del saldo</h3>
            <Line data={dataLine} options={{
              scales: {
                y: {
                  beginAtZero: false,
                  ticks: {
                    callback: function(value) {
                      return formatAmount(value);
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return 'Saldo: ' + formatAmount(context.parsed.y);
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
                      return formatAmount(value);
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': ' + formatAmount(context.parsed.y);
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
                      return label + ': ' + formatAmount(value) + ' (' + percentage + '%)';
                    }
                  }
                }
              }
            }} />
          </div>
        </div>

        {/* Clasificación por categorías */}
        <div className="categories-section">
          <h3>🧠 Clasificación automática</h3>
          <table className="category-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Monto Total ({selectedCurrency})</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categories).length > 0 ? (
                Object.entries(categories).map(([cat, val]) => (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td>{formatAmount(val)}</td>
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

      <footer className="app-footer">
        <p>Manuel Lozano & Cristobal Perez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}