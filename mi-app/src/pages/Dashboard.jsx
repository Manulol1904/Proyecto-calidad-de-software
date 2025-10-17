import React from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "../context/ExpensesProvider";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../assets/styles/dash.css"; // 👈 importa el CSS

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { list } = useExpenses();

  // Agrupación de datos
  const grouped = {};
  list.forEach((e) => {
    const day = new Date(e.date).toLocaleDateString();
    grouped[day] =
      (grouped[day] || 0) + (e.type === "income" ? e.amount : -e.amount);
  });

  const labels = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
  const dataValues = labels.map((l) => grouped[l]);

  const data = {
    labels,
    datasets: [
      {
        label: "Saldo neto por día",
        data: dataValues,
        fill: true,
        borderColor: "#52c49d",
        backgroundColor: "rgba(82, 196, 157, 0.15)",
        tension: 0.3,
        pointBackgroundColor: "#52c49d",
        pointRadius: 5,
      },
    ],
  };

  return (
    <div className="dashboard">
      {/* 🔹 Barra de navegación */}
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
        <h1>Dashboard</h1>
        <div className="dashboard-chart">
          <Line data={data} />
        </div>
      </div>
    </div>
  );
}
