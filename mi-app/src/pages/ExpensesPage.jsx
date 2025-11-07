import React, { useState } from "react";
import { Link } from "react-router-dom";
import ExpenseForm from "../components/Expenses/ExpenseForm";
import ExpenseTable from "../components/Expenses/ExpenseTable";
import { useExpenses } from "../context/ExpensesProvider";
import LogoutButton from "../components/LogoutButton";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../assets/styles/gastos.css";

export default function ExpensesPage() {
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("all");
  const [showRecurring, setShowRecurring] = useState(false);
  const { list } = useExpenses();

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Gastos e Ingresos", 14, 20);
    doc.autoTable({
      head: [["Título", "Categoría", "Tipo", "Monto", "Fecha", "Recurrente"]],
      body: list.map((i) => [
        i.title,
        i.category || "-",
        i.type === "income" ? "Ingreso" : "Gasto",
        `$${Math.abs(i.amount).toFixed(2)}`,
        new Date(i.date).toLocaleDateString(),
        i.is_recurring ? `Sí (día ${i.recurrence_day || "-"})` : "No",
      ]),
      startY: 30,
    });
    doc.save("Reporte_Financiero.pdf");
  };

  const filteredList = showRecurring
    ? list.filter((i) => i.is_recurring)
    : list;

  return (
    <div className="expenses-page">
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/"> Dashboard</Link>
          <Link to="/gastos"> Gastos</Link>
          <Link to="/config"> Configuración</Link>
          <LogoutButton />
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

          <button
            onClick={() => setShowRecurring(!showRecurring)}
            style={{
              background: showRecurring ? "#0077cc" : "#080459",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {showRecurring ? " Ver Todos" : " Ver Recurrentes"}
          </button>

          <button onClick={generatePDF} className="btn-pdf">
            📄 Exportar PDF
          </button>
        </div>

        <ExpenseForm />

        <div className="table-container">
          <h3>
            {showRecurring
              ? "Gastos Recurrentes"
              : " Historial de Ingresos y Gastos"}
          </h3>
          <ExpenseTable filter={filter} type={type} customList={filteredList} />
        </div>
      </div>

      <footer className="app-footer">
        <p>Manuel Lozano & Cristóbal Pérez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}
