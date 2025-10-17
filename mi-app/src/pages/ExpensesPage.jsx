import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ExpenseTable from "../components/Expenses/ExpenseTable";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
import "../assets/styles/gastos.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ExpensesPage() {
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("all");
  const [list, setList] = useState([]);
  const [autoList, setAutoList] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const handleSearch = (e) => setFilter(e.target.value);
  const handleTypeChange = (e) => setType(e.target.value);

  // 🔹 Clasificación automática de categorías
  const categorize = (desc) => {
    const text = desc.toLowerCase();
    if (text.includes("comida") || text.includes("super")) return "Alimentación";
    if (text.includes("transporte") || text.includes("bus")) return "Transporte";
    if (text.includes("luz") || text.includes("agua") || text.includes("servicio")) return "Servicios";
    if (text.includes("cine") || text.includes("netflix")) return "Entretenimiento";
    return "Otros";
  };

  // 🔹 Registro de movimientos
  const handleAdd = (e) => {
    e.preventDefault();
    const form = e.target;
    const desc = form.desc.value;
    const amount = parseFloat(form.amount.value);
    const date = form.date.value;
    const tipo = form.tipo.value;
    const categoria = categorize(desc);

    const newEntry = {
      id: list.length + 1,
      desc,
      amount,
      date,
      tipo,
      categoria,
    };
    setList([...list, newEntry]);

    // alerta si el saldo cae bajo
    const totalIncome = list.filter((x) => x.tipo === "income").reduce((s, x) => s + x.amount, 0);
    const totalExpense = list.filter((x) => x.tipo === "expense").reduce((s, x) => s + x.amount, 0);
    const saldo = totalIncome - totalExpense;
    if (saldo < 100) {
      setAlertas([...alertas, "⚠️ Tu saldo está por debajo de $100"]);
    }

    form.reset();
  };

  // 🔹 Automatización recurrente
  const handleAutoAdd = (e) => {
    e.preventDefault();
    const form = e.target;
    const desc = form.desc.value;
    const amount = parseFloat(form.amount.value);
    const freq = form.freq.value;
    const pin = form.pin.value;
    const tipo = form.tipo.value;
    const categoria = categorize(desc);

    const newAuto = { id: autoList.length + 1, desc, amount, freq, pin, tipo, categoria };
    setAutoList([...autoList, newAuto]);
    setAlertas([...alertas, `📌 Recordatorio fijado: ${desc}`]);
    form.reset();
  };

  // 🔹 Generar PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Movimientos", 14, 20);
    doc.autoTable({
      head: [["ID", "Descripción", "Tipo", "Monto", "Categoría", "Fecha"]],
      body: list.map((i) => [i.id, i.desc, i.tipo, `$${i.amount.toFixed(2)}`, i.categoria, i.date]),
      startY: 30,
    });
    doc.save("Movimientos.pdf");
  };

  // 🔹 Datos para la gráfica
  const grouped = {};
  list.forEach((i) => {
    const month = new Date(i.date).toLocaleString("default", { month: "short" });
    grouped[month] = grouped[month] || { income: 0, expense: 0 };
    grouped[month][i.tipo] += i.amount;
  });

  const labels = Object.keys(grouped);
  const data = {
    labels,
    datasets: [
      {
        label: "Ingresos",
        data: labels.map((l) => grouped[l].income || 0),
        borderColor: "#52c49d",
        backgroundColor: "rgba(82,196,157,0.2)",
        tension: 0.3,
      },
      {
        label: "Gastos",
        data: labels.map((l) => grouped[l].expense || 0),
        borderColor: "#ff6b6b",
        backgroundColor: "rgba(255,107,107,0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="expenses-page">
      {/* 🔹 Navbar */}
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
        </div>
      </nav>

      {/* 🔹 Alertas */}
      {alertas.length > 0 && (
        <div className="alert-box">
          {alertas.map((a, i) => (
            <p key={i}>{a}</p>
          ))}
        </div>
      )}

      <div className="expenses-content">
        <h1>Gestión Financiera</h1>

        {/* 🔹 Filtros */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={filter}
            onChange={handleSearch}
          />
          <select value={type} onChange={handleTypeChange}>
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <button onClick={generatePDF} className="btn-pdf">📄 Exportar PDF</button>
        </div>

        {/* 🔹 Formulario combinado */}
        <div className="form-container">
          <h3>➕ Nuevo Movimiento</h3>
          <form className="main-form" onSubmit={handleAdd}>
            <input type="text" name="desc" placeholder="Descripción" required />
            <input type="number" name="amount" placeholder="Monto" required />
            <input type="date" name="date" required />
            <select name="tipo" required>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
            <button type="submit" className="btn-ingreso">Guardar</button>
          </form>
        </div>

        {/* 🔹 Automatización */}
        <div className="form-container">
          <h3>🔁 Automatizar Gasto/Ingreso</h3>
          <form className="auto-form" onSubmit={handleAutoAdd}>
            <input type="text" name="desc" placeholder="Descripción" required />
            <input type="number" name="amount" placeholder="Monto" required />
            <select name="tipo" required>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
            <select name="freq">
              <option value="mensual">Mensual</option>
              <option value="semanal">Semanal</option>
              <option value="diario">Diario</option>
            </select>
            <input type="text" name="pin" placeholder="🔔 Nota o recordatorio" />
            <button type="submit" className="btn-auto">Guardar Auto</button>
          </form>
        </div>

        {/* 🔹 Tabla de Movimientos */}
        <div className="table-container">
          <h3>📊 Historial de movimientos</h3>
          <ExpenseTable filter={filter} type={type} />
        </div>

        {/* 🔹 Gráfica mensual */}
        <div className="chart-container">
          <h3>📆 Ingresos vs Gastos (Mensual)</h3>
          <Line data={data} />
        </div>
      </div>
    </div>
  );
}
