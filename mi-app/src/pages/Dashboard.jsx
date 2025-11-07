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

  const [convertedCurrentIncome, setConvertedCurrentIncome] = useState(0);
  const [convertedTotalIncome, setConvertedTotalIncome] = useState(0);
  const [convertedTotalExpense, setConvertedTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  const normalizeCategory = (text) => {
    if (!text) return "Sin Categoría";
    return text
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const totalIncomeCOP = list
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);

  const totalExpenseCOP = list
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);

  useEffect(() => {
    const convertValues = async () => {
      setLoading(true);
      try {
        const [convertedCurrent, convertedIncome, convertedExpense] = await Promise.all([
          convertFromCOP(currentIncome),
          convertFromCOP(totalIncomeCOP),
          convertFromCOP(totalExpenseCOP),
        ]);
        setConvertedCurrentIncome(convertedCurrent);
        setConvertedTotalIncome(convertedIncome);
        setConvertedTotalExpense(convertedExpense);
      } catch {
        setConvertedCurrentIncome(currentIncome);
        setConvertedTotalIncome(totalIncomeCOP);
        setConvertedTotalExpense(totalExpenseCOP);
      } finally {
        setLoading(false);
      }
    };

    if (initialized) convertValues();
  }, [currentIncome, totalIncomeCOP, totalExpenseCOP, selectedCurrency, initialized]);

  const balance = convertedCurrentIncome + convertedTotalIncome - convertedTotalExpense;
  const lowBalance = balance < 100;

  const incomeTypeMessage =
    user?.income_type === "biweekly"
      ? "Pago quincenal (mitad disponible ahora, resto el día 15)"
      : "Pago mensual (ingreso completo disponible)";

  const nextResetMessage = user?.next_reset_date
    ? `Próximo reinicio: ${new Date(user.next_reset_date).toLocaleDateString("es-CO")}`
    : "";

  const sortedList = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
  const uniqueDates = [...new Set(sortedList.map((e) => new Date(e.date).toLocaleDateString()))].sort(
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
    const dayMovements = sortedList.filter(
      (e) => new Date(e.date).toLocaleDateString() === date
    );
    for (const e of dayMovements) {
      const amount = await convertFromCOP(Math.abs(Number(e.amount)) || 0);
      runningBalance += e.type === "income" ? amount : -amount;
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
        borderColor: "",
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
        backgroundColor: ["#080459", "#E74C3C"],
        borderRadius: 10,
      },
    ],
  };

  const dataDoughnut = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        data: [convertedTotalIncome, convertedTotalExpense],
        backgroundColor: ["#080459", "#f87171"],
        hoverOffset: 6,
      },
    ],
  };

  const categories = {};
  list
    .filter((e) => e.type === "expense")
    .forEach((e) => {
      const cat = normalizeCategory(e.category);
      const amount = Math.abs(Number(e.amount)) || 0;
      categories[cat] = (categories[cat] || 0) + amount;
    });

  const alerts = [];
  if (lowBalance) alerts.push("Saldo bajo: considera reducir gastos.");
  if (convertedTotalExpense > convertedCurrentIncome + convertedTotalIncome)
    alerts.push("Gastas más de lo que ingresas este período.");
  if (list.length === 0) alerts.push("Aún no tienes movimientos registrados.");

  if (expensesLoading || !initialized || (loading && (currentIncome > 0 || list.length > 0))) {
    return <div className="loader">Cargando datos...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <CurrencySelector />
          <Link to="/">Dashboard</Link>
          <Link to="/gastos">Gastos</Link>
          <Link to="/config">Configuración</Link>
          <LogoutButton />
        </div>
      </nav>

      <div className="dashboard-content">
        <h1> </h1>
        {user && (
          <div className="income-info">
            <p>{incomeTypeMessage}</p>
            <p>{nextResetMessage}</p>
          </div>
        )}

        <div className="summary-section">
          {user && (
            <div className="summary-card user-income">
              <h3>Ingreso disponible ahora</h3>
              <p>{formatAmount(convertedCurrentIncome)}</p>
            </div>
          )}
          <div className="summary-card income">
            <h3>Total Ingresos Registrados</h3>
            <p>{formatAmount(convertedTotalIncome)}</p>
          </div>
          <div className="summary-card expense">
            <h3>Total Gastos</h3>
            <p>{formatAmount(convertedTotalExpense)}</p>
          </div>
          <div className={`summary-card balance ${balance < 0 ? "negative" : "positive"}`}>
            <h3>Balance</h3>
            <p>{formatAmount(balance)}</p>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="alerts-section">
            <h3>Alertas</h3>
            <ul>
              {alerts.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="charts-container">
          <div className="chart-card">
            <h3>Evolución del saldo</h3>
            <Line data={dataLine} />
          </div>
          <div className="chart-card">
            <h3>Ingresos vs Gastos</h3>
            <Bar data={dataBar} />
          </div>
          <div className="chart-card">
            <h3>Distribución Ingresos/Gastos</h3>
            <Doughnut data={dataDoughnut} />
          </div>
        </div>

        <div className="categories-section">
          <h3>Clasificación automática</h3>
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
                  <td colSpan="2">No hay gastos registrados</td>
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
