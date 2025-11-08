import "../../assets/styles/ExpenseForm.css";
import React, { useState, useEffect } from "react";
import { useExpenses } from "../../context/ExpensesProvider";
import { useToast } from "../Toast/Toast";

export default function ExpenseForm() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDay, setRecurrenceDay] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { addExpense, list } = useExpenses();
  const { addToast } = useToast();

  useEffect(() => {
    const uniqueCategories = [...new Set(list.map(e => e.category).filter(Boolean))];
    setSuggestions(uniqueCategories);
  }, [list]);

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
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(category.toLowerCase())
  );

  const submit = async (e) => {
    e.preventDefault();
    try {
      const normalizedCategory = normalizeCategory(category);
  
      // Construir el objeto a enviar al backend
      const finalData = {
        title,
        amount: Math.abs(Number(amount)),
        category: normalizedCategory,
        description,
        date: new Date(date).toISOString(), // <-- formato ISO
        type: type === "" ? "expense" : type,
        is_recurring: isRecurring,
        recurrence_day: isRecurring ? recurrenceDay : null,
      };
  
      // Enviar al backend
      await addExpense(finalData);
  
      // Resetear formulario
      setTitle("");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setType("expense");
      setIsRecurring(false);
      setRecurrenceDay(1);
  
      addToast(
        `${type === "income" ? "Ingreso" : "Gasto"} ${
          isRecurring ? "recurrente" : ""
        } agregado correctamente`,
        "success"
      );
    } catch (err) {
      console.error(err);
      addToast("Error al agregar el registro. Por favor intenta nuevamente.", "error");
    }
  };
  

  return (
    <div className="expense-form-wrapper">
      <form className="expense-form" onSubmit={submit}>
        <h2 className="form-title">Nuevo Registro</h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (ej: Netflix)"
          required
        />

        <input
          value={amount}
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d.]/g, "");
            setAmount(value);
          }}
          placeholder="Valor"
          type="text"
          inputMode="decimal"
          required
        />

        {/* --- Tipo y Recurrente --- */}
        <div className="form-type-recurring">
        <div className="select-container">
  <select 
    value={type} 
    onChange={(e) => setType(e.target.value)} 
    required
  >
    <option value="" disabled>Tipo</option>
    <option value="expense">Gasto</option>
    <option value="income">Ingreso</option>
  </select>
</div>


          <div className="recurring-checkbox">
            <label className="checkbox-label-inline">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <span>Mensual</span>
            </label>
          </div>
        </div>

        <div className="form-group relative">
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
            <div className="suggestions-box">
              {filteredSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    setCategory(s);
                    setShowSuggestions(false);
                  }}
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

        {isRecurring && (
          <div className="recurrence-day">
            <label>Se repite el día:</label>
            <input
              type="number"
              min="1"
              max="31"
              value={recurrenceDay}
              onChange={(e) => setRecurrenceDay(Number(e.target.value))}
            />
            <span>de cada mes</span>
          </div>
        )}

        <button type="submit" className="submit-btn">
          Agregar {type === "income" ? "Ingreso" : "Gasto"}
          {isRecurring && " Recurrente"}
        </button>
      </form>
    </div>
  );
}
