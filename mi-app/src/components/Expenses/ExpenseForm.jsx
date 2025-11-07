import React, { useState, useEffect } from "react";
import { useExpenses } from "../../context/ExpensesProvider";

export default function ExpenseForm() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("expense");
  
  // 🔁 Nuevos estados para recurrencia
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDay, setRecurrenceDay] = useState(1);
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { addExpense, list } = useExpenses();

  useEffect(() => {
    const uniqueCategories = [...new Set(list.map(e => e.category).filter(Boolean))];
    setSuggestions(uniqueCategories);
  }, [list]);

  // 🔁 Actualizar día de recurrencia cuando cambia la fecha
  useEffect(() => {
    if (isRecurring && date) {
      const day = new Date(date).getDate();
      setRecurrenceDay(day);
    }
  }, [date, isRecurring]);

  const normalizeCategory = (text) => {
    if (!text) return "";
    return text
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(category.toLowerCase())
  );

  const submit = async (e) => {
    e.preventDefault();
    try {
      const normalizedCategory = normalizeCategory(category);
      
      const expenseData = {
        title,
        amount: Math.abs(Number(amount)),
        category: normalizedCategory,
        description,
        date: new Date(date).toISOString(),
        type,
        is_recurring: isRecurring,
        recurrence_day: isRecurring ? recurrenceDay : null,
      };

      console.log("📤 Enviando gasto:", expenseData);
      
      await addExpense(expenseData);

      // Reset form
      setTitle("");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setType("expense");
      setIsRecurring(false);
      setRecurrenceDay(1);

      alert(`✅ ${type === "income" ? "Ingreso" : "Gasto"} ${isRecurring ? "recurrente" : ""} agregado`);
    } catch (err) {
      console.error(err);
      alert("❌ Error al agregar registro");
    }
  };

  return (
    <div className="form-container">
      <h3>➕ Nuevo Registro</h3>
      <form className="main-form" onSubmit={submit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (ej: Netflix)"
          required
        />
        
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Valor"
          type="number"
          min="0.01"
          step="0.01"
          required
        />
        
        <label>Tipo:</label>
        <select value={type} onChange={(e) => setType(e.target.value)} required>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
        
        <div style={{ position: "relative", flex: "1 1 180px" }}>
          <input
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Categoría"
            required
          />
          
          {showSuggestions && filteredSuggestions.length > 0 && category && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "8px",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 1000,
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
            }}>
              {filteredSuggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setCategory(s);
                    setShowSuggestions(false);
                  }}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: i < filteredSuggestions.length - 1 ? "1px solid #eee" : "none"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f0f0f0"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
        />
        
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          required
        />
        
        {/* 🔁 Sección de recurrencia */}
        <div style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          gap: "15px",
          padding: "10px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          border: "1px solid #e0e0e0"
        }}>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            cursor: "pointer",
            fontSize: "0.95rem"
          }}>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <span>🔁 Es un gasto recurrente (mensual)</span>
          </label>
          
          {isRecurring && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "0.9rem", color: "#555" }}>
                Se repite el día:
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={recurrenceDay}
                onChange={(e) => setRecurrenceDay(Number(e.target.value))}
                style={{
                  width: "60px",
                  padding: "5px 8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc"
                }}
              />
              <span style={{ fontSize: "0.85rem", color: "#666" }}>
                de cada mes
              </span>
            </div>
          )}
        </div>
        
        <button type="submit" style={{ gridColumn: "1 / -1" }}>
          {isRecurring ? "🔁" : "➕"} Agregar {type === "income" ? "Ingreso" : "Gasto"}
          {isRecurring && " Recurrente"}
        </button>
      </form>
    </div>
  );
}