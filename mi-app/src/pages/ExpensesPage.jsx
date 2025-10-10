import React from "react";
import ExpenseForm from "../components/Expenses/ExpenseForm";
import ExpenseTable from "../components/Expenses/ExpenseTable";
import "../assets/styles/gastos.css"; // asegúrate de la ruta

export default function ExpensesPage() {
  return (
    <div className="expenses-page">
      <h1>Gastos</h1>
      <div className="expenses-content">
        <ExpenseForm />
        <ExpenseTable />
      </div>
    </div>
  );
}

