import React from "react";
import { useExpenses } from "../../context/ExpensesProvider";
import api from "../../Api/apiClient";

export default function ExpenseTable({ filter = "", type = "all", customList }) {
  const { list, loadExpenses } = useExpenses();

  // ✅ Usa lista personalizada si viene desde ExpensesPage
  const data = customList || list;

  const handleDelete = async (id, isRecurring) => {
    if (isRecurring) {
      const deleteFuture = window.confirm(
        "Este es un gasto recurrente. ¿Deseas eliminar también las futuras instancias automáticas?\n\n" +
          "✅ Sí = Elimina todo\n" +
          "❌ No = Solo elimina esta configuración"
      );

      try {
        const token = localStorage.getItem("token");
        await api.delete(`/expenses/recurring/${id}?delete_future=${deleteFuture}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("✅ Gasto recurrente eliminado");
        loadExpenses();
      } catch (err) {
        console.error(err);
        alert("❌ Error al eliminar gasto recurrente");
      }
    } else {
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
          <th>Recurrencia</th>
          <th>Descripción</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((exp) => {
          const isIncome = exp.type === "income";
          const amount = Math.abs(Number(exp.amount));
          const isRecurring = exp.is_recurring === true;
          const isInstance = exp.parent_recurring_id != null;
          const recurrenceDay = exp.recurrence_day;

          console.log(`Expense: ${exp.title}`, {
            isRecurring,
            recurrenceDay,
            isInstance,
            raw: exp,
          });

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
                  color: isIncome ? "#4caf50" : "#e74c3c",
                  fontWeight: "600",
                }}
              >
                {isIncome ? " Ingreso" : " Gasto"}
              </td>
              <td className={isIncome ? "amount-income" : "amount-expense"}>
                ${amount.toFixed(2)}
              </td>
              <td>{new Date(exp.date).toLocaleDateString()}</td>

              <td>
                {isRecurring && recurrenceDay ? (
                  <span
                    style={{
                      background: "#0077cc",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                    }}
                  >
                    🔁 Día {recurrenceDay}
                  </span>
                ) : isInstance ? (
                  <span
                    style={{
                      background: "#e0e0e0",
                      color: "#555",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                    }}
                  >
                    Auto
                  </span>
                ) : (
                  <span style={{ color: "#999" }}>-</span>
                )}
              </td>

              <td>{exp.description || "-"}</td>

              <td>
                <button
                  onClick={() => handleDelete(exp.id, isRecurring)}
                  style={{
                    background: isRecurring ? "#dc2626" : "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {isRecurring ? "Eliminar recurrente" : "Eliminar"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
