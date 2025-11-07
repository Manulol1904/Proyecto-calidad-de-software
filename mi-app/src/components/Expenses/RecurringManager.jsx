// mi-app/src/components/Expenses/RecurringManager.jsx
import React, { useState, useEffect } from "react";
import api from "../../Api/apiClient";

export default function RecurringManager() {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecurring();
  }, []);

  const loadRecurring = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/expenses/recurring", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecurring(res.data);
    } catch (err) {
      console.error("Error cargando recurrentes:", err);
    }
  };

  const processRecurring = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post("/expenses/recurring/process", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${res.data.created} gastos recurrentes procesados`);
      loadRecurring();
    } catch (err) {
      console.error("Error procesando:", err);
      alert("❌ Error al procesar gastos recurrentes");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecurring = async (id) => {
    const deleteFuture = window.confirm(
      "¿Eliminar también las instancias futuras?\n\n✅ Sí | ❌ No"
    );
    
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/expenses/recurring/${id}?delete_future=${deleteFuture}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Eliminado");
      loadRecurring();
    } catch (err) {
      console.error(err);
      alert("❌ Error al eliminar");
    }
  };

  return (
    <div style={{
      background: "white",
      padding: "25px",
      borderRadius: "16px",
      boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
      marginBottom: "30px"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h3 style={{ margin: 0, color: "#0077cc" }}>
          🔁 Gastos Recurrentes Configurados
        </h3>
        <button
          onClick={processRecurring}
          disabled={loading}
          style={{
            background: "#080459",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "500",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "⏳ Procesando..." : "🔄 Procesar Ahora"}
        </button>
      </div>

      {recurring.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>
          No tienes gastos recurrentes configurados
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "15px"
        }}>
          {recurring.map((r) => (
            <div key={r.id} style={{
              border: "2px solid #0077cc",
              borderRadius: "12px",
              padding: "15px",
              background: "#f0f9ff"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "10px"
              }}>
                <h4 style={{ margin: 0, color: "#0077cc", fontSize: "1.1rem" }}>
                  {r.title}
                </h4>
                <span style={{
                  background: "#0077cc",
                  color: "white",
                  padding: "3px 8px",
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  fontWeight: "600"
                }}>
                  Día {r.recurrence_day}
                </span>
              </div>
              
              <p style={{ margin: "8px 0", color: "#555", fontSize: "0.9rem" }}>
                <strong>Categoría:</strong> {r.category}
              </p>
              
              <p style={{
                margin: "8px 0",
                fontSize: "1.2rem",
                fontWeight: "700",
                color: r.type === "income" ? "#4caf50" : "#e74c3c"
              }}>
                {r.type === "income" ? "+" : "-"} ${Math.abs(r.amount).toFixed(2)}
              </p>
              
              {r.description && (
                <p style={{
                  margin: "8px 0",
                  fontSize: "0.85rem",
                  color: "#666",
                  fontStyle: "italic"
                }}>
                  {r.description}
                </p>
              )}
              
              <button
                onClick={() => deleteRecurring(r.id)}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                🗑️ Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: "20px",
        padding: "15px",
        background: "#fff3cd",
        borderLeft: "4px solid #ffb300",
        borderRadius: "8px"
      }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#856404" }}>
          💡 <strong>Nota:</strong> Los gastos recurrentes se crean automáticamente cada mes 
          en la fecha configurada. También puedes procesarlos manualmente con el botón "Procesar Ahora".
        </p>
      </div>
    </div>
  );
}