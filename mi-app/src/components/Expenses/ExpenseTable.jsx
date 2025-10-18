import React from "react";
import { useExpenses } from "../../context/ExpensesProvider";
import api from "../../Api/apiClient";

export default function ExpenseTable({ filter = "", type = "all" }) {
  const { list, loadExpenses } = useExpenses();

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este registro?")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Registro eliminado");
      loadExpenses();
    } catch (err) {
      console.error(err);
      alert("❌ Error al eliminar registro");
    }
  };

  const filtered = list.filter((exp) => {
    const matchesFilter =
      exp.title.toLowerCase().includes(filter.toLowerCase()) ||
      exp.description?.toLowerCase().includes(filter.toLowerCase());
    const matchesType = type === "all" || exp.type === type;
    return matchesFilter && matchesType;
  });

  if (filtered.length === 0) {
    return <p style={{ textAlign: "center", color: "#999" }}>No hay registros</p>;
  }

  return (
    <table className="expense-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Categoría</th>
          <th>Tipo</th>
          <th>Monto</th>
          <th>Fecha</th>
          <th>Descripción</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((exp) => {
          const isIncome = exp.type === "income";
          return (
            <tr key={exp.id}>
              <td>{exp.title}</td>
              <td>{exp.category}</td>
              <td>{isIncome ? "Ingreso" : "Gasto"}</td>
              <td className={isIncome ? "amount-income" : "amount-expense"}>
                ${Math.abs(exp.amount).toFixed(2)}
              </td>
              <td>{new Date(exp.date).toLocaleDateString()}</td>
              <td>{exp.description || "-"}</td>
              <td>
                <button onClick={() => handleDelete(exp.id)}>🗑️ Eliminar</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
