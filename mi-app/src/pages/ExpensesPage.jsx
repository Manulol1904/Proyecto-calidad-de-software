import React, { useState } from "react";
import { Link } from "react-router-dom";
import ExpenseForm from "../components/Expenses/ExpenseForm";
import ExpenseTable from "../components/Expenses/ExpenseTable";
import "../assets/styles/gastos.css";

export default function ExpensesPage() {
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("all");

  const handleSearch = (e) => setFilter(e.target.value);
  const handleTypeChange = (e) => setType(e.target.value);

  return (
    <div className="expenses-page">
      {/* 🔹 Navbar igual al Dashboard */}
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/">🏠 Dashboard</Link>
          <Link to="/gastos">💰 Gastos</Link>
          <Link to="/config">⚙️ Configuración</Link>
        </div>
      </nav>

      {/* 🔹 Contenido principal */}
      <div className="expenses-content">
        <h1>Gestión Financiera</h1>
        <p className="subtitle">
          Administra tus gastos e ingresos de forma sencilla.
        </p>

        {/* 🔹 Barra de filtros */}
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
        </div>

        {/* 🔹 Secciones principales */}
        <div className="expenses-sections">
          <div className="form-container">
            <h3>➕ Agregar nuevo gasto</h3>
            <ExpenseForm />
          </div>

          {/* 🔹 Nuevo formulario de ingreso */}
          <div className="form-container ingreso-container">
            <h3>💵 Agregar nuevo ingreso</h3>
            <form className="ingreso-form">
              <input
                type="text"
                placeholder="Descripción del ingreso"
                className="form-input"
                required
              />
              <input
                type="number"
                placeholder="Monto del ingreso"
                className="form-input"
                required
              />
              <input
                type="date"
                className="form-input"
                required
              />
              <button type="submit" className="btn-ingreso">
                Guardar ingreso
              </button>
            </form>
          </div>

          <div className="table-container">
            <h3>📊 Historial de movimientos</h3>
            <ExpenseTable filter={filter} type={type} />
          </div>
        </div>
      </div>
    </div>
  );
}
