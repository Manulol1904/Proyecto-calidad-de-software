import React from "react";
import { useExpenses } from "../../context/ExpensesProvider";
import { useToast } from "../Toast/Toast";
import api from "../../Api/apiClient";

export default function ExpenseTable({ filter = "", type = "all", customList }) {
  const { list, loadExpenses } = useExpenses();
  const { addToast } = useToast();

  // ✅ Usa lista personalizada si viene desde ExpensesPage
  const data = customList || list;

  const handleDelete = async (id, isRecurring, title) => {
    if (isRecurring) {
      const deleteFuture = window.confirm(
        `¿Deseas eliminar el gasto recurrente "${title}"?\n\n` +
        "• Sí = Elimina todo (incluyendo futuras instancias)\n" +
        "• No = Solo elimina esta configuración"
      );

      try {
        const token = localStorage.getItem("token");
        await api.delete(`/expenses/recurring/${id}?delete_future=${deleteFuture}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addToast("Gasto recurrente eliminado correctamente", "success");
        loadExpenses();
      } catch (err) {
        console.error(err);
        addToast("Error al eliminar el gasto recurrente", "error");
      }
    } else {
      if (!window.confirm(`¿Seguro que quieres eliminar "${title}"?`)) return;

      try {
        const token = localStorage.getItem("token");
        await api.delete(`/expenses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addToast("Registro eliminado correctamente", "success");
        loadExpenses();
      } catch (err) {
        console.error(err);
        addToast("Error al eliminar el registro", "error");
      }
    }
  };

  // ✅ Filtro por texto y tipo
  const filtered = data.filter((exp) => {
    const matchesFilter =
      exp.title.toLowerCase().includes(filter.toLowerCase()) ||
      exp.description?.toLowerCase().includes(filter.toLowerCase());
    const matchesType = type === "all" || exp.type === type;
    return matchesFilter && matchesType;
  });

  if (filtered.length === 0) {
    return <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>No hay registros</p>;
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
          <th>Recurrencia</th>
          <th>Descripción</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((exp) => {
          const isIncome = exp.type === "income";
          const amount = Math.abs(Number(exp.amount));
          
          // ✅ Verificación correcta: el backend envía "None" como string
          const isRecurring = exp.is_recurring === true;
          const isInstance = exp.parent_recurring_id && 
                            exp.parent_recurring_id !== "None" && 
                            exp.parent_recurring_id !== null && 
                            exp.parent_recurring_id !== undefined;
          const recurrenceDay = exp.recurrence_day;

          return (
            <tr
              key={exp.id}
              style={{
                backgroundColor: isRecurring ? "#f0f9ff" : "white",
              }}
            >
              <td>
                {isRecurring && <span style={{ marginRight: "5px" }}>🔁</span>}
                {isInstance && <span style={{ marginRight: "5px" }}>↳</span>}
                {exp.title}
              </td>
              <td>{exp.category}</td>
              <td
                style={{
                  color: isIncome ? "#10b981" : "#ef4444",
                  fontWeight: "600",
                }}
              >
                {isIncome ? "Ingreso" : "Gasto"}
              </td>
              <td className={isIncome ? "amount-income" : "amount-expense"}>
                ${amount.toFixed(2)}
              </td>
              <td>{new Date(exp.date).toISOString().split("T")[0]}</td>
              <td>
                {isRecurring && recurrenceDay ? (
                  <span className="badge-recurring">
                    Día {recurrenceDay}
                  </span>
                ) : isInstance ? (
                  <span className="badge-auto">
                    Auto
                  </span>
                ) : (
                  <span style={{ color: "#999" }}>-</span>
                )}
              </td>
              <td>{exp.description || "-"}</td>
              <td>
                <button
                  onClick={() => handleDelete(exp.id, isRecurring, exp.title)}
                  className="btn-delete"
                  title="Eliminar"
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}