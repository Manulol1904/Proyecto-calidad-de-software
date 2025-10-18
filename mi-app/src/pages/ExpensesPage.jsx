import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ExpenseForm from "../components/Expenses/ExpenseForm";
import ExpenseTable from "../components/Expenses/ExpenseTable";
import { useExpenses } from "../context/ExpensesProvider";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../assets/styles/gastos.css";

export default function ExpensesPage() {
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("all");
  const { list } = useExpenses();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Gastos e Ingresos", 14, 20);
    doc.autoTable({
      head: [["Título", "Categoría", "Monto", "Fecha"]],
      body: list.map((i) => [
        i.title,
        i.category || "-",
        `$${i.amount.toFixed(2)}`,
        new Date(i.date).toLocaleDateString(),
      ]),
      startY: 30,
    });
    doc.save("Reporte_Financiero.pdf");
  };

  return (
    <div className="expenses-page">
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

      <div className="expenses-content">
        <h1>Gestión de Ingresos y Gastos</h1>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Buscar..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <button onClick={generatePDF} className="btn-pdf">
            📄 Exportar PDF
          </button>
        </div>

        {/* ✅ Formulario actualizado con selector de tipo */}
        <ExpenseForm />

        <div className="table-container">
          <h3>📊 Historial de Ingresos y Gastos</h3>
          <ExpenseTable filter={filter} type={type} />
        </div>
      </div>

      <footer className="app-footer">
        <p>Manuel Lozano & Cristóbal Pérez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}
