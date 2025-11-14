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
  const { list, currentIncome, loading: expensesLoading, initialized } = useExpenses();
  const { isAuthenticated } = useAuth();
  const { convertFromCOP, formatAmount, selectedCurrency, setSelectedCurrency } = useCurrency();

  const [convertedCurrentIncome, setConvertedCurrentIncome] = useState(0);
  const [convertedTotalIncome, setConvertedTotalIncome] = useState(0);
  const [convertedTotalExpense, setConvertedTotalExpense] = useState(0);
  const [convertedBalance, setConvertedBalance] = useState(0);
  const [convertedList, setConvertedList] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [evolutionLabels, setEvolutionLabels] = useState([]);
  const [evolutionValues, setEvolutionValues] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔧 FIX: eliminar el desfase interpretando la fecha directamente del ISO YYYY-MM-DD
  const parseLocalDate = (isoString) => {
    if (!isoString) return "";
    const [y, m, d] = isoString.split("T")[0].split("-");
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    if (typeof setSelectedCurrency === "function" && selectedCurrency !== "COP") {
      setSelectedCurrency("COP");
    }
  }, []);

  const normalizeCategory = (text) => {
    if (!text) return "Sin Categoría";
    return text
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Totales base en COP
  const totalIncomeCOP = list
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);

  const totalExpenseCOP = list
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);

  // Conversión general + listas
  useEffect(() => {
    const buildData = async () => {
      setLoading(true);
      try {
        const [cCurrent, cTotalIncome, cTotalExpense] = await Promise.all([
          convertFromCOP(currentIncome || 0),
          convertFromCOP(totalIncomeCOP),
          convertFromCOP(totalExpenseCOP),
        ]);

        setConvertedCurrentIncome(cCurrent);
        setConvertedTotalIncome(cTotalIncome);
        setConvertedTotalExpense(cTotalExpense);
        setConvertedBalance(cCurrent + cTotalIncome - cTotalExpense);

        // Convertir lista
        const convertedItems = await Promise.all(
          list.map(async (item) => {
            const amountCOP = Math.abs(Number(item.amount) || 0);
            const converted = await convertFromCOP(amountCOP);
            return {
              ...item,
              convertedAmount: converted,
              fixedDate: parseLocalDate(item.date), // 🔧 fecha corregida
            };
          })
        );
        setConvertedList(convertedItems);

        // Agrupar por categoría (solo gastos)
        const categoryMap = {};
        for (const item of convertedItems) {
          if (item.type === "expense") {
            const category = normalizeCategory(item.category);
            categoryMap[category] = (categoryMap[category] || 0) + item.convertedAmount;
          }
        }

        const grouped = Object.entries(categoryMap).map(([cat, total]) => ({
          category: cat,
          total,
        }));
        setCategoryTotals(grouped);

        // Evolución del saldo
        const sortedAsc = [...convertedItems].sort(
          (a, b) => new Date(a.fixedDate) - new Date(b.fixedDate)
        );

        const uniqueDatesAsc = [...new Set(sortedAsc.map((e) => e.fixedDate))];

        const labels = [];
        const values = [];

        if (uniqueDatesAsc.length > 0) {
          const firstDate = new Date(uniqueDatesAsc[0]);
          const dayBefore = new Date(firstDate);
          dayBefore.setDate(dayBefore.getDate() - 1);
          labels.push(dayBefore.toISOString().split("T")[0]);
        } else {
          labels.push(new Date().toISOString().split("T")[0]);
        }

        values.push(cCurrent);
        let running = cCurrent;

        for (const date of uniqueDatesAsc) {
          const dayMovements = sortedAsc.filter((mv) => mv.fixedDate === date);

          for (const mv of dayMovements) {
            const conv = mv.convertedAmount;
            running += mv.type === "income" ? conv : -conv;
          }

          labels.push(date);
          values.push(running);
        }

        setEvolutionLabels(labels);
        setEvolutionValues(values);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (initialized) buildData();
  }, [
    list,
    currentIncome,
    totalIncomeCOP,
    totalExpenseCOP,
    selectedCurrency,
    initialized,
    convertFromCOP,
  ]);

  const sortedListDesc = [...convertedList].sort(
    (a, b) => new Date(b.fixedDate) - new Date(a.fixedDate)
  );

  const recentList = sortedListDesc.slice(0, 5);

  const dataLine = {
    labels: evolutionLabels,
    datasets: [
      {
        label: `Saldo acumulado (${selectedCurrency || "COP"})`,
        data: evolutionValues,
        fill: true,
        borderColor: "#2563eb",
        backgroundColor: "rgba(82, 196, 157, 0.12)",
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const dataBar = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        label: `Monto (${selectedCurrency || "COP"})`,
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

  if (expensesLoading || !initialized || loading) {
    return <div className="loader">Cargando datos...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/gastos">Gastos</Link>
          <Link to="/config">Configuración</Link>
          <LogoutButton />
        </div>
      </nav>

      <div className="dashboard-grid">
        {/* === SIDEBAR IZQUIERDA === */}
        <div className="sidebar compact">
          <div className="card small currency-card">
            <h4>Moneda</h4>
            <CurrencySelector />
          </div>

          {[
            { title: "Ingreso Disponible", value: convertedCurrentIncome },
            { title: "Total Ingresos", value: convertedTotalIncome },
            { title: "Total Gastos", value: convertedTotalExpense },
            { title: "Balance Final", value: convertedBalance },
          ].map((card, i) => (
            <div
              key={i}
              className={`card small ${card.title === "Balance Final" ? "balance-card" : ""}`}
            >
              <h4>{card.title}</h4>
              <p className="small-text">{formatAmount(card.value)}</p>
            </div>
          ))}
        </div>

        {/* === PANEL CENTRAL === */}
        <div className="main">
          <div className="chart large">
            <Line data={dataLine} />
          </div>

          <div className="chart small-row">
            <div className="chart small">
              <Bar data={dataBar} />
            </div>

            <div className="chart small">
              <Doughnut data={dataDoughnut} />
            </div>
          </div>
        </div>

        {/* === PANEL DERECHO === */}
        <div className="right">
          {/* Últimos movimientos */}
          <div className="right-section">
            <h3>Últimos movimientos</h3>
            <table>
              <tbody>
                {recentList.length > 0 ? (
                  recentList.map((item) => (
                    <tr key={item._id}>
                      <td>{normalizeCategory(item.title)}</td>
                      <td
                        className={
                          item.type === "income" ? "amount-income" : "amount-expense"
                        }
                      >
                        {item.type === "income" ? "+" : "-"}
                        {formatAmount(item.convertedAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">Sin movimientos recientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Gastos por categoría */}
          <div className="right-section">
            <h3>Gastos por categoría</h3>
            <table>
              <tbody>
                {categoryTotals.length > 0 ? (
                  categoryTotals.map((cat, idx) => (
                    <tr key={idx}>
                      <td>{cat.category}</td>
                      <td className="amount-expense">-{formatAmount(cat.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">Sin gastos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Manuel Lozano & Cristóbal Pérez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}
